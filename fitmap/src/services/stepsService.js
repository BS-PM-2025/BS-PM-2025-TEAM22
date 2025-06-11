// src/services/stepsService.js
import { supabase } from "../utils/supabaseClient";

// מנגנון מטמון עם תפוגה
const stepsCache = {
  data: {},
  timestamps: {},

  set: function (key, userId, value, expirationMinutes = 5) {
    if (!this.data[userId]) {
      this.data[userId] = {};
      this.timestamps[userId] = {};
    }
    this.data[userId][key] = value;
    this.timestamps[userId][key] = Date.now() + expirationMinutes * 60 * 1000;
  },

  get: function (key, userId) {
    if (
      !this.data[userId] ||
      !this.timestamps[userId] ||
      !this.timestamps[userId][key]
    ) {
      return null;
    }

    if (Date.now() > this.timestamps[userId][key]) {
      // פג תוקף
      delete this.data[userId][key];
      delete this.timestamps[userId][key];
      return null;
    }

    return this.data[userId][key];
  },

  invalidate: function (userId, key = null) {
    if (key) {
      // מחיקת מפתח ספציפי
      if (this.data[userId]?.[key]) delete this.data[userId][key];
      if (this.timestamps[userId]?.[key]) delete this.timestamps[userId][key];
    } else {
      // מחיקת כל המפתחות של המשתמש
      delete this.data[userId];
      delete this.timestamps[userId];
    }
  },
};

