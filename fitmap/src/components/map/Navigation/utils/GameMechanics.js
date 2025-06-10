/**
 * סוגי תגמולים במשחק
 */
export const REWARD_TYPES = {
  STAR_COLLECT: "STAR_COLLECT", // איסוף כוכב
  WALK_DISTANCE: "WALK_DISTANCE", // הליכה למרחק
  ACHIEVEMENT: "ACHIEVEMENT", // השגת הישג
  DAILY_BONUS: "DAILY_BONUS", // בונוס יומי
  COMBO: "COMBO", // רצף איסוף
  LOCATION_DISCOVERY: "LOCATION_DISCOVERY", // גילוי מיקום חדש
  QUEST_COMPLETION: "QUEST_COMPLETION", // השלמת משימה
};

/**
 * סוגי כוכבים עם מאפיינים ייחודיים
 */
export const STAR_TYPES = {
  regular: {
    basePoints: [1, 3],
    bonusChance: 0.05,
    color: "#FFD700",
    glowColor: "#FFA500",
    rarity: "common",
  },
  silver: {
    basePoints: [3, 6],
    bonusChance: 0.1,
    color: "#C0C0C0",
    glowColor: "#808080",
    rarity: "uncommon",
  },
  gold: {
    basePoints: [5, 10],
    bonusChance: 0.15,
    color: "#FFD700",
    glowColor: "#FF8C00",
    rarity: "rare",
  },
  bronze: {
    basePoints: [2, 4],
    bonusChance: 0.08,
    color: "#CD7F32",
    glowColor: "#8B4513",
    rarity: "uncommon",
  },
  culture: {
    basePoints: [4, 8],
    bonusChance: 0.12,
    color: "#9C27B0",
    glowColor: "#7B1FA2",
    rarity: "rare",
  },
  history: {
    basePoints: [4, 8],
    bonusChance: 0.12,
    color: "#3F51B5",
    glowColor: "#303F9F",
    rarity: "rare",
  },
  nature: {
    basePoints: [4, 8],
    bonusChance: 0.12,
    color: "#4CAF50",
    glowColor: "#388E3C",
    rarity: "rare",
  },
  event: {
    basePoints: [10, 20],
    bonusChance: 0.25,
    color: "#FF4081",
    glowColor: "#D81B60",
    rarity: "epic",
  },
};

/**
 * קונפיגורציית מערכת רצף (קומבו)
 */
export const COMBO_CONFIG = {
  comboTimeout: 10000, // זמן בין איסופים לשמירת קומבו (מילישניות)
  maxComboMultiplier: 5, // מכפיל קומבו מקסימלי
  comboIncreaseFactor: 0.1, // כמה כל איסוף מוסיף למכפיל
  specialBonusThresholds: [5, 10, 15, 20, 25, 50], // רצפים עם בונוסים מיוחדים
};

/**
 * קונפיגורציית מערכת בונוס יומי
 */
export const DAILY_BONUS_CONFIG = {
  baseCoins: 100, // מטבעות בסיסיים ליום
  baseXp: 200, // XP בסיסי ליום
  maxStreakMultiplier: 5, // מכפיל מקסימלי לרצף ימים
  streakMilestoneDays: [3, 7, 14, 21, 30, 60, 90], // אבני דרך לרצף
};

// ============ Core Game Mechanics Functions ============

/**
 * חישוב תגמול עבור איסוף כוכב
 * Calculate rewards for star collection
 *
 * @param {Object} star - הכוכב שנאסף
 * @param {Object} playerState - מצב השחקן הנוכחי
 * @returns {Object} תגמולים שהתקבלו
 */
