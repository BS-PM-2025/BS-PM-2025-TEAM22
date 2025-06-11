// services/userService.js
import { supabase } from "../utils/supabaseClient";

/**
 * מחשב את דרישת ה-XP לרמה הבאה.
 * כאן כל רמה דורשת 500XP נוספים.
 */
const calculateNextLevelXp = (level) => {
  return 500 + level * 500;
};

/**
 * טוען את כל נתוני המשחק של המשתמש לפי userId
 */
export const getUserGameData = async (userId) => {
  try {
    // מבצע שליפות נתונים במקביל לביצועים טובים יותר
    const [
      profileRes,
      inventoryRes,
      stepsRes,
      starsRes,
      achievementsRes,
      questsRes,
      routesRes,
      visitedZonesRes,
      streakRes
    ] = await Promise.all([
      // פרופיל משתמש בסיסי
      supabase.from("profiles").select("*").eq("id", userId).single(),
      
      // מלאי המשתמש (מטבעות, XP, וכו')
      supabase.from("user_inventory").select("*").eq("user_id", userId).single(),
      
      // נתוני צעדים שבועיים
      supabase.from("user_steps").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(7),
      
      // כוכבים שנאספו
      supabase.from("collected_stars").select("*").eq("user_id", userId).order("collected_at", { descending: true }),
      
      // הישגי המשתמש
      supabase.from("user_achievements_game")
        .select(`
          *,
          achievement:achievement_id (
            title, description, icon, category, level, xp_reward, coins_reward, gems_reward
          )
        `)
        .eq("user_id", userId),
      
      // משימות המשתמש
      supabase.from("user_quests")
        .select(`
          *,
          quest:quest_id (
            title, description, type, objective_value, xp_reward, coins_reward, gems_reward, tips
          )
        `)
        .eq("user_id", userId),
      
      // פעילויות מסלול
      supabase.from("route_activities").select("*").eq("user_id", userId).order("start_time", { descending: true }),
      
      // אזורים שבוקרו
      supabase.from("user_visited_zones").select("*").eq("user_id", userId),
      
      // נתוני רצף יומי
      supabase.from("user_streaks").select("*").eq("user_id", userId).single()
    ]);

    // בדיקת שגיאות בשליפות
    if (
      profileRes.error ||
      (inventoryRes.error && inventoryRes.error.code !== "PGRST116") ||
      stepsRes.error ||
      starsRes.error ||
      achievementsRes.error ||
      questsRes.error ||
      routesRes.error ||
      visitedZonesRes.error ||
      (streakRes.error && streakRes.error.code !== "PGRST116")
    ) {
      console.error("שגיאה בטעינת נתוני המשתמש:", 
        profileRes.error || 
        inventoryRes.error || 
        stepsRes.error || 
        starsRes.error || 
        achievementsRes.error || 
        questsRes.error || 
        routesRes.error || 
        visitedZonesRes.error ||
        streakRes.error
      );
      throw new Error("שגיאה בטעינת נתוני המשחק של המשתמש");
    }

    // עיבוד נתוני פרופיל ומלאי
    const profile = profileRes.data;
    const inventory = inventoryRes.data || { 
      xp: profile.points || 0, 
      coins: 0, 
      gems: 0, 
      level: profile.level || 1 
    };

    const formattedProfile = {
      name: profile.name || profile.given_name || "משתמש",
      level: inventory.level || profile.level || 1,
      xp: inventory.xp || profile.points || 0,
      coins: inventory.coins || 0,
      gems: inventory.gems || 0,
      streak: streakRes.data?.current_streak || 0,
      bestStreak: streakRes.data?.best_streak || 0,
      nextLevelXp: calculateNextLevelXp(inventory.level || profile.level || 1),
      lastActive: profile.last_active || new Date().toISOString(),
      avatar: profile.avatar_url,
      isPublic: profile.is_public,
      followersCount: profile.followers_count || 0,
      followingCount: profile.following_count || 0
    };

    // עיבוד צעדים שבועיים
    const weeklySteps = (stepsRes.data || []).map((s) => ({
      day: new Date(s.date).toLocaleDateString("he-IL", { weekday: "short" }),
      date: s.date,
      steps: s.steps || 0,
      distance: s.distance || 0,
      calories: s.calories || 0,
      xpEarned: s.xp_earned || 0,
      coinsEarned: s.coins_earned || 0
    }));

    const totalSteps = weeklySteps.reduce((acc, day) => acc + day.steps, 0);
    const averagePerDay = weeklySteps.length > 0 ? Math.round(totalSteps / weeklySteps.length) : 0;

    const formattedSteps = {
      weekly: weeklySteps,
      total: totalSteps,
      averagePerDay,
      streak: streakRes.data?.current_streak || 0,
      totalDistance: weeklySteps.reduce((acc, day) => acc + (day.distance || 0), 0)
    };

    // עיבוד כוכבים שנאספו
    const stars = starsRes.data || [];
    const byType = stars.reduce((acc, star) => {
      const type = star.star_type || "regular";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const recent = stars.slice(0, 5).map((s) => ({
      id: s.star_id,
      type: s.star_type || "regular",
      points: s.points || 1,
      xpEarned: s.xp_earned || 0,
      coinsEarned: s.coins_earned || 0,
      collectedAt: s.collected_at,
      lat: s.lat,
      lng: s.lng
    }));

    const formattedStars = {
      total: stars.length,
      byType,
      recent,
      totalPoints: stars.reduce((acc, star) => acc + (star.points || 1), 0),
      totalCoinsEarned: stars.reduce((acc, star) => acc + (star.coins_earned || 0), 0),
      totalXpEarned: stars.reduce((acc, star) => acc + (star.xp_earned || 0), 0)
    };

    // עיבוד הישגים
    const formattedAchievements = (achievementsRes.data || []).map(userAchievement => {
      const achievement = userAchievement.achievement || {};
      return {
        id: userAchievement.achievement_id,
        title: achievement.title || "הישג",
        description: achievement.description || "",
        icon: achievement.icon || "🏆",
        category: userAchievement.category || achievement.category || "general",
        level: achievement.level || 1,
        progress: userAchievement.progress || 0,
        target: achievement.target || 100,
        unlocked: userAchievement.unlocked || false,
        unlockedAt: userAchievement.unlocked_at,
        notificationShown: userAchievement.notification_shown || false,
        xpReward: achievement.xp_reward || 0,
        coinsReward: achievement.coins_reward || 0,
        gemsReward: achievement.gems_reward || 0
      };
    });

    // עיבוד משימות
    const formattedQuests = (questsRes.data || []).map(userQuest => {
      const quest = userQuest.quest || {};
      return {
        id: userQuest.quest_id,
        title: quest.title || "משימה",
        description: quest.description || "",
        tips: quest.tips || "",
        type: quest.type || "steps",
        progress: userQuest.progress || 0,
        objectiveValue: quest.objective_value || 100,
        completed: userQuest.completed || false,
        completedAt: userQuest.completed_at,
        expiresAt: userQuest.expires_at,
        rewardClaimed: userQuest.reward_claimed || false,
        rewards: {
          xp: quest.xp_reward || 0,
          coins: quest.coins_reward || 0,
          gems: quest.gems_reward || 0
        }
      };
    });

    // עיבוד פעילויות מסלול
    const formattedRoutes = (routesRes.data || []).map((r) => ({
      id: r.id,
      routeId: r.route_id,
      startTime: r.start_time,
      endTime: r.end_time,
      durationSeconds: r.duration_seconds || 0,
      distanceMeters: r.distance_meters || 0,
      stepsCount: r.steps_count || 0,
      starsCollected: r.stars_collected || 0,
      xpEarned: r.xp_earned || 0,
      coinsEarned: r.coins_earned || 0,
      completed: r.completed || false
    }));

    // עיבוד אזורים שבוקרו
    const formattedZones = (visitedZonesRes.data || []).map(zone => ({
      zoneId: zone.zone_id,
      firstVisit: zone.first_visit,
      visitCount: zone.visit_count || 1,
      lastVisit: zone.last_visit
    }));

    // יצירת אובייקט התוצאה המלא
    return {
      profile: formattedProfile,
      steps: formattedSteps,
      stars: formattedStars,
      achievements: formattedAchievements,
      quests: formattedQuests,
      routeActivities: formattedRoutes,
      visitedZones: formattedZones
    };
  } catch (error) {
    console.error("שגיאה בשליפת נתוני משחק:", error);
    throw error;
  }
};

/**
 * עדכון מלאי המשתמש (XP, מטבעות, רמה)
 * @param {string} userId - מזהה המשתמש
 * @param {Object} data - הנתונים לעדכון
 * @returns {Promise<Object>} - נתוני המלאי המעודכנים
 */
export const updateUserInventory = async (userId, data = {}) => {
  if (!userId) throw new Error("מזהה משתמש חסר");

  try {
    // בדיקה אם המשתמש כבר קיים במערכת המלאי
    const { data: existingInventory, error: checkError } = await supabase
      .from("user_inventory")
      .select("*")
      .eq("user_id", userId)
      .single();

    const now = new Date().toISOString();
    let result;

    if (checkError && checkError.code === "PGRST116") {
      // לא נמצא - יוצר רשומה חדשה
      result = await supabase
        .from("user_inventory")
        .insert({
          user_id: userId,
          xp: data.xp || 0,
          coins: data.coins || 0,
          gems: data.gems || 0,
          level: data.level || 1,
          created_at: now,
          updated_at: now
        })
        .select();
    } else if (!checkError) {
      // עדכון רשומה קיימת
      const updates = {
        updated_at: now
      };

      // הוספת רק שדות שהועברו
      if (data.xp !== undefined) {
        updates.xp = (existingInventory.xp || 0) + data.xp;
      }
      if (data.coins !== undefined) {
        updates.coins = (existingInventory.coins || 0) + data.coins;
      }
      if (data.gems !== undefined) {
        updates.gems = (existingInventory.gems || 0) + data.gems;
      }
      if (data.level !== undefined) {
        updates.level = data.level;
      }

      result = await supabase
        .from("user_inventory")
        .update(updates)
        .eq("user_id", userId)
        .select();
    } else {
      throw new Error("שגיאה בבדיקת מלאי: " + checkError.message);
    }

    if (result.error) {
      throw new Error("שגיאה בעדכון מלאי: " + result.error.message);
    }

    return result.data?.[0] || null;
  } catch (error) {
    console.error("שגיאה בעדכון מלאי המשתמש:", error);
    throw error;
  }
};

/**
 * עדכון נתוני הפרופיל של המשתמש
 * @param {string} userId - מזהה המשתמש
 * @param {Object} profileData - הנתונים לעדכון
 * @returns {Promise<Object>} - פרופיל מעודכן
 */
export const updateUserProfile = async (userId, profileData = {}) => {
  if (!userId) throw new Error("מזהה משתמש חסר");

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)
      .select();

    if (error) throw new Error("שגיאה בעדכון פרופיל: " + error.message);

    return data?.[0] || null;
  } catch (error) {
    console.error("שגיאה בעדכון פרופיל המשתמש:", error);
    throw error;
  }
};

