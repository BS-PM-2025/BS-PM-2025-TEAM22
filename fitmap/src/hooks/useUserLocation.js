import { useState, useEffect, useCallback } from 'react';

export const useUserLocation = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // שמירה ב-localStorage
  const saveLocationToStorage = useCallback((location) => {
    if (location) {
      try {
        localStorage.setItem('userLocation', JSON.stringify(location));
      } catch (err) {
        console.warn('שגיאה בשמירת מיקום:', err);
      }
    }
  }, []);

  // קריאה מ-localStorage
  const loadLocationFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem('userLocation');
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.warn('שגיאה בקריאה מהמיקום השמור:', err);
      return null;
    }
  }, []);

  // קריאה ל-Geolocation API
  const getUserPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation לא נתמך בדפדפן זה');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        saveLocationToStorage(location);
        setIsLocating(false);
      },
      (error) => {
        console.warn('שגיאה באיתור מיקום:', error);
        let message;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'הגישה למיקום נדחתה';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'אין מידע מיקום זמין';
            break;
          case error.TIMEOUT:
            message = 'פג זמן המתנה למיקום';
            break;
          default:
            message = 'שגיאה לא ידועה במיקום';
        }
        setLocationError(message);
        setIsLocating(false);

        const saved = loadLocationFromStorage();
        if (saved) {
          setUserLocation(saved);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, [saveLocationToStorage, loadLocationFromStorage]);

  // פונקציה למרכז מפה לפי מיקום המשתמש
  const centerOnUser = useCallback((mapInstance) => {
    if (!mapInstance) {
      console.warn("אין מופע מפה תקף");
      return;
    }

    if (userLocation) {
      mapInstance.setCenter(userLocation);
      mapInstance.setZoom(14);
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          saveLocationToStorage(location);
          mapInstance.setCenter(location);
          mapInstance.setZoom(14);
        },
        (error) => {
          console.warn("שגיאה באחזור מיקום:", error);
          alert("לא הצלחנו לקבל את מיקומך");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  }, [userLocation, setUserLocation, saveLocationToStorage]);

  // טעינה ראשונית
  useEffect(() => {
    const saved = loadLocationFromStorage();
    if (saved) {
      setUserLocation(saved);
    }
    getUserPosition();
  }, [loadLocationFromStorage, getUserPosition]);

  return {
    userLocation,
    setUserLocation,
    isLocating,
    locationError,
    getUserPosition,
    centerOnUser
  };
};

export default useUserLocation;
