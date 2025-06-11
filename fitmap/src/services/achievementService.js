// src/services/achievementService.js
import { supabase } from "../utils/supabaseClient";

// מטמון להישגים להפחתת קריאות שרת
const achievementCache = {
  allAchievements: null,
  userAchievements: {},
  timestamps: {},
  expiryTime: 5 * 60 * 1000, // 5 דקות

  // שמירת הישגים במטמון
  setCache(userId, data, key = 'default') {
    if (!this.userAchievements[userId]) {
      this.userAchievements[userId] = {};
    }
    this.userAchievements[userId][key] = data;
    this.timestamps[`${userId}_${key}`] = Date.now() + this.expiryTime;
  },

  // קבלת הישגים מהמטמון
  getCache(userId, key = 'default') {
    const expiryTimestamp = this.timestamps[`${userId}_${key}`];
    if (!expiryTimestamp || Date.now() > expiryTimestamp) {
      return null; // אין מטמון או שפג תוקפו
    }
    return this.userAchievements[userId]?.[key] || null;
  },

  // ניקוי מטמון
  clearCache(userId = null, key = null) {
    if (userId && key) {
      // ניקוי ספציפי
      if (this.userAchievements[userId]?.[key]) {
        delete this.userAchievements[userId][key];
      }
      delete this.timestamps[`${userId}_${key}`];
    } else if (userId) {
      // ניקוי כל המטמון למשתמש
      delete this.userAchievements[userId];
      Object.keys(this.timestamps).forEach(k => {
        if (k.startsWith(`${userId}_`)) {
          delete this.timestamps[k];
        }
      });
    } else {
      // ניקוי מלא
      this.userAchievements = {};
      this.timestamps = {};
      this.allAchievements = null;
    }
  }
};

/**
 * קבלת כל ההישגים האפשריים במשחק
 * @param {boolean} includeInactive - האם לכלול הישגים לא פעילים
 * @returns {Promise<Array>} - רשימת הישגים
 */
export async function getAllAchievements(includeInactive = false) {
  try {
    // בדיקה במטמון אם יש
    if (achievementCache.allAchievements) {
      return includeInactive 
        ? achievementCache.allAchievements 
        : achievementCache.allAchievements.filter(a => a.isActive);
    }

    // שליפה מהשרת
    let query = supabase.from("achievements_game").select("*");
    
    // סינון הישגים לא פעילים אם צריך
    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    // סידור לפי רמה
    query = query.order("level", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching achievements:", error);
      return [];
    }

    // עיבוד נתוני ההישגים לפורמט אחיד
    const formattedAchievements = data.map(achievement => ({
      achievementId: achievement.achievement_id,
      title: achievement.title,
      description: achievement.description || "",
      icon: achievement.icon || "🏆",
      category: achievement.category,
      type: achievement.type,
      level: achievement.level || 1,
      target: achievement.target,
      xpReward: achievement.xp_reward || 0,
      coinsReward: achievement.coins_reward || 0,
      gemsReward: achievement.gems_reward || 0,
      isSecret: achievement.is_secret || false,
      isActive: achievement.is_active
    }));

    // שמירה במטמון
    achievementCache.allAchievements = formattedAchievements;

    return includeInactive 
      ? formattedAchievements 
      : formattedAchievements.filter(a => a.isActive);
  } catch (error) {
    console.error("Exception in getAllAchievements:", error);
    return [];
  }
}

/**
 * קבלת הישגי המשתמש
 * @param {string} userId - מזהה המשתמש
 * @param {string} category - קטגוריה ספציפית לסינון (אופציונלי)
 * @returns {Promise<Array>} - רשימת הישגי המשתמש
 */
