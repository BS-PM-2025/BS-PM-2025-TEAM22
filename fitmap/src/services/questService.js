// src/services/questService.js
import { supabase } from "../utils/supabaseClient";
import { updateUserInventory } from "./userService";

// מטמון משימות
const questCache = {
  allQuests: null,
  userQuests: {},
  timestamps: {},
  expiryTime: 5 * 60 * 1000, // 5 דקות

  // שמירת משימות במטמון
  setCache(userId, data, key = "default") {
    if (!this.userQuests[userId]) {
      this.userQuests[userId] = {};
    }
    this.userQuests[userId][key] = data;
    this.timestamps[`${userId}_${key}`] = Date.now() + this.expiryTime;
  },

  // קבלת משימות מהמטמון
  getCache(userId, key = "default") {
    const expiryTimestamp = this.timestamps[`${userId}_${key}`];
    if (!expiryTimestamp || Date.now() > expiryTimestamp) {
      return null; // אין מטמון או שפג תוקפו
    }
    return this.userQuests[userId]?.[key] || null;
  },

  // ניקוי מטמון
  clearCache(userId = null, key = null) {
    if (userId && key) {
      // ניקוי ספציפי
      if (this.userQuests[userId]?.[key]) {
        delete this.userQuests[userId][key];
      }
      delete this.timestamps[`${userId}_${key}`];
    } else if (userId) {
      // ניקוי כל המטמון למשתמש
      delete this.userQuests[userId];
      Object.keys(this.timestamps).forEach((k) => {
        if (k.startsWith(`${userId}_`)) {
          delete this.timestamps[k];
        }
      });
    } else {
      // ניקוי מלא
      this.userQuests = {};
      this.timestamps = {};
      this.allQuests = null;
    }
  },
};

/**
 * קבלת כל המשימות האפשריות במשחק
 * @param {boolean} activeOnly - האם להחזיר רק משימות פעילות
 * @returns {Promise<Array>} - רשימת משימות
 */
export async function getAllQuests(activeOnly = true) {
  try {
    // בדיקה במטמון אם יש
    const cacheKey = activeOnly ? "active" : "all";
    if (questCache.allQuests && questCache.allQuests[cacheKey]) {
      return questCache.allQuests[cacheKey];
    }

    // שליפה מהשרת
    let query = supabase.from("quests").select("*");

    // סינון משימות לא פעילות אם צריך
    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching quests:", error);
      return [];
    }

    // עיבוד נתוני המשימות לפורמט אחיד
    const formattedQuests = data.map((quest) => ({
      questId: quest.quest_id,
      title: quest.title,
      description: quest.description || "",
      tips: quest.tips || "",
      type: quest.type || "steps",
      objectiveValue: quest.objective_value,
      xpReward: quest.xp_reward || 0,
      coinsReward: quest.coins_reward || 0,
      gemsReward: quest.gems_reward || 0,
      timeLimitHours: quest.time_limit_hours || 24,
      isRepeatable: quest.is_repeatable || false,
      isActive: quest.is_active,
    }));

    // שמירה במטמון
    if (!questCache.allQuests) {
      questCache.allQuests = {};
    }
    questCache.allQuests[cacheKey] = formattedQuests;

    return formattedQuests;
  } catch (error) {
    console.error("Exception in getAllQuests:", error);
    return [];
  }
}

/**
 * קבלת משימות המשתמש
 * @param {string} userId - מזהה המשתמש
 * @param {boolean} includeCompleted - האם לכלול משימות שהושלמו
 * @param {boolean} includeExpired - האם לכלול משימות שפג תוקפן
 * @returns {Promise<Array>} - רשימת משימות המשתמש
 */
