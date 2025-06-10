import { useState, useEffect, useCallback } from 'react';

export const useUserLocation = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [locationUpdateCallback, setLocationUpdateCallback] = useState(null);

  // שמירה ב-localStorage
  const saveLocationToStorage = useCallback((location) => {
    if (location) {
      try {
        localStorage.setItem('userLocation', JSON.stringify(location));
        localStorage.setItem('locationTimestamp', Date.now().toString());
      } catch (err) {
        console.warn('שגיאה בשמירת מיקום:', err);
      }
    }
  }, []);

  // קריאה מ-localStorage
  const loadLocationFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem('userLocation');
      const timestamp = localStorage.getItem('locationTimestamp');
      
      if (saved && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        // אם המיקום ישן מ-30 דקות, נתעלם ממנו
        if (age < 30 * 60 * 1000) {
          return JSON.parse(saved);
        }
      }
      return null;
    } catch (err) {
      console.warn('שגיאה בקריאה מהמיקום השמור:', err);
      return null;
    }
  }, []);

  // עדכון מיקום והפעלת callback
  const updateLocation = useCallback((location) => {
    setUserLocation(location);
    saveLocationToStorage(location);
    
    // הפעלת callback אם קיים (לחיפוש מתקנים)
    if (locationUpdateCallback) {
      locationUpdateCallback(location);
    }
  }, [saveLocationToStorage, locationUpdateCallback]);

  // קריאה ל-Geolocation API
  const getUserPosition = useCallback((options = {}) => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation לא נתמך בדפדפן זה');
      return Promise.reject(new Error('Geolocation not supported'));
    }

    setIsLocating(true);
    setLocationError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          updateLocation(location);
          setIsLocating(false);
          resolve(location);
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
            updateLocation(saved);
            resolve(saved);
          } else {
            reject(error);
          }
        },
        {
          enableHighAccuracy: options.enableHighAccuracy !== false,
          timeout: options.timeout || 10000,
          maximumAge: options.maximumAge || 300000
        }
      );
    });
  }, [updateLocation, loadLocationFromStorage]);

  // פונקציה למרכז מפה לפי מיקום המשתמש
  const centerOnUser = useCallback((mapInstance) => {
    if (!mapInstance) {
      console.warn("אין מופע מפה תקף");
      return Promise.reject(new Error("No map instance"));
    }

    if (userLocation) {
      mapInstance.setCenter(userLocation);
      mapInstance.setZoom(14);
      return Promise.resolve(userLocation);
    } else {
      return getUserPosition({ enableHighAccuracy: true })
        .then(location => {
          mapInstance.setCenter(location);
          mapInstance.setZoom(16);
          return location;
        })
        .catch(error => {
          console.warn("שגיאה באחזור מיקום:", error);
          throw error;
        });
    }
  }, [userLocation, getUserPosition]);

  // פונקציה לרישום callback שיופעל בעדכון מיקום
  const onLocationUpdate = useCallback((callback) => {
    setLocationUpdateCallback(() => callback);
  }, []);

  // מעקב מתמשך אחר מיקום
  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation לא נתמך בדפדפן זה');
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        updateLocation(location);
      },
      (error) => {
        console.warn('שגיאה במעקב מיקום:', error);
        setLocationError('שגיאה במעקב אחר מיקום');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [updateLocation]);

  // טעינה ראשונית
  useEffect(() => {
    const saved = loadLocationFromStorage();
    if (saved) {
      setUserLocation(saved);
    }
    
    // איתור מיקום ראשוני
    getUserPosition({ enableHighAccuracy: false })
      .then(location => {
        // לאחר מיקום ראשוני מהיר, נבקש מיקום מדויק יותר
        getUserPosition({ enableHighAccuracy: true });
      })
      .catch(err => {
        console.warn('לא הצלחנו לקבל מיקום ראשוני');
      });
  }, [getUserPosition, loadLocationFromStorage]);

  return {
    userLocation,
    setUserLocation: updateLocation,
    isLocating,
    locationError,
    getUserPosition,
    centerOnUser,
    watchPosition,
    onLocationUpdate
  };
};

export default useUserLocation;