export async function getUserAchievements(userId, category = null) {
  if (!userId) return [];

  try {
    // בדיקה במטמון
    const cacheKey = category ? `category_${category}` : 'default';
    const cachedData = achievementCache.getCache(userId, cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // שליפת הישגי המשתמש
    let query = supabase
      .from("user_achievements_game")
      .select(`
        *,
        achievement:achievement_id(*)
      `)
      .eq("user_id", userId);

    // סינון לפי קטגוריה אם התבקש
    if (category) {
      query = query.eq("category", category);
    }

    const { data: userAchievements, error: userAchievementsError } = await query;

    if (userAchievementsError) {
      console.error("Error fetching user achievements:", userAchievementsError);
      return [];
    }

    // אם אין הישגים למשתמש, טוען את כל ההישגים האפשריים ומחזיר אותם לא מושלמים
    if (!userAchievements || userAchievements.length === 0) {
      const allAchievements = await getAllAchievements();
      
      // סינון לפי קטגוריה אם צריך
      const filteredAchievements = category 
        ? allAchievements.filter(a => a.category === category)
        : allAchievements;
      
      // יצירת הישגים ריקים למשתמש
      const emptyUserAchievements = filteredAchievements.map(achievement => ({
        id: null,
        userId: userId,
        achievementId: achievement.achievementId,
        progress: 0,
        unlocked: false,
        unlockedAt: null,
        notificationShown: false,
        createdAt: null,
        category: achievement.category,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        type: achievement.type,
        level: achievement.level,
        target: achievement.target,
        xpReward: achievement.xpReward,
        coinsReward: achievement.coinsReward,
        gemsReward: achievement.gemsReward,
        isSecret: achievement.isSecret
      }));

      // שמירה במטמון
      achievementCache.setCache(userId, emptyUserAchievements, cacheKey);
      
      return emptyUserAchievements;
    }

    // המרת הישגי המשתמש לפורמט אחיד
    const formattedUserAchievements = userAchievements.map(userAchievement => {
      const achievement = userAchievement.achievement || {};
      
      return {
        id: userAchievement.id,
        userId: userAchievement.user_id,
        achievementId: userAchievement.achievement_id,
        progress: userAchievement.progress || 0,
        unlocked: userAchievement.unlocked || false,
        unlockedAt: userAchievement.unlocked_at,
        notificationShown: userAchievement.notification_shown || false,
        createdAt: userAchievement.created_at,
        category: userAchievement.category || achievement.category,
        title: achievement.title || "הישג לא ידוע",
        description: achievement.description || "",
        icon: achievement.icon || "🏆",
        type: achievement.type || "unknown",
        level: achievement.level || 1,
        target: achievement.target || 100,
        xpReward: achievement.xp_reward || 0,
        coinsReward: achievement.coins_reward || 0,
        gemsReward: achievement.gems_reward || 0,
        isSecret: achievement.is_secret || false
      };
    });

    // שמירה במטמון
    achievementCache.setCache(userId, formattedUserAchievements, cacheKey);
    
    return formattedUserAchievements;
  } catch (error) {
    console.error("Exception in getUserAchievements:", error);
    return [];
  }
}

/**
 * קבלת הישג ספציפי של המשתמש
 * @param {string} userId - מזהה המשתמש
 * @param {string} achievementId - מזהה ההישג
 * @returns {Promise<Object|null>} - הישג המשתמש או null אם לא נמצא
 */
export async function getUserAchievement(userId, achievementId) {
  if (!userId || !achievementId) return null;

  try {
    const { data, error } = await supabase
      .from("user_achievements_game")
      .select(`
        *,
        achievement:achievement_id(*)
      `)
      .eq("user_id", userId)
      .eq("achievement_id", achievementId)
      .single();

    if (error) {
      if (error.code === "PGRST116") { // לא נמצא
        const { data: achievementData, error: achievementError } = await supabase
          .from("achievements_game")
          .select("*")
          .eq("achievement_id", achievementId)
          .single();
        
        if (achievementError) {
          console.error("Error fetching achievement:", achievementError);
          return null;
        }
        
        // יצירת אובייקט הישג ריק
        return {
          id: null,
          userId: userId,
          achievementId: achievementData.achievement_id,
          progress: 0,
          unlocked: false,
          unlockedAt: null,
          notificationShown: false,
          createdAt: null,
          category: achievementData.category,
          title: achievementData.title,
          description: achievementData.description,
          icon: achievementData.icon,
          type: achievementData.type,
          level: achievementData.level,
          target: achievementData.target,
          xpReward: achievementData.xp_reward,
          coinsReward: achievementData.coins_reward,
          gemsReward: achievementData.gems_reward,
          isSecret: achievementData.is_secret
        };
      } else {
        console.error("Error fetching user achievement:", error);
        return null;
      }
    }

    // המרה לפורמט אחיד
    const achievement = data.achievement || {};
    return {
      id: data.id,
      userId: data.user_id,
      achievementId: data.achievement_id,
      progress: data.progress || 0,
      unlocked: data.unlocked || false,
      unlockedAt: data.unlocked_at,
      notificationShown: data.notification_shown || false,
      createdAt: data.created_at,
      category: data.category || achievement.category,
      title: achievement.title || "הישג לא ידוע",
      description: achievement.description || "",
      icon: achievement.icon || "🏆",
      type: achievement.type || "unknown",
      level: achievement.level || 1,
      target: achievement.target || 100,
      xpReward: achievement.xp_reward || 0,
      coinsReward: achievement.coins_reward || 0,
      gemsReward: achievement.gems_reward || 0,
      isSecret: achievement.is_secret || false
    };
  } catch (error) {
    console.error("Exception in getUserAchievement:", error);
    return null;
  }
}

/**
 * עדכון התקדמות בהישג
 * @param {string} userId - מזהה המשתמש
 * @param {string} achievementId - מזהה ההישג
 * @param {number|Object} progressOrData - התקדמות חדשה או אובייקט עדכון מלא
 * @returns {Promise<Object|null>} - הישג מעודכן או null אם נכשל
 */
export async function updateAchievementProgress(userId, achievementId, progressOrData) {
  if (!userId || !achievementId) return null;

  try {
    // קביעת נתוני העדכון
    const isObject = typeof progressOrData === 'object';
    const progressValue = isObject ? progressOrData.progress : progressOrData;
    
    if (progressValue === undefined && !isObject) {
      throw new Error("חסר ערך התקדמות לעדכון");
    }

    // בדיקה אם ההישג כבר קיים למשתמש
    const { data: existingUserAchievement, error: checkError } = await supabase
      .from("user_achievements_game")
      .select("*")
      .eq("user_id", userId)
      .eq("achievement_id", achievementId)
      .single();

    // קבלת מידע על ההישג עצמו
    const { data: achievementData, error: achievementError } = await supabase
      .from("achievements_game")
      .select("*")
      .eq("achievement_id", achievementId)
      .single();
    
    if (achievementError) {
      console.error("Error fetching achievement:", achievementError);
      return null;
    }

    const now = new Date().toISOString();
    let updateData = {};
    let result;

    // חישוב האם ההישג הושלם
    const newProgress = isObject ? progressOrData.progress : progressValue;
    const currentProgress = existingUserAchievement ? existingUserAchievement.progress || 0 : 0;
    const targetValue = achievementData.target;
    
    let calculatedProgress;
    if (newProgress !== undefined) {
      // אם זו תוספת ולא החלפה (לדוגמה, עוד צעדים)
      calculatedProgress = isObject && progressOrData.additive
        ? currentProgress + newProgress
        : newProgress;
    } else {
      calculatedProgress = currentProgress;
    }
    
    const isUnlocked = calculatedProgress >= targetValue;

    if (checkError && checkError.code === "PGRST116") {
      // אין רשומה קיימת - יצירת חדשה
      updateData = {
        user_id: userId,
        achievement_id: achievementId,
        category: achievementData.category,
        progress: calculatedProgress,
        unlocked: isUnlocked,
        unlocked_at: isUnlocked ? now : null,
        notification_shown: isObject ? progressOrData.notificationShown || false : false,
        created_at: now,
        updated_at: now
      };

      // הוספת שדות נוספים מהאובייקט אם יש
      if (isObject) {
        if (progressOrData.notificationShown !== undefined) updateData.notification_shown = progressOrData.notificationShown;
      }

      result = await supabase
        .from("user_achievements_game")
        .insert(updateData)
        .select()
        .single();
    } else if (!checkError) {
      // עדכון רשומה קיימת
      updateData = {
        progress: calculatedProgress,
        updated_at: now
      };

      // רק אם השתנה סטטוס הפתיחה
      if (isUnlocked !== existingUserAchievement.unlocked) {
        updateData.unlocked = isUnlocked;
        updateData.unlocked_at = isUnlocked ? now : null;
      }

      // הוספת שדות נוספים מהאובייקט אם יש
      if (isObject) {
        if (progressOrData.notificationShown !== undefined) updateData.notification_shown = progressOrData.notificationShown;
      }

      result = await supabase
        .from("user_achievements_game")
        .update(updateData)
        .eq("id", existingUserAchievement.id)
        .select()
        .single();
    } else {
      throw new Error("שגיאה בבדיקת הישג קיים: " + checkError.message);
    }

    if (result.error) {
      throw new Error("שגיאה בעדכון הישג: " + result.error.message);
    }

    // אם ההישג הושלם עכשיו, נעדכן את החשבון עם התגמולים
    if (isUnlocked && (!existingUserAchievement || !existingUserAchievement.unlocked)) {
      await _giveAchievementRewards(userId, achievementData);
    }

    // ניקוי מטמון
    achievementCache.clearCache(userId);

    // החזרת ההישג המעודכן
    return {
      ...result.data,
      title: achievementData.title,
      description: achievementData.description,
      icon: achievementData.icon,
      type: achievementData.type,
      level: achievementData.level,
      target: achievementData.target,
      xpReward: achievementData.xp_reward,
      coinsReward: achievementData.coins_reward,
      gemsReward: achievementData.gems_reward
    };
  } catch (error) {
    console.error("Exception in updateAchievementProgress:", error);
    return null;
  }
}

/**
 * בדיקת הישגים שהושלמו אך טרם הוצגו למשתמש
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<Array>} - רשימת הישגים להציג
 */
export async function getCompletedAchievementsToShow(userId) {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from("user_achievements_game")
      .select(`
        *,
        achievement:achievement_id(*)
      `)
      .eq("user_id", userId)
      .eq("unlocked", true)
      .eq("notification_shown", false);

    if (error) {
      console.error("Error fetching completed achievements:", error);
      return [];
    }

    // המרה לפורמט אחיד
    return (data || []).map(userAchievement => {
      const achievement = userAchievement.achievement || {};
      
      return {
        id: userAchievement.id,
        userId: userAchievement.user_id,
        achievementId: userAchievement.achievement_id,
        progress: userAchievement.progress || 0,
        unlocked: userAchievement.unlocked || false,
        unlockedAt: userAchievement.unlocked_at,
        notificationShown: userAchievement.notification_shown || false,
        createdAt: userAchievement.created_at,
        category: userAchievement.category || achievement.category,
        title: achievement.title || "הישג לא ידוע",
        description: achievement.description || "",
        icon: achievement.icon || "🏆",
        type: achievement.type || "unknown",
        level: achievement.level || 1,
        target: achievement.target || 100,
        xpReward: achievement.xp_reward || 0,
        coinsReward: achievement.coins_reward || 0,
        gemsReward: achievement.gems_reward || 0,
        isSecret: achievement.is_secret || false
      };
    });
  } catch (error) {
    console.error("Exception in getCompletedAchievementsToShow:", error);
    return [];
  }
}

