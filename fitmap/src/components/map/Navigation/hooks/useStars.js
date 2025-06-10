// src/components/map/Navigation/hooks/useStars.js
import { useState, useCallback, useEffect } from "react";
import { fetchCollectedStarIds, loadStarsFromDatabase } from "../../../../services/collectedStarsService";

/**
 * Custom hook לניהול כוכבים במשחק
 * @param {string} userId - מזהה המשתמש
 * @param {Object} position - מיקום נוכחי {lat, lng}
 * @param {Array} initialStars - מערך כוכבים ראשוני (אופציונלי)
 * @returns {Object} - API לניהול כוכבים
 */
const useStars = (userId, position, initialStars = []) => {
  // State לניהול כוכבים
  const [starsData, setStarsData] = useState([]);
  const [visibleStars, setVisibleStars] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collectedIds, setCollectedIds] = useState(new Set());

  /**
   * טעינת כוכבים מהשרת
   */
  const loadUserStars = useCallback(async () => {
    if (!userId || !position) return;

    setIsLoading(true);
    setError(null);

    try {
      // טעינת מזהי כוכבים שכבר נאספו
      const ids = await fetchCollectedStarIds(userId);
      setCollectedIds(new Set(ids));

      // טעינת כוכבים מהשרת בהתבסס על המיקום הנוכחי
      const radius = 1000; // רדיוס בחיפוש במטרים
      const stars = await loadStarsFromDatabase(userId, position, radius);

      // עיבוד הכוכבים והגדרת תכונות נוספות לתצוגה
      const processedStars = stars.map(star => ({
        ...star,
        // הוספת תכונות נוספות שדרושות לקומפוננטה
        visible: false,
        type: star.type || "regular",
        animationState: "idle"
      }));

      setStarsData(processedStars);
      console.log(`נטענו ${processedStars.length} כוכבים מהשרת`);
    } catch (err) {
      console.error("שגיאה בטעינת כוכבים:", err);
      setError("אירעה שגיאה בטעינת הכוכבים");
    } finally {
      setIsLoading(false);
    }
  }, [userId, position]);

  /**
   * יצירת כוכבים אקראיים להדגמה
   * @param {Object} centerPosition - מיקום מרכזי
   * @returns {Array} - מערך כוכבים לדוגמה
   */
  const generateDemoStars = useCallback((centerPosition) => {
    if (!centerPosition) return [];

    console.log("יוצר כוכבי דמו במיקום:", centerPosition);
    const demoStars = [];
    const now = Date.now();

    // סוגי כוכבים ומשקולות
    const starTypes = ['regular', 'gold', 'silver', 'bronze'];
    const typeWeights = [0.7, 0.1, 0.1, 0.1]; // הסתברויות

    // יצירת 50 כוכבים
    for (let i = 0; i < 50; i++) {
      // בחירת מרחק (10 עד 500 מטר) וזווית אקראיים
      const distance = 10 + Math.random() * 490;
      const angle = Math.random() * Math.PI * 2;

      // חישוב הסטה בקואורדינטות
      // 0.000009 מעלות בערך שווה למטר אחד
      const latOffset = Math.sin(angle) * distance * 0.000009;
      const lngOffset = Math.cos(angle) * distance * 0.000009;

      // בחירת סוג כוכב אקראי לפי משקולות
      let selectedType = 'regular';
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
      switch (selectedType) {
        case 'gold': points = 5; break;
        case 'silver': points = 3; break;
        case 'bronze': points = 2; break;
        default: points = 1; break;
      }

      // יצירת הכוכב
      demoStars.push({
        id: `demo_star_${now}_${i}`,
        lat: centerPosition.lat + latOffset,
        lng: centerPosition.lng + lngOffset,
        points,
        type: selectedType,
        collected: false,
        visible: false,
        animationState: "idle"
      });
    }

    return demoStars;
  }, []);

  /**
   * סינון כוכבים לפי מרחק מהמיקום הנוכחי
   * @param {Array} stars - מערך כוכבים
   * @param {Object} currentPosition - מיקום נוכחי
   * @param {number} maxDistance - מרחק מקסימלי במטרים
   * @returns {Array} - מערך כוכבים מסונן
   */
  const filterStarsByDistance = useCallback((stars, currentPosition, maxDistance = 1000) => {
    if (!stars || !currentPosition || !window.google || !window.google.maps) {
      return stars;
    }

    // סינון כוכבים לפי מרחק
    return stars.filter(star => {
      try {
        const starPosition = new window.google.maps.LatLng(star.lat, star.lng);
        const userPosition = new window.google.maps.LatLng(
          currentPosition.lat,
          currentPosition.lng
        );

        // חישוב מרחק באמצעות Google Maps
        const distance = window.google.maps.geometry.spherical.computeDistanceBetween(
          userPosition,
          starPosition
        );

        return distance <= maxDistance;
      } catch (err) {
        console.error("שגיאה בחישוב מרחק לכוכב:", err);
        return true; // במקרה של שגיאה כלול את הכוכב
      }
    });
  }, []);

  /**
   * עדכון כוכב כנאסף
   * @param {string} starId - מזהה הכוכב שנאסף
   * @returns {Object|null} - הכוכב שנאסף או null אם לא נמצא
   */
  const markStarAsCollected = useCallback((starId) => {
    if (!starId) return null;

    // עדכון מערך הכוכבים
    setStarsData(currentStars => {
      const updatedStars = currentStars.map(star => {
        if (star.id === starId) {
          return { ...star, collected: true };
        }
        return star;
      });
      return updatedStars;
    });

    // עדכון מערך מזהי הכוכבים שנאספו
    setCollectedIds(prevIds => {
      const newIds = new Set(prevIds);
      newIds.add(starId);
      return newIds;
    });

    // מציאת הכוכב שנאסף
    const collectedStar = starsData.find(star => star.id === starId);
    return collectedStar || null;
  }, [starsData]);

  /**
   * בדיקה אם כוכב נאסף כבר
   * @param {string} starId - מזהה הכוכב
   * @returns {boolean} - האם הכוכב נאסף
   */
  const isStarCollected = useCallback((starId) => {
    return collectedIds.has(starId);
  }, [collectedIds]);

  // טעינת כוכבים ראשונית (כאשר יש מזהה משתמש ומיקום)
  useEffect(() => {
    if (userId && position) {
      loadUserStars();
    }
  }, [userId, position, loadUserStars]);

  // טעינת כוכבים ראשוניים או כוכבי דמו אם אין כוכבים
  useEffect(() => {
    if (starsData.length > 0) return;

    if (initialStars && initialStars.length > 0) {
      // שימוש בכוכבים שנשלחו כפרמטר
      setStarsData(initialStars);
    } else if (position && !isLoading && !error) {
      // יצירת כוכבי דמו אם אין כוכבים אחרים
      const demoStars = generateDemoStars(position);
      setStarsData(demoStars);
    }
  }, [position, initialStars, starsData.length, isLoading, error, generateDemoStars]);

  // החזרת ה-API של ה-hook
  return {
    starsData,
    setStarsData,
    visibleStars,
    setVisibleStars,
    isLoading,
    error,
    loadUserStars,
    generateDemoStars,
    filterStarsByDistance,
    markStarAsCollected,
    isStarCollected,
    collectedIds
  };
};

export default useStars;