export const calculateStarReward = (star, playerState) => {
  const basePoints = star.points || 1;
  let bonusMultiplier = 1.0;
  let bonusReasons = [];

  // מכפיל קומבו אם אוספים כוכבים ברצף מהיר
  if (playerState.comboCount > 0) {
    const comboMultiplier = Math.min(
      COMBO_CONFIG.maxComboMultiplier,
      1 + playerState.comboCount * COMBO_CONFIG.comboIncreaseFactor
    );

    bonusMultiplier *= comboMultiplier;
    bonusReasons.push(`קומבו x${playerState.comboCount}`);

    // בונוסים מיוחדים לרצפי קומבו ספציפיים
    if (COMBO_CONFIG.specialBonusThresholds.includes(playerState.comboCount)) {
      bonusMultiplier *= 1.5;
      bonusReasons.push(`בונוס קומבו מיוחד!`);
    }
  }

  // בונוס לפי סוג הכוכב
  if (star.type === "gold") {
    bonusMultiplier *= 3;
    bonusReasons.push("כוכב זהב");
  } else if (star.type === "silver") {
    bonusMultiplier *= 2;
    bonusReasons.push("כוכב כסף");
  } else if (star.type === "bronze") {
    bonusMultiplier *= 1.5;
    bonusReasons.push("כוכב ארד");
  }

  // בונוס ליום עם איסופים מרובים
  if (playerState.dailyCollectionCount > 10) {
    bonusMultiplier *= 1.2;
    bonusReasons.push("איסוף מאסיבי");
  }

  // בונוס למהירות איסוף
  if (
    playerState.lastCollectionTime &&
    Date.now() - playerState.lastCollectionTime < 5000
  ) {
    bonusMultiplier *= 1.3;
    bonusReasons.push("איסוף מהיר");
  }

  // בונוס לאיסוף כוכבים באזור חדש
  const areaKey = getAreaKey(star);
  if (!playerState.visitedAreas[areaKey]) {
    bonusMultiplier *= 1.5;
    bonusReasons.push("אזור חדש");
  }

  // בונוס לסוף שבוע
  const isWeekend = new Date().getDay() === 5 || new Date().getDay() === 6; // יום שישי או שבת
  if (isWeekend) {
    bonusMultiplier *= 1.3;
    bonusReasons.push("בונוס סוף שבוע");
  }

  // חישוב סופי
  const finalPoints = Math.round(basePoints * bonusMultiplier);
  const coins = Math.round(finalPoints * 0.7); // 70% מהנקודות למטבעות
  const xp = Math.round(finalPoints * 1.5); // 150% מהנקודות ל-XP

  return {
    points: finalPoints,
    coins,
    xp,
    bonusMultiplier,
    bonusReasons,
  };
};

/**
 * יצירת מפתח אזור מיקום
 * @param {Object} position - מיקום גיאוגרפי
 * @returns {string} מפתח אזור
 */
const getAreaKey = (position) => {
  // עיגול לדיוק של 3 ספרות אחרי הנקודה לקבוצות אזורים
  const lat = Math.round(position.lat * 1000) / 1000;
  const lng = Math.round(position.lng * 1000) / 1000;
  return `${lat},${lng}`;
};

/**
 * עדכון מערכת הקומבו
 * Update combo system
 *
 * @param {Object} playerState - מצב השחקן הנוכחי
 * @returns {Object} - מצב הקומבו המעודכן
 */
export const updateComboSystem = (playerState) => {
  const currentTime = Date.now();
  const timeSinceLastCollection =
    currentTime - (playerState.lastCollectionTime || 0);

  let comboCount = playerState.comboCount || 0;
  let comboLevel = 0; // 0=רגיל, 1=טוב, 2=מעולה, 3=מושלם
  let comboMessage = "";

  // אם עבר יותר מדי זמן, מתאפס הקומבו
  if (timeSinceLastCollection > COMBO_CONFIG.comboTimeout) {
    comboCount = 1; // מתחילים קומבו חדש
    comboMessage = "קומבו חדש!";
  } else {
    // הגדלת הקומבו
    comboCount++;

    // קביעת רמת הקומבו ומסר מתאים
    if (comboCount >= 25) {
      comboLevel = 3;
      comboMessage = "קומבו מושלם!!!";
    } else if (comboCount >= 10) {
      comboLevel = 2;
      comboMessage = "קומבו מעולה!!";
    } else if (comboCount >= 5) {
      comboLevel = 1;
      comboMessage = "קומבו טוב!";
    } else {
      comboLevel = 0;
      comboMessage = `קומבו: ${comboCount}`;
    }
  }

  // יצירת אובייקט קומבו עם כל הפרטים
  return {
    comboCount,
    comboLevel,
    comboMessage,
    isSpecialComboThreshold:
      COMBO_CONFIG.specialBonusThresholds.includes(comboCount),
    lastCollectionTime: currentTime,
    comboStartTime: playerState.comboStartTime || currentTime,
    maxCombo: Math.max(comboCount, playerState.maxCombo || 0),
  };
};

/**
 * חישוב בונוס יומי
 * Calculate daily bonus
 *
 * @param {Object} playerState - מצב השחקן הנוכחי
 * @returns {Object} - פרטי הבונוס היומי
 */