/**
 * סימון הישג כמוצג למשתמש
 * @param {string} userId - מזהה המשתמש
 * @param {string} achievementId - מזהה ההישג
 * @returns {Promise<boolean>} - האם העדכון הצליח
 */
export async function markAchievementAsShown(userId, achievementId) {
  if (!userId || !achievementId) return false;

  try {
    const { error } = await supabase
      .from("user_achievements_game")
      .update({
        notification_shown: true,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .eq("achievement_id", achievementId);

    if (error) {
      console.error("Error marking achievement as shown:", error);
      return false;
    }

    // ניקוי מטמון
    achievementCache.clearCache(userId);

    return true;
  } catch (error) {
    console.error("Exception in markAchievementAsShown:", error);
    return false;
  }
}

/**
 * בדיקת הישגים רלוונטיים לפעולה מסוימת
 * @param {string} userId - מזהה המשתמש
 * @param {string} actionType - סוג הפעולה (steps, stars, etc.)
 * @param {number} value - ערך הפעולה
 * @returns {Promise<Array>} - הישגים שהושלמו
 */
export async function checkAchievementsForAction(userId, actionType, value) {
  if (!userId || !actionType) return [];

  try {
    // קבלת כל ההישגים הרלוונטיים לסוג הפעולה
    const { data: relevantAchievements, error } = await supabase
      .from("achievements_game")
      .select("*")
      .eq("type", actionType)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching relevant achievements:", error);
      return [];
    }

    if (!relevantAchievements || relevantAchievements.length === 0) {
      return [];
    }

    // קבלת התקדמות נוכחית של המשתמש בהישגים אלו
    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from("user_achievements_game")
      .select("*")
      .eq("user_id", userId)
      .in(
        "achievement_id", 
        relevantAchievements.map(a => a.achievement_id)
      );

    if (userAchievementsError) {
      console.error("Error fetching user achievements:", userAchievementsError);
      return [];
    }

    // מיפוי התקדמות המשתמש לפי מזהה הישג
    const userProgressMap = {};
    (userAchievements || []).forEach(ua => {
      userProgressMap[ua.achievement_id] = ua;
    });

    // רשימת הישגים שהושלמו כעת
    const completedAchievements = [];
    const now = new Date().toISOString();
    const updates = [];

    // בדיקת כל הישג רלוונטי
    for (const achievement of relevantAchievements) {
      const userAchievement = userProgressMap[achievement.achievement_id];
      
      // אם כבר הושלם, נדלג
      if (userAchievement && userAchievement.unlocked) {
        continue;
      }

      // חישוב ההתקדמות המעודכנת
      let currentProgress = userAchievement ? userAchievement.progress || 0 : 0;
      const newProgress = actionType === 'steps' || actionType === 'distance' 
        ? currentProgress + value  // מצטבר (כמו צעדים או מרחק)
        : Math.max(currentProgress, value); // הערך הגבוה ביותר (כמו קומבו)

      // בדיקה אם ההישג הושלם
      const isCompleted = newProgress >= achievement.target;

      if (isCompleted) {
        // הוספה לרשימת ההישגים שהושלמו
        completedAchievements.push({
          ...achievement,
          progress: newProgress,
          unlocked: true,
          unlockedAt: now
        });

        // הענקת תגמולים
        await _giveAchievementRewards(userId, achievement);
      }

      // הכנת עדכון לשרת
      if (userAchievement) {
        // עדכון רשומה קיימת
        updates.push(
          supabase
            .from("user_achievements_game")
            .update({
              progress: newProgress,
              unlocked: isCompleted,
              unlocked_at: isCompleted ? now : null,
              updated_at: now
            })
            .eq("id", userAchievement.id)
        );
      } else {
        // יצירת רשומה חדשה
        updates.push(
          supabase
            .from("user_achievements_game")
            .insert({
              user_id: userId,
              achievement_id: achievement.achievement_id,
              category: achievement.category,
              progress: newProgress,
              unlocked: isCompleted,
              unlocked_at: isCompleted ? now : null,
              notification_shown: false,
              created_at: now,
              updated_at: now
            })
        );
      }
    }

    // ביצוע כל העדכונים במקביל
    if (updates.length > 0) {
      await Promise.all(updates);
    }

    // ניקוי מטמון
    achievementCache.clearCache(userId);

    return completedAchievements;
  } catch (error) {
    console.error("Exception in checkAchievementsForAction:", error);
    return [];
  }
}

/**
 * הענקת תגמולים עבור השלמת הישג
 * @private
 * @param {string} userId - מזהה המשתמש
 * @param {Object} achievement - פרטי ההישג
 * @returns {Promise<boolean>} - האם ההענקה הצליחה
 */
async function _giveAchievementRewards(userId, achievement) {
  if (!userId || !achievement) return false;

  try {
    // בדיקה אם יש תגמולים להעניק
    const xpReward = achievement.xp_reward || 0;
    const coinsReward = achievement.coins_reward || 0;
    const gemsReward = achievement.gems_reward || 0;

    if (xpReward === 0 && coinsReward === 0 && gemsReward === 0) {
      return true; // אין תגמולים, אבל הפעולה הצליחה
    }

    // בדיקה אם יש למשתמש רשומת מלאי
    const { data: inventory, error: inventoryError } = await supabase
      .from("user_inventory")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (inventoryError && inventoryError.code !== "PGRST116") {
      console.error("Error fetching user inventory:", inventoryError);
      return false;
    }

    const now = new Date().toISOString();

    if (inventory) {
      // עדכון מלאי קיים
      const { error: updateError } = await supabase
        .from("user_inventory")
        .update({
          xp: (inventory.xp || 0) + xpReward,
          coins: (inventory.coins || 0) + coinsReward,
          gems: (inventory.gems || 0) + gemsReward,
          updated_at: now
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating inventory with rewards:", updateError);
        return false;
      }
    } else {
      // יצירת מלאי חדש
      const { error: insertError } = await supabase
        .from("user_inventory")
        .insert({
          user_id: userId,
          xp: xpReward,
          coins: coinsReward,
          gems: gemsReward,
          level: 1,
          created_at: now,
          updated_at: now
        });

      if (insertError) {
        console.error("Error creating inventory with rewards:", insertError);
        return false;
      }
    }

    // עדכון גם בטבלת השחקנים
    await supabase
      .from("profiles")
      .update({
        points: supabase.rpc('get_current_points', { user_id_param: userId }),
        updated_at: now
      })
      .eq("id", userId);

    return true;
  } catch (error) {
    console.error("Exception in _giveAchievementRewards:", error);
    return false;
  }
}