export async function getUserQuests(
  userId,
  includeCompleted = true,
  includeExpired = false
) {
  if (!userId) return [];

  try {
    // בדיקה במטמון
    const cacheKey = `${includeCompleted}_${includeExpired}`;
    const cachedData = questCache.getCache(userId, cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // שליפת משימות המשתמש
    let query = supabase
      .from("user_quests")
      .select(
        `
        *,
        quest:quest_id(*)
      `
      )
      .eq("user_id", userId);

    // סינון לפי השלמה אם צריך
    if (!includeCompleted) {
      query = query.eq("completed", false);
    }

    // סינון לפי תוקף אם צריך
    if (!includeExpired) {
      query = query.gt("expires_at", new Date().toISOString());
    }

    // סידור לפי תאריך פקיעה
    query = query.order("expires_at", { ascending: true });

    const { data: userQuests, error: userQuestsError } = await query;

    if (userQuestsError) {
      console.error("Error fetching user quests:", userQuestsError);
      return [];
    }

    // אם אין משימות למשתמש, טוען את כל המשימות האפשריות ויוצר חדשות
    if (!userQuests || userQuests.length === 0) {
      const newQuests = await _generateNewQuestsForUser(userId);

      // שמירה במטמון
      questCache.setCache(userId, newQuests, cacheKey);

      return newQuests;
    }

    // המרת משימות המשתמש לפורמט אחיד
    const formattedUserQuests = userQuests.map((userQuest) => {
      const quest = userQuest.quest || {};

      return {
        id: userQuest.id,
        userId: userQuest.user_id,
        questId: userQuest.quest_id,
        progress: userQuest.progress || 0,
        completed: userQuest.completed || false,
        completedAt: userQuest.completed_at,
        expiresAt: userQuest.expires_at,
        rewardClaimed: userQuest.reward_claimed || false,
        createdAt: userQuest.created_at,
        title: quest.title || "משימה לא ידועה",
        description: quest.description || "",
        tips: quest.tips || "",
        type: quest.type || "unknown",
        objectiveValue: quest.objective_value || 100,
        rewards: {
          xp: quest.xp_reward || 0,
          coins: quest.coins_reward || 0,
          gems: quest.gems_reward || 0,
        },
      };
    });

    // סינון משימות שפג תוקפן ולא הושלמו
    const now = new Date();
    const validQuests = formattedUserQuests.filter((quest) => {
      if (quest.completed) return includeCompleted;
      if (new Date(quest.expiresAt) < now) return includeExpired;
      return true;
    });

    // שמירה במטמון
    questCache.setCache(userId, validQuests, cacheKey);

    return validQuests;
  } catch (error) {
    console.error("Exception in getUserQuests:", error);
    return [];
  }
}

/**
 * יצירת משימות חדשות למשתמש
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<Array>} - משימות חדשות שנוצרו
 */
async function _generateNewQuestsForUser(userId) {
  if (!userId) return [];

  try {
    // קבלת כל המשימות האפשריות
    const allQuests = await getAllQuests(true);
    if (!allQuests || allQuests.length === 0) return [];

    // קבלת מאפייני המשתמש לקביעת רמת קושי
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("level, fitness_level")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching user profile:", profileError);
    }

    // ברירת מחדל אם אין פרופיל
    const userLevel = userProfile?.level || 1;
    const fitnessLevel = userProfile?.fitness_level || "medium";

    // בחירת מספר משימות אקראיות לפי רמת המשתמש
    const numQuests = Math.min(3 + Math.floor(userLevel / 5), 5); // מקסימום 5 משימות בו-זמנית
    const selectedQuests = [];

    // טיפוסי משימות שונים
    const questTypes = ["steps", "distance", "stars", "combo"];

    // בחירת לפחות משימה אחת מכל סוג אם אפשר
    for (const type of questTypes) {
      const questsOfType = allQuests.filter((q) => q.type === type);
      if (questsOfType.length > 0) {
        const randomQuest =
          questsOfType[Math.floor(Math.random() * questsOfType.length)];
        selectedQuests.push(randomQuest);
        if (selectedQuests.length >= numQuests) break;
      }
    }

    // אם יש מקום למשימות נוספות, בחר אקראית
    while (
      selectedQuests.length < numQuests &&
      selectedQuests.length < allQuests.length
    ) {
      const remainingQuests = allQuests.filter(
        (q) => !selectedQuests.some((sq) => sq.questId === q.questId)
      );
      if (remainingQuests.length === 0) break;

      const randomQuest =
        remainingQuests[Math.floor(Math.random() * remainingQuests.length)];
      selectedQuests.push(randomQuest);
    }

    // חישוב זמן תפוגה לכל משימה
    const now = new Date();
    const expiryDates = selectedQuests.map((quest) => {
      const expiry = new Date(now);
      expiry.setHours(expiry.getHours() + quest.timeLimitHours);
      return expiry.toISOString();
    });

    // יצירת משימות חדשות למשתמש
    const newUserQuests = [];

    for (let i = 0; i < selectedQuests.length; i++) {
      const quest = selectedQuests[i];

      // מתאים את רמת הקושי לפי רמת המשתמש והכושר
      let objectiveMultiplier = 1.0;

      // רמת המשתמש משפיעה על רמת הקושי
      if (userLevel > 10) objectiveMultiplier *= 1.5;
      else if (userLevel > 5) objectiveMultiplier *= 1.2;

      // רמת הכושר משפיעה על רמת הקושי
      if (fitnessLevel === "high") objectiveMultiplier *= 1.3;
      else if (fitnessLevel === "low") objectiveMultiplier *= 0.7;

      // חישוב יעד סופי
      const finalObjective = Math.round(
        quest.objectiveValue * objectiveMultiplier
      );

      // הכנת נתוני המשימה
      const userQuestData = {
        user_id: userId,
        quest_id: quest.questId,
        progress: 0,
        completed: false,
        expires_at: expiryDates[i],
        reward_claimed: false,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      // יצירת המשימה בדאטאבייס
      const { data, error } = await supabase
        .from("user_quests")
        .insert(userQuestData)
        .select();

      if (error) {
        console.error(`Error creating quest ${quest.questId}:`, error);
        continue;
      }

      // הוספה למערך החדש
      newUserQuests.push({
        id: data[0].id,
        userId: userId,
        questId: quest.questId,
        progress: 0,
        completed: false,
        expiresAt: expiryDates[i],
        rewardClaimed: false,
        createdAt: now.toISOString(),
        title: quest.title,
        description: quest.description,
        tips: quest.tips,
        type: quest.type,
        objectiveValue: finalObjective,
        rewards: {
          xp: quest.xpReward,
          coins: quest.coinsReward,
          gems: quest.gemsReward,
        },
      });
    }

    return newUserQuests;
  } catch (error) {
    console.error("Error generating new quests:", error);
    return [];
  }
}

/**
 * עדכון התקדמות במשימה
 * @param {string} userId - מזהה המשתמש
 * @param {string} questId - מזהה המשימה
 * @param {number|Object} progressOrData - התקדמות חדשה או אובייקט עדכון מלא
 * @returns {Promise<Object|null>} - משימה מעודכנת או null אם נכשל
 */
export async function updateQuestProgress(userId, questId, progressOrData) {
  if (!userId || !questId) return null;

  try {
    // קביעת נתוני העדכון
    const isObject = typeof progressOrData === "object";
    const progressValue = isObject ? progressOrData.progress : progressOrData;

    if (progressValue === undefined && !isObject) {
      throw new Error("חסר ערך התקדמות לעדכון");
    }

    // בדיקה אם המשימה כבר קיימת למשתמש
    const { data: existingUserQuest, error: checkError } = await supabase
      .from("user_quests")
      .select("*, quest:quest_id(*)")
      .eq("user_id", userId)
      .eq("quest_id", questId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking user quest:", checkError);
      return null;
    }

    // אם המשימה לא קיימת
    if (!existingUserQuest) {
      console.error("Quest not found for user:", questId);
      return null;
    }

    const quest = existingUserQuest.quest || {};
    const now = new Date().toISOString();
    let updateData = {};
    let result;

    // חישוב האם המשימה הושלמה
    const newProgress =
      isObject && progressOrData.additive
        ? (existingUserQuest.progress || 0) + progressValue
        : progressValue;
    const targetValue = quest.objective_value || 100;
    const isCompleted = newProgress >= targetValue;

    // עדכון רשומה קיימת
    updateData = {
      progress: newProgress,
      updated_at: now,
    };

    // רק אם השתנה סטטוס ההשלמה
    if (isCompleted !== existingUserQuest.completed) {
      updateData.completed = isCompleted;
      updateData.completed_at = isCompleted ? now : null;
    }

    // הוספת שדות נוספים מהאובייקט אם יש
    if (isObject) {
      if (progressOrData.rewardClaimed !== undefined)
        updateData.reward_claimed = progressOrData.rewardClaimed;
    }

    result = await supabase
      .from("user_quests")
      .update(updateData)
      .eq("id", existingUserQuest.id)
      .select("*, quest:quest_id(*)")
      .single();

    if (result.error) {
      throw new Error("שגיאה בעדכון משימה: " + result.error.message);
    }

    const updatedQuest = result.data;

    // אם המשימה הושלמה עכשיו, נעדכן את החשבון עם התגמולים
    if (
      isCompleted &&
      !existingUserQuest.completed &&
      !existingUserQuest.reward_claimed
    ) {
      await _claimQuestRewards(userId, updatedQuest.quest);

      // עדכון שהתגמולים נתבעו
      await supabase
        .from("user_quests")
        .update({
          reward_claimed: true,
          updated_at: now,
        })
        .eq("id", existingUserQuest.id);
    }

    // ניקוי מטמון
    questCache.clearCache(userId);

    // החזרת המשימה המעודכנת
    return {
      id: updatedQuest.id,
      userId: updatedQuest.user_id,
      questId: updatedQuest.quest_id,
      progress: updatedQuest.progress || 0,
      completed: updatedQuest.completed || false,
      completedAt: updatedQuest.completed_at,
      expiresAt: updatedQuest.expires_at,
      rewardClaimed: updatedQuest.reward_claimed || false,
      createdAt: updatedQuest.created_at,
      title: updatedQuest.quest?.title || "משימה לא ידועה",
      description: updatedQuest.quest?.description || "",
      tips: updatedQuest.quest?.tips || "",
      type: updatedQuest.quest?.type || "unknown",
      objectiveValue: updatedQuest.quest?.objective_value || 100,
      rewards: {
        xp: updatedQuest.quest?.xp_reward || 0,
        coins: updatedQuest.quest?.coins_reward || 0,
        gems: updatedQuest.quest?.gems_reward || 0,
      },
    };
  } catch (error) {
    console.error("Exception in updateQuestProgress:", error);
    return null;
  }
}

/**
 * תביעת תגמולים עבור משימה שהושלמה
 * @param {string} userId - מזהה המשתמש
 * @param {string} questId - מזהה המשימה
 * @returns {Promise<Object|null>} - פרטי התגמולים או null אם נכשל
 */
export async function claimQuestReward(userId, questId) {
  if (!userId || !questId) return null;

  try {
    // בדיקה אם המשימה הושלמה ולא נתבעה עדיין
    const { data: userQuest, error: questError } = await supabase
      .from("user_quests")
      .select("*, quest:quest_id(*)")
      .eq("user_id", userId)
      .eq("quest_id", questId)
      .eq("completed", true)
      .eq("reward_claimed", false)
      .single();

    if (questError) {
      console.error("Error fetching quest for reward claim:", questError);
      return null;
    }

    if (!userQuest) {
      return { error: "המשימה אינה זמינה לתביעת תגמולים" };
    }

    // תביעת התגמולים
    const quest = userQuest.quest;

    // הענקת תגמולים
    const result = await _claimQuestRewards(userId, quest);

    if (!result) {
      return { error: "שגיאה בהענקת תגמולים" };
    }

    // עדכון שהתגמולים נתבעו
    const { error: updateError } = await supabase
      .from("user_quests")
      .update({
        reward_claimed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userQuest.id);

    if (updateError) {
      console.error("Error updating reward claimed status:", updateError);
      return null;
    }

    // ניקוי מטמון
    questCache.clearCache(userId);

    return {
      questId: questId,
      title: quest.title,
      xpReward: quest.xp_reward || 0,
      coinsReward: quest.coins_reward || 0,
      gemsReward: quest.gems_reward || 0,
      claimed: true,
    };
  } catch (error) {
    console.error("Exception in claimQuestReward:", error);
    return null;
  }
}

/**
 * הענקת תגמולים עבור השלמת משימה
 * @private
 * @param {string} userId - מזהה המשתמש
 * @param {Object} quest - פרטי המשימה
 * @returns {Promise<boolean>} - האם ההענקה הצליחה
 */
async function _claimQuestRewards(userId, quest) {
  if (!userId || !quest) return false;

  try {
    // בדיקה אם יש תגמולים להעניק
    const xpReward = quest.xp_reward || 0;
    const coinsReward = quest.coins_reward || 0;
    const gemsReward = quest.gems_reward || 0;

    if (xpReward === 0 && coinsReward === 0 && gemsReward === 0) {
      return true; // אין תגמולים, אבל הפעולה הצליחה
    }

    // עדכון מלאי המשתמש
    await updateUserInventory(userId, {
      xp: xpReward,
      coins: coinsReward,
      gems: gemsReward,
    });

    return true;
  } catch (error) {
    console.error("Exception in _claimQuestRewards:", error);
    return false;
  }
}

/**
 * יצירת משימה חדשה למשתמש
 * @param {string} userId - מזהה המשתמש
 * @param {string} questId - מזהה המשימה ליצירה
 * @returns {Promise<Object|null>} - המשימה החדשה או null אם נכשל
 */
export async function createUserQuest(userId, questId) {
  if (!userId || !questId) return null;

  try {
    // בדיקה אם המשימה כבר קיימת למשתמש
    const { error: checkError } = await supabase
      .from("user_quests")
      .select("id")
      .eq("user_id", userId)
      .eq("quest_id", questId)
      .single();

    if (!checkError) {
      return { error: "המשימה כבר קיימת למשתמש" };
    }

    // קבלת פרטי המשימה
    const { data: quest, error: questError } = await supabase
      .from("quests")
      .select("*")
      .eq("quest_id", questId)
      .single();

    if (questError) {
      console.error("Error fetching quest details:", questError);
      return null;
    }

    // חישוב זמן תפוגה
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setHours(expiryDate.getHours() + (quest.time_limit_hours || 24));

    // יצירת המשימה
    const { data, error } = await supabase
      .from("user_quests")
      .insert({
        user_id: userId,
        quest_id: questId,
        progress: 0,
        completed: false,
        expires_at: expiryDate.toISOString(),
        reward_claimed: false,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .select();

    if (error) {
      console.error("Error creating user quest:", error);
      return null;
    }

    // ניקוי מטמון
    questCache.clearCache(userId);

    // החזרת המשימה החדשה
    return {
      id: data[0].id,
      userId: userId,
      questId: questId,
      progress: 0,
      completed: false,
      expiresAt: expiryDate.toISOString(),
      rewardClaimed: false,
      createdAt: now.toISOString(),
      title: quest.title,
      description: quest.description,
      tips: quest.tips,
      type: quest.type,
      objectiveValue: quest.objective_value,
      rewards: {
        xp: quest.xp_reward || 0,
        coins: quest.coins_reward || 0,
        gems: quest.gems_reward || 0,
      },
    };
  } catch (error) {
    console.error("Exception in createUserQuest:", error);
    return null;
  }
}

/**
 * ריענון כל המשימות של המשתמש (למקרים חריגים)
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<Array>} - משימות חדשות שנוצרו
 */
export async function refreshUserQuests(userId) {
  if (!userId) return [];

  try {
    // מחיקת כל המשימות הקיימות של המשתמש שלא הושלמו
    await supabase
      .from("user_quests")
      .delete()
      .eq("user_id", userId)
      .eq("completed", false);

    // ניקוי מטמון
    questCache.clearCache(userId);

    // יצירת משימות חדשות
    return await _generateNewQuestsForUser(userId);
  } catch (error) {
    console.error("Exception in refreshUserQuests:", error);
    return [];
  }
}

/**
 * מחיקת משימת משתמש
 * @param {string} userId - מזהה המשתמש
 * @param {string} questId - מזהה המשימה
 * @returns {Promise<boolean>} - האם המחיקה הצליחה
 */
export async function deleteUserQuest(userId, questId) {
  if (!userId || !questId) return false;

  try {
    const { error } = await supabase
      .from("user_quests")
      .delete()
      .eq("user_id", userId)
      .eq("quest_id", questId);

    if (error) {
      console.error("Error deleting user quest:", error);
      return false;
    }

    // ניקוי מטמון
    questCache.clearCache(userId);

    return true;
  } catch (error) {
    console.error("Exception in deleteUserQuest:", error);
    return false;
  }
}