export const calculateDailyBonus = (playerState) => {
  const lastLoginDate = playerState.lastLoginDate
    ? new Date(playerState.lastLoginDate)
    : null;
  const currentDate = new Date();

  // בדיקה אם זה יום חדש
  if (
    !lastLoginDate ||
    lastLoginDate.getDate() !== currentDate.getDate() ||
    lastLoginDate.getMonth() !== currentDate.getMonth() ||
    lastLoginDate.getFullYear() !== currentDate.getFullYear()
  ) {
    // בדיקת רצף ימים
    let consecutiveDays = playerState.consecutiveLoginDays || 0;

    // אם היום האחרון היה אתמול, מגדילים את הרצף, אחרת מאפסים
    if (lastLoginDate) {
      const yesterday = new Date(currentDate);
      yesterday.setDate(yesterday.getDate() - 1);

      if (
        lastLoginDate.getDate() === yesterday.getDate() &&
        lastLoginDate.getMonth() === yesterday.getMonth() &&
        lastLoginDate.getFullYear() === yesterday.getFullYear()
      ) {
        consecutiveDays++;
      } else {
        consecutiveDays = 1;
      }
    } else {
      consecutiveDays = 1;
    }

    // חישוב מכפיל רצף (מוגבל למקסימום)
    const streakFactor = Math.min(
      DAILY_BONUS_CONFIG.maxStreakMultiplier,
      1 + consecutiveDays * 0.1 // גידול של 10% לכל יום ברצף
    );

    // חישוב בונוס סופי עם מכפיל
    const bonusCoins = Math.round(DAILY_BONUS_CONFIG.baseCoins * streakFactor);
    const bonusXp = Math.round(DAILY_BONUS_CONFIG.baseXp * streakFactor);

    // בדיקה אם זהו יום אבן דרך עם בונוס מיוחד
    const isMilestone =
      DAILY_BONUS_CONFIG.streakMilestoneDays.includes(consecutiveDays);

    return {
      isNewDay: true,
      consecutiveDays,
      streakBonusMultiplier: streakFactor,
      bonusCoins,
      bonusXp,
      isMilestone,
    };
  }

  return {
    isNewDay: false,
    consecutiveDays: playerState.consecutiveLoginDays || 0,
  };
};

/**
 * חישוב הרמה והתקדמות השחקן
 * Calculate player level and progression
 *
 * @param {number} xp - סך נקודות הניסיון
 * @returns {Object} - פרטי הרמה וההתקדמות
 */
export const calculatePlayerLevel = (xp) => {
  // נוסחה לחישוב רמה בהתבסס על XP
  // כל רמה דורשת יותר XP מהרמה הקודמת
  const baseXP = 1000;
  const exponent = 1.5;

  let level = 1;
  let xpForCurrentLevel = 0;
  let xpForNextLevel = baseXP;

  while (xp >= xpForNextLevel) {
    level++;
    xpForCurrentLevel = xpForNextLevel;
    xpForNextLevel = Math.round(baseXP * Math.pow(level, exponent));
  }

  const currentLevelXp = xp - xpForCurrentLevel;
  const nextLevelRequirement = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = Math.round(
    (currentLevelXp / nextLevelRequirement) * 100
  );

  return {
    level,
    currentLevelXp,
    nextLevelRequirement,
    progressPercent,
    totalXp: xp,
  };
};

/**
 * בדיקה אם השחקן קיבל רמה חדשה
 * Check if player leveled up
 *
 * @param {Object} prevState - מצב שחקן קודם
 * @param {Object} newState - מצב שחקן חדש
 * @returns {Object|null} - פרטי העלאת הרמה או null אם לא הייתה העלאה
 */
export const checkLevelUp = (prevState, newState) => {
  const prevLevel = calculatePlayerLevel(prevState.xp || 0);
  const newLevel = calculatePlayerLevel(newState.xp || 0);

  if (newLevel.level > prevLevel.level) {
    // יצירת רשימת תגמולים לפי רמה
    const levelRewards = getLevelUpRewards(newLevel.level);

    return {
      prevLevel: prevLevel.level,
      newLevel: newLevel.level,
      rewardCoins: levelRewards.coins,
      newAbilities: levelRewards.abilities,
    };
  }

  return null;
};

/**
 * קבלת תגמולים לעליית רמה
 * @param {number} level - הרמה החדשה
 * @returns {Object} - תגמולים לרמה זו
 */
function getLevelUpRewards(level) {
  // תגמולים לפי רמה
  const rewards = {
    coins: level * 100,
    abilities: [],
  };

  // יכולות מיוחדות לרמות מסוימות
  switch (level) {
    case 2:
      rewards.abilities.push({ id: "star_detector", name: "גלאי כוכבים" });
      break;
    case 3:
      rewards.abilities.push({ id: "star_magnet", name: "מגנט כוכבים" });
      break;
    case 5:
      rewards.abilities.push({ id: "combo_master", name: "מאסטר קומבו" });
      break;
    case 10:
      rewards.abilities.push({ id: "special_stars", name: "כוכבים מיוחדים" });
      break;
    case 15:
      rewards.abilities.push({ id: "star_radar", name: "רדאר כוכבים" });
      break;
    default:
      rewards.abilities = []; // No special abilities for other levels
      break;
  }

  return rewards;
}

