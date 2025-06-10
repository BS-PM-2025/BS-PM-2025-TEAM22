// src/components/map/Navigation/hooks/useQuests.js
import { useState, useCallback, useEffect } from "react";
import { 
  getUserQuests, 
  updateQuestProgress, 
  claimQuestReward,
  refreshUserQuests 
} from "../../../../services/questService";

/**
 * Custom hook לניהול משימות (קווסטים) במשחק
 * @param {string} userId - מזהה המשתמש
 * @returns {Object} API לניהול משימות
 */
const useQuests = (userId) => {
  // State למשימות ומידע קשור
  const [quests, setQuests] = useState([]);
  const [activeQuests, setActiveQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [expiredQuests, setExpiredQuests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasNewlyCompletedQuest, setHasNewlyCompletedQuest] = useState(false);
  
  /**
   * טעינת משימות המשתמש
   * @param {boolean} includeCompleted - האם לכלול משימות שהושלמו
   * @param {boolean} includeExpired - האם לכלול משימות שפג תוקפן
   */
  const loadQuests = useCallback(async (includeCompleted = true, includeExpired = false) => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userQuests = await getUserQuests(userId, includeCompleted, includeExpired);
      setQuests(userQuests);
      
      // מיון המשימות לקטגוריות שונות
      const now = new Date();
      
      const active = userQuests.filter(quest => 
        !quest.completed && new Date(quest.expiresAt) > now
      );
      
      const completed = userQuests.filter(quest => 
        quest.completed
      );
      
      const expired = userQuests.filter(quest => 
        !quest.completed && new Date(quest.expiresAt) <= now
      );
      
      setActiveQuests(active);
      setCompletedQuests(completed);
      setExpiredQuests(expired);
      
      // בדיקה אם יש משימה שהושלמה לאחרונה ולא נתבעה
      const newlyCompleted = completed.some(quest => 
        quest.completed && !quest.rewardClaimed
      );
      
      setHasNewlyCompletedQuest(newlyCompleted);
    } catch (err) {
      console.error("שגיאה בטעינת משימות:", err);
      setError("אירעה שגיאה בטעינת המשימות");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  
  /**
   * עדכון התקדמות במשימה
   * @param {string} questId - מזהה המשימה
   * @param {number} progress - התקדמות חדשה
   * @param {boolean} additive - האם להוסיף לקיים או להחליף
   * @returns {Promise<Object|null>} - המשימה המעודכנת או null
   */
  const updateProgress = useCallback(async (questId, progress, additive = true) => {
    if (!userId || !questId) return null;
    
    try {
      // קריאה לעדכון המשימה
      const updatedQuest = await updateQuestProgress(userId, questId, {
        progress,
        additive
      });
      
      if (updatedQuest) {
        // עדכון ה-state המקומי
        setQuests(prevQuests => 
          prevQuests.map(quest => 
            quest.questId === questId ? updatedQuest : quest
          )
        );
        
        // בדיקה אם המשימה הושלמה כעת
        if (updatedQuest.completed) {
          setHasNewlyCompletedQuest(true);
          
          // עדכון הקטגוריות
          await loadQuests();
        }
        
        return updatedQuest;
      }
      
      return null;
    } catch (err) {
      console.error(`שגיאה בעדכון משימה ${questId}:`, err);
      return null;
    }
  }, [userId, loadQuests]);
  
  /**
   * תביעת פרס עבור משימה שהושלמה
   * @param {string} questId - מזהה המשימה
   * @returns {Promise<Object|null>} - פרטי הפרס או null
   */
  const claimReward = useCallback(async (questId) => {
    if (!userId || !questId) return null;
    
    try {
      // קריאה לתביעת הפרס
      const reward = await claimQuestReward(userId, questId);
      
      if (reward) {
        // עדכון ה-state המקומי
        setQuests(prevQuests => 
          prevQuests.map(quest => 
            quest.questId === questId 
              ? { ...quest, rewardClaimed: true } 
              : quest
          )
        );
        
        // טעינה מחדש להסרת המשימה מרשימת "חדשות להצגה"
        await loadQuests();
        
        return reward;
      }
      
      return null;
    } catch (err) {
      console.error(`שגיאה בתביעת פרס למשימה ${questId}:`, err);
      return null;
    }
  }, [userId, loadQuests]);
  
  /**
   * ריענון כל המשימות - יצירת משימות חדשות
   * @returns {Promise<boolean>} - האם הריענון הצליח
   */
  const refreshAllQuests = useCallback(async () => {
    if (!userId) return false;
    
    setIsLoading(true);
    
    try {
      // קריאה לריענון המשימות
      const newQuests = await refreshUserQuests(userId);
      
      if (newQuests && newQuests.length > 0) {
        // טעינה מחדש של המשימות
        await loadQuests();
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("שגיאה בריענון משימות:", err);
      setError("אירעה שגיאה בריענון המשימות");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadQuests]);
  
  /**
   * קבלת ההתקדמות באחוזים עבור משימה
   * @param {Object} quest - אובייקט המשימה
   * @returns {number} - אחוז ההתקדמות (0-100)
   */
  const getQuestProgress = useCallback((quest) => {
    if (!quest || !quest.objectiveValue) return 0;
    
    const progress = quest.progress || 0;
    const target = quest.objectiveValue;
    
    return Math.min(100, Math.floor((progress / target) * 100));
  }, []);
  
  /**
   * קבלת משימות שהושלמו וטרם נתבעו
   * @returns {Array} - רשימת משימות שהושלמו וטרם נתבעו
   */
  const getUnclaimedCompletedQuests = useCallback(() => {
    return completedQuests.filter(quest => !quest.rewardClaimed);
  }, [completedQuests]);
  
  /**
   * בדיקה אם משימה פגת תוקף
   * @param {Object} quest - אובייקט המשימה
   * @returns {boolean} - האם המשימה פגת תוקף
   */
  const isQuestExpired = useCallback((quest) => {
    if (!quest || !quest.expiresAt) return false;
    
    const now = new Date();
    const expiryDate = new Date(quest.expiresAt);
    
    return expiryDate <= now;
  }, []);
  
  /**
   * חישוב זמן נותר למשימה בפורמט אנושי
   * @param {Object} quest - אובייקט המשימה
   * @returns {string} - זמן נותר בפורמט אנושי
   */
  const getRemainingTime = useCallback((quest) => {
    if (!quest || !quest.expiresAt || isQuestExpired(quest)) {
      return "פג תוקף";
    }
    
    const now = new Date();
    const expiryDate = new Date(quest.expiresAt);
    const timeDiff = expiryDate - now;
    
    // חישוב בשעות ודקות
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} ימים`;
    } else if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')} שעות`;
    } else {
      return `${minutes} דקות`;
    }
  }, [isQuestExpired]);
  
  // טעינת משימות בעת טעינת הקומפוננטה
  useEffect(() => {
    if (userId) {
      loadQuests(true, false);
    }
  }, [userId, loadQuests]);
  
  // בדיקה תקופתית להתחדשות משימות - כל 5 דקות
  useEffect(() => {
    if (!userId) return;
    
    const interval = setInterval(() => {
      loadQuests(true, false);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [userId, loadQuests]);
  
  // החזרת ה-API של ה-hook
  return {
    quests,
    activeQuests,
    completedQuests,
    expiredQuests,
    isLoading,
    error,
    hasNewlyCompletedQuest,
    loadQuests,
    updateProgress,
    claimReward,
    refreshAllQuests,
    getQuestProgress,
    getUnclaimedCompletedQuests,
    isQuestExpired,
    getRemainingTime
  };
};

export default useQuests;