/**
 * בדיקה והעלאת רמה אם צריך
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<Object>} - תוצאת העלאת הרמה
 */
export const checkLevelUp = async (userId) => {
  if (!userId) throw new Error("מזהה משתמש חסר");

  try {
    // קבלת נתוני מלאי נוכחיים
    const { data: inventory, error } = await supabase
      .from("user_inventory")
      .select("xp, level")
      .eq("user_id", userId)
      .single();

    if (error) throw new Error("שגיאה בקבלת נתוני מלאי: " + error.message);

    const currentLevel = inventory.level || 1;
    const currentXp = inventory.xp || 0;
    const xpRequiredForNextLevel = calculateNextLevelXp(currentLevel);

    // בדיקה אם יש מספיק XP לעלות רמה
    if (currentXp >= xpRequiredForNextLevel) {
      const newLevel = currentLevel + 1;
      const levelUpReward = newLevel * 100; // מטבעות לפי הרמה החדשה

      // עדכון הרמה והוספת תגמול מטבעות
      const { error: updateError } = await supabase
        .from("user_inventory")
        .update({
          level: newLevel,
          coins: inventory.coins + levelUpReward,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", userId)
        .select();

      if (updateError) throw new Error("שגיאה בעדכון רמה: " + updateError.message);

      // עדכון גם בטבלת פרופילים
      await supabase
        .from("profiles")
        .update({
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      return {
        leveledUp: true,
        previousLevel: currentLevel,
        newLevel,
        reward: levelUpReward,
        nextLevelXp: calculateNextLevelXp(newLevel)
      };
    }

    return {
      leveledUp: false,
      currentLevel,
      currentXp,
      xpToNextLevel: xpRequiredForNextLevel - currentXp,
      nextLevelXp: xpRequiredForNextLevel
    };
  } catch (error) {
    console.error("שגיאה בבדיקת העלאת רמה:", error);
    throw error;
  }
};

/**
 * קבלת יכולות חדשות לפי רמה
 * @param {number} level - הרמה החדשה
 * @returns {Array} - מערך של יכולות חדשות
 */
export const getNewAbilitiesForLevel = (level) => {
  // מיפוי יכולות לפי רמה
  const abilitiesByLevel = {
    2: [{ id: 'star_detector', name: 'גלאי כוכבים', description: 'מציג כוכבים קרובים על המפה' }],
    3: [{ id: 'star_magnet', name: 'מגנט כוכבים', description: 'מושך כוכבים קרובים אליך' }],
    5: [{ id: 'combo_master', name: 'מאסטר קומבו', description: 'מאפשר יצירת קומבו ארוך יותר' }],
    7: [{ id: 'daily_bonus', name: 'בונוס יומי מוגדל', description: 'מגדיל את הבונוס היומי ב-50%' }],
    10: [{ id: 'special_stars', name: 'כוכבים מיוחדים', description: 'מאפשר לראות כוכבים מיוחדים נדירים' }],
    12: [{ id: 'zone_master', name: 'שליט האזורים', description: 'מקבל בונוס על ביקור באזורים חדשים' }],
    15: [{ id: 'star_radar', name: 'רדאר כוכבים', description: 'חושף את כל הכוכבים באזור' }],
    20: [{ id: 'fitness_guru', name: 'גורו הכושר', description: 'מקבל כפול XP על צעדים' }]
  };

  return abilitiesByLevel[level] || [];
};