/**
 * בדיקה והחזרת הישגים חדשים
 * Check and return newly completed achievements
 *
 * @param {Object} playerState - מצב השחקן הנוכחי
 * @param {Array} achievements - רשימת הישגים
 * @returns {Array} - הישגים חדשים שהושגו
 */
export const checkNewAchievements = (playerState, achievements) => {
  const newAchievements = [];

  achievements.forEach((achievement) => {
    // אם ההישג כבר הושג, מדלגים
    if (achievement.unlocked) return;

    let fulfilled = false;

    // בדיקת סוגי הישגים
    switch (achievement.type) {
      case "STARS_COLLECTED":
        fulfilled = playerState.totalStarsCollected >= achievement.target;
        break;
      case "DISTANCE_WALKED":
        fulfilled = playerState.totalDistance >= achievement.target;
        break;
      case "LOCATIONS_VISITED":
        fulfilled =
          Object.keys(playerState.visitedAreas || {}).length >=
          achievement.target;
        break;
      case "MAX_COMBO":
        fulfilled = playerState.maxCombo >= achievement.target;
        break;
      case "DAILY_STREAK":
        fulfilled = playerState.consecutiveLoginDays >= achievement.target;
        break;
      default:
        // מקרה ברירת מחדל: לא מתקיים ההישג
        fulfilled = false;
        break;
    }

    if (fulfilled) {
      newAchievements.push({
        ...achievement,
        unlocked: true,
        unlockedDate: new Date().toISOString(),
      });
    }
  });

  return newAchievements;
};

/**
 * עדכון מצב משחק על בסיס צעדים והליכה
 * Update game state based on walking and steps
 *
 * @param {Object} playerState - מצב השחקן
 * @param {number} newSteps - מספר צעדים חדשים
 * @param {number} distance - מרחק במטרים
 * @returns {Object} - מצב שחקן מעודכן
 */
export const processWalkingActivity = (playerState, newSteps, distance) => {
  if (!playerState || newSteps <= 0) return playerState;

  // העתקת מצב השחקן הנוכחי
  const updatedState = { ...playerState };

  // עדכון סטטיסטיקות בסיסיות
  updatedState.totalSteps = (updatedState.totalSteps || 0) + newSteps;
  updatedState.totalDistance = (updatedState.totalDistance || 0) + distance;

  // חישוב XP מצעדים
  const stepsXp = Math.round(newSteps * 0.2); // 0.2 XP לכל צעד

  // מטבעות מצעדים - יחס פשוט יותר
  const stepsCoins = Math.round(newSteps / 10);

  // עדכון מטבעות ו-XP הכללי
  updatedState.coins = (updatedState.coins || 0) + stepsCoins;
  updatedState.xp = (updatedState.xp || 0) + stepsXp;

  return {
    ...updatedState,
    lastUpdateTime: new Date().toISOString(),
    todaySteps: (updatedState.todaySteps || 0) + newSteps,
  };
};

/**
 * יצירת משימות דינמיות
 * Generate dynamic quests
 *
 * @param {Object} playerState - מצב השחקן
 * @param {string} questType - סוג המשימה ("daily", "weekly")
 * @returns {Array} - רשימת משימות חדשות
 */
