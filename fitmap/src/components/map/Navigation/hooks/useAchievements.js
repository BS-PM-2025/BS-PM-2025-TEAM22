// src/components/map/Navigation/hooks/useAchievements.js
import { useState, useCallback, useEffect, useRef } from "react";
import { 
  getUserAchievements, 
  getCompletedAchievementsToShow, 
  markAchievementAsShown 
} from "../../../../services/achievementService";

/**
 * Custom hook לניהול הישגים במשחק
 * @param {number} walkingDistance - המרחק שנצבר בהליכה
 * @param {Array} starsData - נתוני כוכבים כולל סטטוס איסוף
 * @param {string} userId - מזהה המשתמש
 * @returns {Object} API לניהול הישגים
 */
const useAchievements = (walkingDistance, starsData, userId) => {
  // State להישגים ומידע הקשור בהם
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingAchievements, setPendingAchievements] = useState([]);
  
  // Refs לערכים קודמים להשוואה
  const prevWalkingDistanceRef = useRef(0);
  const prevStarsCountRef = useRef(0);
  
  /**
   * טעינת הישגים מהשרת
   */
  const loadAchievements = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userAchievements = await getUserAchievements(userId);
      setAchievements(userAchievements);
      
      // בדיקת הישגים שהושלמו אך טרם הוצגו
      const completedToShow = await getCompletedAchievementsToShow(userId);
      setPendingAchievements(completedToShow);
    } catch (err) {
      console.error("שגיאה בטעינת הישגים:", err);
      setError("אירעה שגיאה בטעינת ההישגים");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  
  /**
   * בדיקת הישגים בהתבסס על המצב הנוכחי והדקות אותם
   * @param {string} [achievementId] - מזהה הישג ספציפי לבדיקה (אופציונלי)
   */
  const checkAchievements = useCallback(async (achievementId = null) => {
    if (!userId) return;
    
    // אם יש מזהה הישג, סימון הישג ספציפי כנצפה
    if (achievementId) {
      try {
        await markAchievementAsShown(userId, achievementId);
        
        // עדכון רשימת ההישגים הממתינים
        setPendingAchievements(prev => 
          prev.filter(a => a.achievementId !== achievementId)
        );
      } catch (err) {
        console.error(`שגיאה בסימון הישג ${achievementId} כנצפה:`, err);
      }
      return;
    }
    
    // אחרת, טעינת כל ההישגים מחדש
    await loadAchievements();
  }, [userId, loadAchievements]);
  
  /**
   * החזרת הישג שהושלם ומוכן להצגה
   * @returns {Object|null} הישג להצגה או null אם אין
   */
  const showCompletedAchievements = useCallback(() => {
    if (pendingAchievements.length === 0) return null;
    return pendingAchievements[0];
  }, [pendingAchievements]);
  
  /**
   * קבלת התקדמות עבור הישג ספציפי
   * @param {string} achievementId - מזהה ההישג
   * @returns {number} אחוז ההתקדמות (0-100)
   */
  const getAchievementProgress = useCallback((achievementId) => {
    const achievement = achievements.find(a => a.achievementId === achievementId);
    if (!achievement) return 0;
    
    const progress = achievement.progress || 0;
    const target = achievement.target || 100;
    return Math.min(100, Math.floor((progress / target) * 100));
  }, [achievements]);
  
  /**
   * בדיקה אם הישג הושלם
   * @param {string} achievementId - מזהה ההישג
   * @returns {boolean} האם ההישג הושלם
   */
  const isAchievementCompleted = useCallback((achievementId) => {
    const achievement = achievements.find(a => a.achievementId === achievementId);
    return achievement?.unlocked || false;
  }, [achievements]);
  
  // טעינת הישגים בעת טעינת הקומפוננטה
  useEffect(() => {
    if (userId) {
      loadAchievements();
    }
  }, [userId, loadAchievements]);
  
  // בדיקת הישגים כאשר יש שינוי בנתונים רלוונטיים
  useEffect(() => {
    // בדיקת שינויים במשתנים רלוונטיים
    const currentDistance = walkingDistance;
    const currentStarsCount = starsData
      ? starsData.filter((s) => s.collected).length
      : 0;
      
    // בדיקה אם יש שינוי בנתונים
    const hasDistanceChanged = Math.abs(currentDistance - prevWalkingDistanceRef.current) > 10; // שינוי של 10 מטר לפחות
    const hasStarsCountChanged = currentStarsCount !== prevStarsCountRef.current;
    
    // עדכון ערכים שנשמרים להשוואה
    prevWalkingDistanceRef.current = currentDistance;
    prevStarsCountRef.current = currentStarsCount;
    
    // רק אם יש שינוי משמעותי, עדכן הישגים
    if (hasDistanceChanged || hasStarsCountChanged) {
      // טעינה מחדש של הישגים לאחר השהייה קצרה
      const timer = setTimeout(() => {
        loadAchievements();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [walkingDistance, starsData, loadAchievements]);
  
  // החזרת ה-API של ה-hook
  return {
    achievements,
    setAchievements,
    isLoading,
    error,
    checkAchievements,
    showCompletedAchievements,
    getAchievementProgress,
    isAchievementCompleted,
    pendingAchievements
  };
};

export default useAchievements;