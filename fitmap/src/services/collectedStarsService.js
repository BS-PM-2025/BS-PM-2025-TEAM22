// src/services/collectedStarsService.js
import { supabase } from "../utils/supabaseClient";
import { updateUserInventory } from "./userService";

// מטמון מקומי עם תמיכה בפקיעת תוקף
const cache = {
  collectedStars: {},
  collectedStarIds: {},
  starPointsTotals: {},
  expirations: {},

  set: function (key, userId, value, expirationMinutes = 10) {
    if (!this[key]) {
      this[key] = {};
    }
    this[key][userId] = value;
    this.expirations[`${key}_${userId}`] =
      Date.now() + expirationMinutes * 60 * 1000;
  },

  get: function (key, userId) {
    if (!this[key] || !this[key][userId]) {
      return null;
    }

    const expirationTime = this.expirations[`${key}_${userId}`];
    if (!expirationTime || Date.now() > expirationTime) {
      delete this[key][userId];
      delete this.expirations[`${key}_${userId}`];
      return null;
    }

    return this[key][userId];
  },

  invalidate: function (userId) {
    // מחיקת כל הנתונים המטומכנים עבור משתמש ספציפי
    if (this.collectedStars[userId]) delete this.collectedStars[userId];
    if (this.collectedStarIds[userId]) delete this.collectedStarIds[userId];
    if (this.starPointsTotals[userId]) delete this.starPointsTotals[userId];

    // מחיקת זמני תפוגה
    Object.keys(this.expirations).forEach((key) => {
      if (key.endsWith(`_${userId}`)) {
        delete this.expirations[key];
      }
    });
  },
};
/**
 * שומר כוכב שנאסף בדאטאבייס
 * @param {Object} star - אובייקט הכוכב שנאסף
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<boolean>} - האם השמירה הצליחה
 */
export async function saveCollectedStar(star, userId) {
  if (!userId || !star?.id) {
    console.warn("חסר userId או star.id בפונקציה saveCollectedStar");
    return false;
  }

  try {
    // שמירה ב-localStorage כגיבוי
    const localStars = JSON.parse(
      localStorage.getItem(`collectedStars_${userId}`) || "[]"
    );
    if (!localStars.includes(star.id)) {
      localStars.push(star.id);
      localStorage.setItem(
        `collectedStars_${userId}`,
        JSON.stringify(localStars)
      );
    }

    // שמירת מספר הנקודות הכולל ב-localStorage
    const localPoints = parseInt(
      localStorage.getItem(`starPoints_${userId}`) || "0"
    );
    localStorage.setItem(
      `starPoints_${userId}`,
      localPoints + (star.points || 0)
    );

    // הכנת הנתונים לשמירה
    const now = new Date().toISOString();
    const starType = star.type || "regular";
    const xpEarned = star.xp_earned || star.points * 3;
    const coinsEarned = star.coins_earned || star.points;

    // שמירה בדאטאבייס באופן ישיר
    const { error } = await supabase.from("collected_stars").insert({
      user_id: userId,
      star_id: star.id,
      lat: star.lat,
      lng: star.lng,
      points: star.points || 1,
      star_type: starType,
      zone_id: star.zone_id || null,
      event_id: star.event_id || null,
      xp_earned: xpEarned,
      coins_earned: coinsEarned,
      route_id: star.route_id || null,
      collected_at: now,
    });

    if (error) {
      console.error("שגיאה בשמירת כוכב:", error);
      return false;
    }

    // הוספת XP ומטבעות למשתמש
    await updateUserInventory(userId, {
      xp: xpEarned,
      coins: coinsEarned,
    });

    // עדכון הישגים ומשימות
    await _updateStarAchievements(userId, starType);
    await _updateQuestProgress(userId, starType);

    // ניקוי מטמון
    cache.invalidate(userId);

    return true;
  } catch (error) {
    console.error("שגיאה בשמירת כוכב:", error);
    return false;
  }
}
/**
 * עדכון התקדמות הישגים הקשורים לכוכבים
 * @private
 * @param {string} userId - מזהה המשתמש
 * @param {string} starType - סוג הכוכב שנאסף
 */