export const generateDynamicQuests = (playerState, questType = "daily") => {
  if (!playerState) return [];

  const playerLevel = calculatePlayerLevel(playerState.xp || 0).level;
  const currentDate = new Date();

  // רשימת משימות אפשריות לפי סוג
  const questPools = {
    daily: [
      {
        type: "steps",
        title: "צעדים יומיים",
        description: "צעד {target} צעדים היום",
        targetBase: 5000,
        targetLevelMultiplier: 500,
        xpReward: 200,
        coinsReward: 100,
      },
      {
        type: "stars",
        title: "איסוף כוכבים",
        description: "אסוף {target} כוכבים",
        targetBase: 10,
        targetLevelMultiplier: 2,
        xpReward: 150,
        coinsReward: 75,
      },
      {
        type: "gold_stars",
        title: "איסוף כוכבי זהב",
        description: "אסוף {target} כוכבי זהב",
        targetBase: 2,
        targetLevelMultiplier: 0.5,
        xpReward: 250,
        coinsReward: 125,
      },
    ],
    weekly: [
      {
        type: "total_steps",
        title: "צעדים שבועיים",
        description: 'צעד סה"כ {target} צעדים השבוע',
        targetBase: 25000,
        targetLevelMultiplier: 2500,
        xpReward: 1000,
        coinsReward: 500,
      },
      {
        type: "stars_collection",
        title: "אספן כוכבים שבועי",
        description: "אסוף {target} כוכבים השבוע",
        targetBase: 50,
        targetLevelMultiplier: 5,
        xpReward: 800,
        coinsReward: 400,
      },
    ],
  };

  // בחירת מאגר משימות מתאים
  const pool = questPools[questType] || questPools.daily;

  // מספר המשימות לבחירה לפי סוג
  const questsToGenerate = questType === "daily" ? 3 : 2;

  // בחירת משימות אקראית
  const selectedQuests = [];
  const availableQuests = [...pool];

  for (let i = 0; i < questsToGenerate; i++) {
    if (availableQuests.length === 0) break;

    // בחירה אקראית
    const randIndex = Math.floor(Math.random() * availableQuests.length);
    const selectedQuest = availableQuests[randIndex];

    // הסרת המשימה שנבחרה מהמאגר למניעת כפילות
    availableQuests.splice(randIndex, 1);

    // חישוב ערך יעד ספציפי לפי רמת השחקן
    let target = Math.round(
      selectedQuest.targetBase +
        playerLevel * selectedQuest.targetLevelMultiplier
    );

    // חישוב תאריך תפוגה
    let expiryDate;
    if (questType === "daily") {
      // סוף היום הנוכחי
      expiryDate = new Date(currentDate);
      expiryDate.setHours(23, 59, 59, 999);
    } else {
      // סוף השבוע (עד יום שבת)
      expiryDate = new Date(currentDate);
      const daysToSaturday = 6 - expiryDate.getDay(); // 6 = שבת
      expiryDate.setDate(expiryDate.getDate() + daysToSaturday);
      expiryDate.setHours(23, 59, 59, 999);
    }

    // יצירת אובייקט המשימה המלא
    const quest = {
      id: `${selectedQuest.type}_${Date.now()}_${i}`,
      type: selectedQuest.type,
      title: selectedQuest.title,
      description: selectedQuest.description.replace("{target}", target),
      target,
      progress: 0,
      completed: false,
      createdAt: new Date().toISOString(),
      expiryDate: expiryDate.toISOString(),
      rewards: {
        xp: selectedQuest.xpReward,
        coins: selectedQuest.coinsReward,
      },
    };

    selectedQuests.push(quest);
  }

  return selectedQuests;
};

/**
 * עדכון התקדמות במשימה
 * Update quest progress
 *
 * @param {Object} quest - המשימה לעדכון
 * @param {Object} playerAction - פעולת השחקן
 * @returns {Object} - משימה מעודכנת
 */
export const updateQuestProgress = (quest, playerAction) => {
  if (!quest || !playerAction) return quest;

  // העתקת המשימה
  const updatedQuest = { ...quest };

  // קביעת התקדמות בסיסית
  let newProgress = updatedQuest.progress || 0;
  let wasUpdated = false;

  // התאמת ההתקדמות לפי סוג המשימה וסוג הפעולה
  switch (updatedQuest.type) {
    case "steps":
    case "total_steps":
      if (playerAction.type === "steps" && playerAction.count) {
        newProgress += playerAction.count;
        wasUpdated = true;
      }
      break;

    case "stars":
    case "stars_collection":
      if (playerAction.type === "collect_star") {
        newProgress += 1;
        wasUpdated = true;
      }
      break;

    case "gold_stars":
      if (
        playerAction.type === "collect_star" &&
        playerAction.starType === "gold"
      ) {
        newProgress += 1;
        wasUpdated = true;
      }
      break;
      
    default:
      // מקרה ברירת מחדל: לא נעשה עדכון
      wasUpdated = false;
      break;
  }

  // עדכון ההתקדמות רק אם היה שינוי
  if (wasUpdated) {
    updatedQuest.progress = newProgress;

    // בדיקה אם המשימה הושלמה
    if (newProgress >= updatedQuest.target && !updatedQuest.completed) {
      updatedQuest.completed = true;
      updatedQuest.completedAt = new Date().toISOString();
    }
  }

  return updatedQuest;
};

/**
 * יצירת מזהה ייחודי לאובייקטים במשחק
 * @param {string} prefix - קידומת למזהה
 * @returns {string} - מזהה ייחודי
 */
export function generateUniqueId(prefix = "obj") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}