// תור עדכונים עם ניסיונות חוזרים
const operationsQueue = {
  queue: [],
  processing: false,

  add: function (operation) {
    // הוספת זמן יצירה ומספר ניסיונות
    this.queue.push({
      ...operation,
      createdAt: Date.now(),
      attempts: 0,
    });

    this._saveToLocalStorage();

    if (!this.processing) {
      this.processQueue();
    }
  },

  _saveToLocalStorage: function () {
    localStorage.setItem("stepsQueue", JSON.stringify(this.queue));
  },

  processQueue: async function () {
    if (this.queue.length === 0 || this.processing) {
      return;
    }

    this.processing = true;

    try {
      const item = this.queue[0];
      item.attempts++;

      // ביצוע הפעולה הרלוונטית
      let success = false;

      try {
        if (item.operation === "incrementSteps") {
          const { userId, newSteps, additionalData } = item;
          success = await _incrementStepsInternal(
            userId,
            newSteps,
            additionalData
          );
        } else if (item.operation === "updateSteps") {
          const { userId, stepsData } = item;
          success = await _updateStepsInternal(userId, stepsData);
        }
      } catch (error) {
        console.error(`Error processing queue item: ${error.message}`);
        success = false;
      }

      // הסרה מהתור אם הצליח או אחרי יותר מדי ניסיונות
      if (success || item.attempts >= 5) {
        this.queue.shift();
        this._saveToLocalStorage();
      } else {
        // תור מתקדם עם backoff
        const waitTime = Math.min(30000, 1000 * Math.pow(2, item.attempts));
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      // המשך לפריט הבא
      if (this.queue.length > 0) {
        this.processQueue();
      } else {
        this.processing = false;
      }
    } catch (error) {
      console.error("Error in queue processing", error);
      this.processing = false;
    }
  },

  initialize: function () {
    try {
      const savedQueue = localStorage.getItem("stepsQueue");
      if (savedQueue) {
        this.queue = JSON.parse(savedQueue);
        // ניקוי פעולות ישנות מאוד (יותר משבוע)
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        this.queue = this.queue.filter((item) => item.createdAt > oneWeekAgo);
        this._saveToLocalStorage();
      }
    } catch (error) {
      console.error("Error initializing steps queue", error);
      this.queue = [];
      this._saveToLocalStorage();
    }
  },
};

// אתחול התור בטעינה
operationsQueue.initialize();
/**
 * Get today's steps for the user with cache support
 * @param {string} userId - מזהה המשתמש
 * @returns {Promise<Object>} - נתוני צעדים להיום
 */
export async function getTodaySteps(userId) {
  if (!userId) {
    console.warn("User ID is required to get steps");
    return null;
  }

  // בדיקה במטמון
  const cachedData = stepsCache.get("todaySteps", userId);
  if (cachedData) {
    return cachedData;
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    const { data, error } = await supabase
      .from("user_steps")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (error) {
      if (error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Error fetching steps data:", error);

        // Fallback to localStorage if server fails
        const localSteps = JSON.parse(
          localStorage.getItem(`steps_${userId}_${today}`) || "null"
        );
        if (localSteps) {
          console.log("Using cached step data from localStorage");

          // שמירה במטמון
          stepsCache.set("todaySteps", userId, localSteps);

          return localSteps;
        }
      }

      // יצירת אובייקט ברירת מחדל
      const defaultData = {
        user_id: userId,
        date: today,
        steps: 0,
        distance: 0,
        calories: 0,
        stars: 0,
        streak: 0,
        created_at: new Date().toISOString(),
      };

      // שמירה במטמון
      stepsCache.set("todaySteps", userId, defaultData);

      return defaultData;
    }

    // שמירה במטמון
    stepsCache.set("todaySteps", userId, data);

    return data;
  } catch (error) {
    console.error("Exception in getTodaySteps:", error);

    // Return default data in case of error
    const defaultData = {
      user_id: userId,
      date: today,
      steps: 0,
      distance: 0,
      calories: 0,
      stars: 0,
      streak: 0,
      created_at: new Date().toISOString(),
    };

    return defaultData;
  }
}

/**
 * פונקציה פנימית לעדכון צעדים ישירות (ללא תור)
 * @private
 */
async function _updateStepsInternal(userId, stepData) {
  if (!userId) {
    return false;
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    // הכנת הנתונים לעדכון
    const dataToUpsert = {
      user_id: userId,
      date: today,
      ...stepData,
      updated_at: new Date().toISOString(),
    };

    // בדיקה אם כבר קיימת רשומה להיום
    const { data: existingData } = await supabase
      .from("user_steps")
      .select("id")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    let result;

    if (existingData) {
      // עדכון רשומה קיימת (יותר יעיל)
      result = await supabase
        .from("user_steps")
        .update(dataToUpsert)
        .eq("id", existingData.id);
    } else {
      // יצירת רשומה חדשה
      result = await supabase.from("user_steps").insert(dataToUpsert);
    }

    // מחיקת מטמון
    stepsCache.invalidate(userId, "todaySteps");

    return !result.error;
  } catch (error) {
    console.error("Error updating steps:", error);
    return false;
  }
}
/**
 * פונקציה פנימית להגדלת מספר הצעדים
 * @private
 */
async function _incrementStepsInternal(userId, newSteps, additionalData = {}) {
  if (!userId || !newSteps || newSteps <= 0) {
    return false;
  }

  try {
    // Get current steps
    const currentData = await getTodaySteps(userId);

    if (!currentData) {
      return false;
    }

    // Calculate new values with more accurate algorithms
    const updatedSteps = (currentData.steps || 0) + newSteps;

    // יחס צעדים למרחק משתנה לפי גובה המשתמש (ברירת מחדל: 1.3 צעדים למטר)
    const stepsToMetersRatio = additionalData.userHeight
      ? 0.414 * (additionalData.userHeight / 100) // נוסחה מותאמת לפי גובה בס"מ
      : 1.3;
    const updatedDistance =
      (currentData.distance || 0) + newSteps / stepsToMetersRatio;

    // חישוב קלוריות מדויק יותר לפי משקל ומהירות
    const userWeight = additionalData.userWeight || 70; // ק"ג
    const avgSpeed = additionalData.speed || 5; // קמ"ש
    // נוסחה: קלוריות = משקל * מרחק * מקדם מהירות * 0.001
    const speedFactor = avgSpeed < 4 ? 0.6 : avgSpeed < 6 ? 0.8 : 1.1;
    const newDistance = newSteps / stepsToMetersRatio / 1000; // בק"מ
    const newCalories = Math.round(userWeight * newDistance * speedFactor);
    const updatedCalories = (currentData.calories || 0) + newCalories;

    // Get current streak and update if needed
    const streak = await getStreak(userId);

    // Check if there are any stars collected today
    const { data: starsData, error: starsError } = await supabase
      .from("collected_stars")
      .select("id")
      .eq("user_id", userId)
      .gte("collected_at", new Date().toISOString().split("T")[0]); // Today's date

    // Count of stars collected today
    const starsCollected = starsError ? 0 : starsData?.length || 0;

    // שדות חדשים
    const now = new Date().toISOString();

    // Get zone ID if available
    const zoneId =
      additionalData.zoneId ||
      localStorage.getItem(`current_zone_${userId}`) ||
      null;

    // Get event ID if available
    const eventId =
      additionalData.eventId ||
      localStorage.getItem(`current_event_${userId}`) ||
      null;

    // XP and coins earned for this increment (ניקוד משופר)
    const xpMultiplier = streak > 2 ? 1 + streak * 0.1 : 1; // בונוס רצף
    const baseXp = Math.ceil(newSteps * 0.2);
    const xpEarned = Math.ceil(baseXp * xpMultiplier);

    // בונוס מטבעות בסופי שבוע
    const today = new Date();
    const isWeekend = today.getDay() === 5 || today.getDay() === 6; // יום שישי או שבת
    const coinMultiplier = isWeekend ? 1.5 : 1;
    const coinsEarned = Math.ceil((newSteps / 10) * coinMultiplier);

    // Update the database with all new values
    const updateData = {
      steps: updatedSteps,
      distance: updatedDistance,
      calories: updatedCalories,
      streak: streak,
      stars: starsCollected,
      zone_id: zoneId,
      event_id: eventId,
      xp_earned: (currentData.xp_earned || 0) + xpEarned,
      coins_earned: (currentData.coins_earned || 0) + coinsEarned,
      updated_at: now,
    };

    // אם יש שדות נוספים, נוסיף אותם
    if (additionalData.route_id) {
      updateData.route_id = additionalData.route_id;
    }

    const result = await _updateStepsInternal(userId, updateData);

    // Update user achievements if steps cross thresholds
    await _updateStepAchievements(userId, updatedSteps, additionalData);

    // Update streak achievements if needed
    if (streak > 0) {
      await _updateStepAchievements(userId, streak);
    }

    // עדכון אירועים מיוחדים (אם יש)
    if (eventId) {
      await _updateQuestProgress(userId, eventId, newSteps);
    }

    // עדכון התקדמות משימות
    await _updateQuestProgress(userId, newSteps, updateData.distance);

    return !!result;
  } catch (error) {
    console.error("Error incrementing steps:", error);
    return false;
  }
}
/**
 * Update or insert today's steps for the user
 * @param {string} userId - מזהה המשתמש
 * @param {Object} stepData - נתוני צעדים לעדכון
 * @returns {Promise<Object>} - נתוני צעדים מעודכנים
 */
export async function upsertTodaySteps(userId, stepData) {
  if (!userId) {
    console.warn("User ID is required to update steps");
    return null;
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    // Prepare data with all required fields
    const dataToUpsert = {
      user_id: userId,
      date: today,
      ...stepData,
      updated_at: new Date().toISOString(),
    };

    // Save to localStorage as backup
    localStorage.setItem(
      `steps_${userId}_${today}`,
      JSON.stringify(dataToUpsert)
    );

    try {
      // ניסיון לעדכן ישירות
      const success = await _updateStepsInternal(userId, stepData);

      if (success) {
        return dataToUpsert;
      }

      // אם נכשל, הוסף לתור
      operationsQueue.add({
        operation: "updateSteps",
        userId,
        stepsData: { ...stepData },
      });

      return dataToUpsert;
    } catch (error) {
      console.error("Error updating steps:", error);

      // הוספה לתור במקרה של שגיאה
      operationsQueue.add({
        operation: "updateSteps",
        userId,
        stepsData: { ...stepData },
      });

      return dataToUpsert;
    }
  } catch (error) {
    console.error("Exception in upsertTodaySteps:", error);
    return null;
  }
}

/**
 * Increment the user's steps by a specific amount with enhanced retry
 * @param {string} userId - מזהה המשתמש
 * @param {number} newSteps - מספר צעדים חדשים להוספה
 * @param {Object} additionalData - נתונים נוספים (גובה, משקל, מהירות, אזור, אירוע וכו')
 * @returns {Promise<boolean>} - סטטוס הצלחה
 */
export async function incrementSteps(userId, newSteps, additionalData = {}) {
  if (!userId || !newSteps || newSteps <= 0) {
    return false;
  }

  try {
    // Try to update directly
    const success = await _incrementStepsInternal(
      userId,
      newSteps,
      additionalData
    );

    if (success) {
      return true;
    }

    // If failed, add to queue
    operationsQueue.add({
      operation: "incrementSteps",
      userId,
      newSteps,
      additionalData,
    });

    return true; // יחזיר הצלחה כי נוסף לתור
  } catch (error) {
    console.error("Error in incrementSteps:", error);

    // Add to queue in case of error
    operationsQueue.add({
      operation: "incrementSteps",
      userId,
      newSteps,
      additionalData,
    });

    return true;
  }
}

/**
 * עדכון הישגי צעדים
 * @private
 */
async function _updateStepAchievements(
  userId,
  totalSteps,
  additionalData = {}
) {
  try {
    // Get achievements related to steps
    const { data: achievements, error: achievementsError } = await supabase
      .from("achievements_game")
      .select("*")
      .eq("category", "steps")
      .order("target", { ascending: true });

    if (achievementsError) {
      console.error("Error fetching step achievements:", achievementsError);
      return;
    }

    // No achievements found
    if (!achievements || achievements.length === 0) {
      return;
    }

    // Get user achievements
    const { data: userAchievements, error: userAchievementsError } =
      await supabase
        .from("user_achievements_game")
        .select("*")
        .eq("user_id", userId)
        .eq("category", "steps");

    if (userAchievementsError && userAchievementsError.code !== "PGRST116") {
      console.error("Error fetching user achievements:", userAchievementsError);
      return;
    }

    // Map user achievements by achievement_id
    const userAchievementMap = {};
    if (userAchievements) {
      userAchievements.forEach((ua) => {
        userAchievementMap[ua.achievement_id] = ua;
      });
    }

    const now = new Date().toISOString();
    const updates = [];

    // Check each step achievement
    for (const achievement of achievements) {
      const userAchievement = userAchievementMap[achievement.achievement_id];

      // If already unlocked, skip
      if (userAchievement?.unlocked) continue;

      // If steps reached target
      if (totalSteps >= achievement.target) {
        if (userAchievement) {
          // Update existing achievement
          updates.push(
            supabase
              .from("user_achievements_game")
              .update({
                progress: totalSteps,
                unlocked: true,
                unlocked_at: now,
                updated_at: now,
              })
              .eq("id", userAchievement.id)
          );
        } else {
          // Create new achievement record
          updates.push(
            supabase.from("user_achievements_game").insert({
              user_id: userId,
              achievement_id: achievement.achievement_id,
              category: "steps",
              progress: totalSteps,
              unlocked: false,
            })
          );
        }
      }
    }

    // Execute all updates in parallel
    if (updates.length > 0) {
      await Promise.all(updates);
    }
  } catch (error) {
    console.error("Error updating step achievements:", error);
  }
}

/**
 * עדכון התקדמות במשימות
 * @private
 */
async function _updateQuestProgress(userId, newSteps, newDistance) {
  try {
    // קבלת משימות פעילות
    const { data: activeQuests, error: questsError } = await supabase
      .from("user_quests")
      .select("*, quest:quest_id(*)")
      .eq("user_id", userId)
      .eq("completed", false)
      .lt("expires_at", new Date().toISOString());

    if (questsError) {
      console.error("Error fetching active quests:", questsError);
      return;
    }

    // אם אין משימות פעילות
    if (!activeQuests || activeQuests.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const updates = [];

    // עדכון התקדמות לכל משימה
    for (const userQuest of activeQuests) {
      const quest = userQuest.quest;

      // אם לא קיבלנו את המשימה המקושרת, נדלג
      if (!quest) continue;

      // בדיקה אם זו משימת צעדים או מרחק
      let newProgress = userQuest.progress || 0;
      let isUpdated = false;

      if (quest.type === "steps" && newSteps > 0) {
        newProgress += newSteps;
        isUpdated = true;
      } else if (quest.type === "distance" && newDistance > 0) {
        newProgress += newDistance;
        isUpdated = true;
      }

      // אם יש עדכון
      if (isUpdated) {
        // בדיקה אם המשימה הושלמה
        const isCompleted = newProgress >= quest.objective_value;

        updates.push(
          supabase
            .from("user_quests")
            .update({
              progress: newProgress,
              completed: isCompleted,
              completed_at: isCompleted ? now : null,
              updated_at: now,
            })
            .eq("id", userQuest.id)
        );

        // אם המשימה הושלמה, הענקת הפרס
        if (isCompleted) {
          updates.push(
            _updateUserInventory(
              userId,
              quest.xp_reward || 0,
              quest.coins_reward || 0
            )
          );
        }
      }
    }

    // ביצוע כל העדכונים במקביל
    if (updates.length > 0) {
      await Promise.all(updates);
    }
  } catch (error) {
    console.error("Error updating quest progress:", error);
  }
}

/**
 * Get the current streak for a user
 * @private
 */
async function getStreak(userId) {
  try {
    const { data, error } = await supabase
      .from('user_steps')
      .select('streak')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching streak:', error);
      return 0;
    }

    return data?.[0]?.streak || 0;
  } catch (error) {
    console.error('Exception in getStreak:', error);
    return 0;
  }
}

/**
 * פונקציית עזר - ניקוי מטמונים
 */
export function clearStepsCache(userId = null) {
  if (userId) {
    stepsCache.invalidate(userId);
  } else {
    // איפוס מטמון כללי
    Object.keys(stepsCache.data).forEach((id) => {
      stepsCache.invalidate(id);
    });
  }
}

/**
 * Helper function to update user's inventory with rewards
 * @private
 */
async function _updateUserInventory(userId, xpReward, coinsReward) {
  try {
    const { error } = await supabase.rpc('update_user_inventory', {
      user_id: userId,
      xp_amount: xpReward,
      coins_amount: coinsReward
    });

    if (error) {
      console.error('Error updating user inventory:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Exception in updateUserInventory:', error);
    return false;
  }
}

/**
 * פונקציית עזר - ניסיון לעבד תור הסנכרון
 */
export function processStepsQueue() {
  return operationsQueue.processQueue();
}