async function _updateStarAchievements(userId, starType) {
  try {
    // מיפוי בין סוגי כוכבים לקטגוריות הישגים
    const achievementCategories = {
      regular: "stars_regular",
      gold: "stars_gold",
      silver: "stars_silver",
      bronze: "stars_bronze",
      event: "stars_event",
      route: "stars_route",
    };

    const category = achievementCategories[starType] || "stars_total";

    // שליפת הישגים רלוונטיים לכוכבים
    const { data: achievements } = await supabase
      .from("achievements_game")
      .select("achievement_id")
      .eq("category", category)
      .eq("is_active", true);

    if (!achievements || achievements.length === 0) return;

    // לכל הישג רלוונטי, עדכן את ההתקדמות של המשתמש
    for (const achievement of achievements) {
      // בדיקה אם קיימת רשומת התקדמות למשתמש עבור הישג זה
      const { data: existing } = await supabase
        .from("user_achievements_game")
        .select("id, progress, unlocked")
        .eq("user_id", userId)
        .eq("achievement_id", achievement.achievement_id)
        .single();

      if (existing) {
        // אם הישג כבר פתוח, אין צורך בעדכון
        if (existing.unlocked) continue;

        // עדכון ההתקדמות הקיימת
        await supabase
          .from("user_achievements_game")
          .update({
            progress: existing.progress + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        // יצירת רשומת התקדמות חדשה
        await supabase.from("user_achievements_game").insert({
          user_id: userId,
          achievement_id: achievement.achievement_id,
          category: category,
          progress: 1,
        });
      }
    }

    // עדכון הישג כללי של סך-כל הכוכבים
    const { data: totalAchievements } = await supabase
      .from("achievements_game")
      .select("achievement_id")
      .eq("category", "stars_total")
      .eq("is_active", true);

    if (totalAchievements && totalAchievements.length > 0) {
      for (const achievement of totalAchievements) {
        // בדיקה אם קיימת רשומת התקדמות
        const { data: existing } = await supabase
          .from("user_achievements_game")
          .select("id, progress, unlocked")
          .eq("user_id", userId)
          .eq("achievement_id", achievement.achievement_id)
          .single();

        if (existing) {
          if (!existing.unlocked) {
            await supabase
              .from("user_achievements_game")
              .update({
                progress: existing.progress + 1,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id);
          }
        } else {
          await supabase.from("user_achievements_game").insert({
            user_id: userId,
            achievement_id: achievement.achievement_id,
            category: "stars_total",
            progress: 1,
          });
        }
      }
    }
  } catch (error) {
    console.error("שגיאה בעדכון הישגי כוכבים:", error);
  }
}

/**
 * עדכון התקדמות משימות הקשורות לכוכבים
 * @private
 * @param {string} userId - מזהה המשתמש
 * @param {string} starType - סוג הכוכב שנאסף
 */
async function _updateQuestProgress(userId, starType) {
  try {
    // מיפוי בין סוגי כוכבים לסוגי משימות
    const questTypes = {
      regular: "collect_regular_stars",
      gold: "collect_gold_stars",
      silver: "collect_silver_stars",
      bronze: "collect_bronze_stars",
      event: "collect_event_stars",
      route: "collect_route_stars",
    };

    const questType = questTypes[starType] || "collect_any_stars";

    // קבלת משימות פעילות של המשתמש
    const { data: activeQuests } = await supabase
      .from("user_quests")
      .select("id, quest_id, progress, completed")
      .eq("user_id", userId)
      .eq("completed", false)
      .gt("expires_at", new Date().toISOString());

    if (!activeQuests || activeQuests.length === 0) return;

    // קבלת פרטי המשימות
    const questIds = activeQuests.map((q) => q.quest_id);
    const { data: questDetails } = await supabase
      .from("quests")
      .select("quest_id, type, objective_value")
      .in("quest_id", questIds);

    if (!questDetails) return;

    // יצירת מפה של פרטי משימות לחיפוש מהיר
    const questMap = {};
    questDetails.forEach((quest) => {
      questMap[quest.quest_id] = quest;
    });

    // עדכון התקדמות למשימות רלוונטיות
    for (const userQuest of activeQuests) {
      const quest = questMap[userQuest.quest_id];
      if (!quest) continue;

      // בדיקה אם המשימה קשורה לסוג הכוכב שנאסף
      const relevantQuestTypes = [questType, "collect_any_stars"];
      if (relevantQuestTypes.includes(quest.type)) {
        // עדכון ההתקדמות
        const newProgress = userQuest.progress + 1;
        const completed = newProgress >= quest.objective_value;

        await supabase
          .from("user_quests")
          .update({
            progress: newProgress,
            completed: completed,
            completed_at: completed ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userQuest.id);
      }
    }
  } catch (error) {
    console.error("שגיאה בעדכון משימות כוכבים:", error);
  }
}
/**
 * מחזיר מערך של מזהי כוכבים שנאספו עבור המשתמש
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<string[]>} - מערך של מזהי כוכבים שנאספו
 */
export async function fetchCollectedStarIds(userId) {
  if (!userId) return [];

  try {
    // בדיקה במטמון
    const cachedIds = cache.get("collectedStarIds", userId);
    if (cachedIds) {
      return cachedIds;
    }

    // שליפה מהדאטאבייס
    const { data, error } = await supabase
      .from("collected_stars")
      .select("star_id")
      .eq("user_id", userId);

    if (error) {
      console.error("שגיאה בשליפת מזהי כוכבים:", error);

      // חזרה לנתונים מקומיים במקרה של שגיאה
      const localStars = JSON.parse(
        localStorage.getItem(`collectedStars_${userId}`) || "[]"
      );
      return localStars;
    }

    const starIds = data.map((row) => row.star_id);

    // שמירה במטמון
    cache.set("collectedStarIds", userId, starIds);

    return starIds;
  } catch (error) {
    console.error("שגיאה בפונקציה fetchCollectedStarIds:", error);

    // חזרה לנתונים מקומיים במקרה של שגיאה
    const localStars = JSON.parse(
      localStorage.getItem(`collectedStars_${userId}`) || "[]"
    );
    return localStars;
  }
}

/**
 * מחזיר את כל הכוכבים שנאספו עם כל הפרטים
 * @param {string} userId - מזהה המשתמש
 * @param {Object} options - אפשרויות (limit, offset, filter)
 * @returns {Promise<Object[]>} - מערך של אובייקטי כוכבים
 */
export async function fetchCollectedStars(userId, options = {}) {
  if (!userId) return [];

  try {
    // בדיקה במטמון רק אם אין אפשרויות מיוחדות
    if (Object.keys(options).length === 0) {
      const cachedStars = cache.get("collectedStars", userId);
      if (cachedStars) {
        return cachedStars;
      }
    }

    // בניית שאילתה
    let query = supabase
      .from("collected_stars")
      .select("*")
      .eq("user_id", userId);

    // הוספת אפשרויות סינון וחלוקה לעמודים
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 20) - 1
      );
    }

    if (options.filter) {
      Object.entries(options.filter).forEach(([field, value]) => {
        query = query.eq(field, value);
      });
    }

    // סידור התוצאות
    query = query.order("collected_at", {
      ascending: options.ascending || false,
    });

    // ביצוע השאילתה
    const { data, error } = await query;

    if (error) {
      console.error("שגיאה בשליפת כוכבים:", error);
      return [];
    }

    // המרת שדות מספריים
    const formattedStars = data.map((star) => ({
      ...star,
      lat: parseFloat(star.lat),
      lng: parseFloat(star.lng),
      points: parseInt(star.points) || 1,
      xp_earned: parseInt(star.xp_earned) || 0,
      coins_earned: parseInt(star.coins_earned) || 0,
      collected: true,
    }));

    // שמירה במטמון רק אם זו שאילתה רגילה
    if (Object.keys(options).length === 0) {
      cache.set("collectedStars", userId, formattedStars);
    }

    return formattedStars;
  } catch (error) {
    console.error("שגיאה בפונקציה fetchCollectedStars:", error);
    return [];
  }
}

/**
 * מחזיר את סך הנקודות מכל הכוכבים שנאספו
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<number>} - סך הנקודות
 */
export async function fetchTotalCollectedStarPoints(userId) {
  if (!userId) return 0;

  try {
    // בדיקה במטמון
    const cachedTotal = cache.get("starPointsTotals", userId);
    if (cachedTotal !== null) {
      return cachedTotal;
    }

    // שימוש בפונקציית סכימה בדאטאבייס
    const { data, error } = await supabase.rpc("sum_collected_star_points", {
      user_id_param: userId,
    });

    if (error) {
      console.error("שגיאה בחישוב סך נקודות:", error);

      // חזרה לחישוב מקומי במקרה של שגיאה
      const stars = await fetchCollectedStars(userId);
      const total = stars.reduce((sum, star) => sum + star.points, 0);

      // שמירה במטמון
      cache.set("starPointsTotals", userId, total);

      return total;
    }

    const total = parseInt(data) || 0;

    // שמירה במטמון
    cache.set("starPointsTotals", userId, total);

    return total;
  } catch (error) {
    console.error("שגיאה בפונקציה fetchTotalCollectedStarPoints:", error);
    return 0;
  }
}
/**
 * מחזיר כוכבים לפי סוג
 * @param {string} userId - מזהה המשתמש
 * @param {string} starType - סוג הכוכב (gold, silver, regular, וכו')
 * @returns {Promise<number>} - מספר הכוכבים מהסוג המבוקש
 */
export async function fetchCollectedStarsByType(userId, starType) {
  if (!userId || !starType) return 0;

  try {
    const cacheKey = `starsByType_${starType}`;
    const cachedCount = cache.get(cacheKey, userId);
    if (cachedCount !== null) {
      return cachedCount;
    }

    // שימוש בספירה יעילה
    const { count, error } = await supabase
      .from("collected_stars")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("star_type", starType);

    if (error) {
      console.error(`שגיאה בספירת כוכבי ${starType}:`, error);
      return 0;
    }

    // שמירה במטמון
    cache.set(cacheKey, userId, count || 0);

    return count || 0;
  } catch (error) {
    console.error(
      `שגיאה בפונקציה fetchCollectedStarsByType (${starType}):`,
      error
    );
    return 0;
  }
}

/**
 * מחזיר כוכבים שנאספו היום
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<Object[]>} - מערך של כוכבים שנאספו היום
 */
export async function fetchTodayCollectedStars(userId) {
  if (!userId) return [];

  try {
    // בדיקה במטמון
    const cachedStars = cache.get("todayStars", userId);
    if (cachedStars !== null) {
      return cachedStars;
    }

    // תאריך של היום בפורמט ISO
    const today = new Date().toISOString().split("T")[0];

    // שליפת הכוכבים שנאספו היום
    const { data, error } = await supabase
      .from("collected_stars")
      .select("*")
      .eq("user_id", userId)
      .gte("collected_at", today);

    if (error) {
      console.error("שגיאה בשליפת כוכבי היום:", error);
      return [];
    }

    // המרת שדות מספריים
    const formattedStars = (data || []).map((star) => ({
      ...star,
      lat: parseFloat(star.lat),
      lng: parseFloat(star.lng),
      points: parseInt(star.points) || 1,
      xp_earned: parseInt(star.xp_earned) || 0,
      coins_earned: parseInt(star.coins_earned) || 0,
      collected: true,
    }));

    // שמירה במטמון עם זמן פקיעה קצר יותר (5 דקות)
    cache.set("todayStars", userId, formattedStars, 5);

    return formattedStars;
  } catch (error) {
    console.error("שגיאה בפונקציה fetchTodayCollectedStars:", error);
    return [];
  }
}

/**
 * מחיקת כוכב שנאסף
 * @param {string} userId - מזהה המשתמש
 * @param {string} starId - מזהה הכוכב למחיקה
 * @returns {Promise<boolean>} - האם המחיקה הצליחה
 */
export async function deleteCollectedStar(userId, starId) {
  if (!userId || !starId) return false;

  try {
    // מחיקה מהדאטאבייס
    const { error } = await supabase
      .from("collected_stars")
      .delete()
      .eq("user_id", userId)
      .eq("star_id", starId);

    if (error) {
      console.error("שגיאה במחיקת כוכב:", error);
      return false;
    }

    // עדכון ב-localStorage
    const localStars = JSON.parse(
      localStorage.getItem(`collectedStars_${userId}`) || "[]"
    );
    const updatedStars = localStars.filter((id) => id !== starId);
    localStorage.setItem(
      `collectedStars_${userId}`,
      JSON.stringify(updatedStars)
    );

    // ניקוי מטמון
    cache.invalidate(userId);

    return true;
  } catch (error) {
    console.error("שגיאה בפונקציה deleteCollectedStar:", error);
    return false;
  }
}
/**
 * טעינת כוכבים מטבלת הנתונים והצגתם על המפה
 * @param {string} userId - מזהה המשתמש
 * @param {Object} position - המיקום הנוכחי (lat, lng)
 * @param {number} radius - רדיוס החיפוש במטרים
 * @returns {Promise<Object[]>} - מערך של כוכבים להצגה
 */
export async function loadStarsFromDatabase(userId, position, radius = 1000) {
  if (!userId || !position) return [];

  try {
    // קבלת כוכבים שכבר נאספו
    const collectedStarIds = await fetchCollectedStarIds(userId);
    const collectedSet = new Set(collectedStarIds);

    // טעינת כוכבים ממסלולים ואירועים
    const staticStars = await _loadStaticStarsNearPosition(
      userId,
      position,
      radius,
      collectedSet
    );

    // טעינת כוכבים מאזורים גיאוגרפיים
    const zoneStars = await _loadZoneStars(
      userId,
      position,
      radius,
      collectedSet
    );

    // יצירת כוכבים רנדומליים אם צריך
    const totalStarsNeeded = 50; // כמות הכוכבים הכוללת שנרצה להציג
    const remainingCount = Math.max(
      0,
      totalStarsNeeded - staticStars.length - zoneStars.length
    );

    let randomStars = [];
    if (remainingCount > 0) {
      randomStars = _generateRandomStars(
        position,
        remainingCount,
        collectedSet,
        radius
      );
    }

    // החזרת כל הכוכבים יחד
    return [...staticStars, ...zoneStars, ...randomStars];
  } catch (error) {
    console.error("שגיאה בטעינת כוכבים:", error);
    return [];
  }
}

/**
 * טעינת כוכבים קבועים ממסלולים ואירועים
 * @private
 * @param {string} userId - מזהה המשתמש
 * @param {Object} position - המיקום הנוכחי
 * @param {number} radius - רדיוס החיפוש במטרים
 * @param {Set} collectedSet - סט של מזהי כוכבים שכבר נאספו
 * @returns {Promise<Array>} - מערך של כוכבים קבועים
 */
async function _loadStaticStarsNearPosition(
  userId,
  position,
  radius,
  collectedSet
) {
  try {
    const now = new Date().toISOString();

    // טעינת כוכבי מסלול פעילים
    const { data: routeStars } = await supabase
      .from("route_stars")
      .select("*")
      .lte("active_from", now)
      .gt("active_until", now);

    // טעינת כוכבי אירוע פעילים
    const { data: eventStars } = await supabase
      .from("event_stars")
      .select("*")
      .lte("active_from", now)
      .gt("active_until", now);

    // עיבוד כוכבי מסלול
    const processedRouteStars = (routeStars || [])
      .filter((star) => !collectedSet.has(star.id))
      .map((star) => ({
        id: star.id,
        lat: parseFloat(star.lat),
        lng: parseFloat(star.lng),
        points: parseInt(star.points) || 5,
        type: "route",
        collected: false,
        route_id: star.route_id,
        xp_earned: 15,
        coins_earned: 5,
        expires_at: star.active_until,
        // תכונות ויזואליות חדשות
        visualEffect: "path",
        animationSpeed: 1.2,
        glowIntensity: 1.1,
      }));

    // עיבוד כוכבי אירוע
    const processedEventStars = (eventStars || [])
      .filter((star) => !collectedSet.has(star.id))
      .map((star) => ({
        id: star.id,
        lat: parseFloat(star.lat),
        lng: parseFloat(star.lng),
        points: parseInt(star.points) || 10,
        type: "event",
        collected: false,
        event_id: star.event_id,
        xp_earned: 30,
        coins_earned: 10,
        expires_at: star.active_until,
        // תכונות ויזואליות חדשות
        visualEffect: "pulse",
        animationSpeed: 1.3,
        glowIntensity: 1.4,
      }));

    // סינון כוכבים לפי מרחק מהמיקום הנוכחי
    const isInRange = (lat, lng) => {
      // חישוב מרחק גס ומהיר
      const latDiff = Math.abs(lat - position.lat);
      const lngDiff = Math.abs(lng - position.lng);

      // 0.00001 מעלות ≈ 1.1 מטר
      return latDiff * 111000 < radius && lngDiff * 111000 < radius;
    };

    return [...processedRouteStars, ...processedEventStars].filter((star) =>
      isInRange(star.lat, star.lng)
    );
  } catch (error) {
    console.error("שגיאה בטעינת כוכבים קבועים:", error);
    return [];
  }
}
/**
 * טעינת כוכבים מאזורים גיאוגרפיים מוגדרים
 * @private
 * @param {string} userId - מזהה המשתמש
 * @param {Object} position - המיקום הנוכחי
 * @param {number} radius - רדיוס החיפוש במטרים
 * @param {Set} collectedSet - סט של מזהי כוכבים שכבר נאספו
 * @returns {Promise<Array>} - מערך של כוכבים מאזורים
 */
async function _loadZoneStars(userId, position, radius, collectedSet) {
  try {
    const now = new Date().toISOString();

    // טעינת אזורים פעילים באזור המיקום הנוכחי
    const { data: activeZones } = await supabase
      .from("zones")
      .select("*")
      .is("active_until", null)
      .eq("is_active", true);

    if (!activeZones || activeZones.length === 0) return [];

    // סינון אזורים לפי מרחק
    const nearbyZones = activeZones.filter((zone) => {
      const distance = _calculateDistance(
        position.lat,
        position.lng,
        parseFloat(zone.lat),
        parseFloat(zone.lng)
      );
      return distance <= radius + parseFloat(zone.radius);
    });

    if (nearbyZones.length === 0) return [];

    // יצירת כוכבים עבור כל אזור
    let zoneStars = [];

    for (const zone of nearbyZones) {
      // בדיקה אם המשתמש כבר ביקר באזור זה
      const { data: visited } = await supabase
        .from("user_visited_zones")
        .select("id, visit_count")
        .eq("user_id", userId)
        .eq("zone_id", zone.zone_id)
        .single();

      // כמות הכוכבים בהתאם לצפיפות האזור ולמידת הביקור
      const baseDensity = visited ? 5 : 10; // יותר כוכבים באזור חדש
      const starCount = Math.round(baseDensity * (zone.star_density || 1.0));

      // יצירת כוכבים בתוך האזור
      const zoneCenter = {
        lat: parseFloat(zone.lat),
        lng: parseFloat(zone.lng),
      };
      const zoneRadius = parseFloat(zone.radius);

      for (let i = 0; i < starCount; i++) {
        // יצירת כוכב במיקום אקראי בתוך האזור
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * zoneRadius;

        const latOffset = Math.sin(angle) * distance * 0.000009;
        const lngOffset = Math.cos(angle) * distance * 0.000009;

        // בחירת סוג כוכב מהסוגים המוגדרים לאזור
        const starTypes = zone.star_types || ["regular"];
        const starType =
          starTypes[Math.floor(Math.random() * starTypes.length)];

        // ערכי נקודות בהתאם לסוג הכוכב
        let points = 1;
        let xpEarned = 3;
        let coinsEarned = 1;

        switch (starType) {
          case "gold":
            points = 5;
            xpEarned = 15;
            coinsEarned = 5;
            break;
          case "silver":
            points = 3;
            xpEarned = 9;
            coinsEarned = 3;
            break;
          case "bronze":
            points = 2;
            xpEarned = 6;
            coinsEarned = 2;
            break;
          case "event":
            points = 10;
            xpEarned = 30;
            coinsEarned = 10;
            break;
          case "route":
            points = 5;
            xpEarned = 15;
            coinsEarned = 5;
            break;
          default:
            // ברירת מחדל - השאר את הערכים הראשוניים
            break;
        }

        // בחירת אפקט ויזואלי בהתאם לסוג האזור
        let visualEffect = "normal";
        let glowIntensity = 1.0;

        switch (zone.type) {
          case "culture":
            visualEffect = "cultural";
            glowIntensity = 1.2;
            break;
          case "nature":
            visualEffect = "nature";
            glowIntensity = 1.1;
            break;
          case "history":
            visualEffect = "historical";
            glowIntensity = 1.3;
            break;
          case "event":
            visualEffect = "special";
            glowIntensity = 1.5;
            break;
          default:
            // השאר את ערכי ברירת המחדל
            break;
        }
        // יצירת כוכב עם תכונות האזור
        const star = {
          id: `zone_${zone.zone_id}_${Date.now()}_${i}`,
          lat: zoneCenter.lat + latOffset,
          lng: zoneCenter.lng + lngOffset,
          points: points,
          type: starType,
          collected: false,
          zone_id: zone.zone_id,
          xp_earned: xpEarned,
          coins_earned: coinsEarned,
          zone_type: zone.type,
          expires_at: zone.active_until,
          // תכונות ויזואליות
          visualEffect: visualEffect,
          animationSpeed: 1.0 + Math.random() * 0.5,
          glowIntensity: glowIntensity,
          // התאמת אפקט הופעה לפי מספר הביקורים
          entryEffect: visited ? "fadeIn" : "special",
          appearDelay: i * 100, // הופעה הדרגתית של כוכבים באזור
        };

        // הוספה למערך אם לא נאסף כבר
        if (!collectedSet.has(star.id)) {
          zoneStars.push(star);
        }
      }

      // עדכון ביקור באזור אם זה ביקור ראשון
      if (!visited) {
        await supabase.from("user_visited_zones").insert({
          user_id: userId,
          zone_id: zone.zone_id,
          first_visit: now,
          visit_count: 1,
          last_visit: now,
        });
      } else {
        // עדכון זמן ביקור אחרון ומספר ביקורים
        await supabase
          .from("user_visited_zones")
          .update({
            visit_count: (visited.visit_count || 0) + 1,
            last_visit: now,
          })
          .eq("id", visited.id);
      }
    }

    return zoneStars;
  } catch (error) {
    console.error("שגיאה בטעינת כוכבי אזור:", error);
    return [];
  }
}

/**
 * חישוב מרחק בין שתי נקודות גיאוגרפיות
 * @private
 * @param {number} lat1 - קו רוחב של נקודה 1
 * @param {number} lng1 - קו אורך של נקודה 1
 * @param {number} lat2 - קו רוחב של נקודה 2
 * @param {number} lng2 - קו אורך של נקודה 2
 * @returns {number} - מרחק במטרים
 */
function _calculateDistance(lat1, lng1, lat2, lng2) {
  // חישוב מרחק בשיטת הברסינוס
  const R = 6371e3; // רדיוס כדור הארץ במטרים
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // מרחק במטרים
}
/**
 * יצירת כוכבים רנדומליים
 * @private
 * @param {Object} position - מיקום מרכזי
 * @param {number} count - מספר כוכבים ליצור
 * @param {Set} existingIds - מזהים קיימים
 * @param {number} maxDistance - מרחק מקסימלי במטרים
 * @returns {Array} - מערך של כוכבים חדשים
 */
function _generateRandomStars(position, count, existingIds, maxDistance) {
  const stars = [];
  const starTypes = ["regular", "gold", "silver", "bronze"];
  const typeWeights = [0.7, 0.1, 0.1, 0.1]; // הסתברויות

  // אפקטים ויזואליים אפשריים
  const visualEffects = ["normal", "pulse", "glow", "sparkle", "fade"];

  for (let i = 0; i < count; i++) {
    // בחירת מרחק וזווית אקראיים
    const distance = Math.random() * maxDistance;
    const angle = Math.random() * Math.PI * 2;

    // חישוב היסט קואורדינטות
    const latOffset = Math.sin(angle) * distance * 0.000009;
    const lngOffset = Math.cos(angle) * distance * 0.000009;

    // בחירת סוג כוכב אקראי לפי משקולות
    let selectedType = "regular";
    const rand = Math.random();
    let accumulatedWeight = 0;

    for (let j = 0; j < starTypes.length; j++) {
      accumulatedWeight += typeWeights[j];
      if (rand < accumulatedWeight) {
        selectedType = starTypes[j];
        break;
      }
    }

    // ערך נקודות לפי סוג
    let points = 1;
    let xpEarned = 3;
    let coinsEarned = 1;
    switch (selectedType) {
      case "gold":
        points = 5;
        xpEarned = 15;
        coinsEarned = 5;
        break;
      case "silver":
        points = 3;
        xpEarned = 9;
        coinsEarned = 3;
        break;
      case "bronze":
        points = 2;
        xpEarned = 6;
        coinsEarned = 2;
        break;
      default:
        // השאר את ערכי ברירת המחדל עבור 'regular'
        break;
    }

    // בחירת אפקט ויזואלי אקראי
    const effect =
      visualEffects[Math.floor(Math.random() * visualEffects.length)];

    // יצירת אובייקט כוכב עם אפקטים ויזואליים
    const star = {
      id: `random_star_${Date.now()}_${i}`,
      lat: position.lat + latOffset,
      lng: position.lng + lngOffset,
      points,
      type: selectedType,
      xp_earned: xpEarned,
      coins_earned: coinsEarned,
      collected: false,
      // תכונות ויזואליות
      visualEffect: effect,
      animationSpeed: 0.7 + Math.random() * 0.6,
      glowIntensity:
        selectedType === "gold" ? 1.3 : selectedType === "silver" ? 1.1 : 1.0,
      entryEffect: Math.random() < 0.3 ? "special" : "normal",
      appearDelay: Math.random() * 2000, // השהיה אקראית להופעה
    };

    stars.push(star);
  }

  return stars;
}

// ייצוא של כל הפונקציות הציבוריות
const collectedStarsService = {
  saveCollectedStar,
  fetchCollectedStarIds,
  fetchCollectedStars,
  fetchTotalCollectedStarPoints,
  fetchCollectedStarsByType,
  fetchTodayCollectedStars,
  deleteCollectedStar,
  loadStarsFromDatabase,
};

export default collectedStarsService;
