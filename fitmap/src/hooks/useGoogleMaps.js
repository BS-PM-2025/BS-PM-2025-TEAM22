// src/hooks/useGoogleMaps.js
import { useState, useEffect, useCallback } from 'react';

/**
 * הוק לטעינת Google Maps API ויצירת מופע מפה
 * גרסה משופרת שמונעת טעינות כפולות ומספקת חיווי סטטוס
 */
export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [map, setMap] = useState(null);
  const [mapContainer, setMapContainer] = useState(null);
  const [placesService, setPlacesService] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // פונקציה לבדיקה אם ה-API של גוגל מפות נטען
  const isGoogleMapsLoaded = useCallback(() => {
    return window.google && window.google.maps && window.google.maps.places;
  }, []);

  // פונקציה ליצירת מפה
  const createMap = useCallback((container, options = {}) => {
    if (!isGoogleMapsLoaded() || !container) {
      return null;
    }

    try {
      const defaultOptions = {
        center: { lat: 32.0853, lng: 34.7818 }, // ברירת מחדל: תל אביב
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            "featureType": "poi.business",
            "stylers": [{ "visibility": "off" }]
          }
        ]
      };

      const mapOptions = { ...defaultOptions, ...options };
      const googleMap = new window.google.maps.Map(container, mapOptions);
      
      // שמירת המפה בסטייט
      setMap(googleMap);
      
      // יצירת שירות Places
      const service = new window.google.maps.places.PlacesService(googleMap);
      setPlacesService(service);
      
      console.log("✅ מפה נוצרה בהצלחה, כולל שירות Places");
      
      return googleMap;
    } catch (err) {
      console.error("שגיאה ביצירת מפה:", err);
      setLoadError(err.message);
      return null;
    }
  }, [isGoogleMapsLoaded]);

  // טעינת Google Maps API
  useEffect(() => {
    // אם כבר טעון, אין צורך לטעון שוב
    if (isGoogleMapsLoaded()) {
      console.log("✅ Google Maps API כבר טעון");
      setIsLoaded(true);
      return;
    }

    // זיהוי האם הסקריפט כבר קיים בדף
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      console.log("⚠️ סקריפט Google Maps כבר קיים בדף, ממתין לטעינה");
      
      // האזנה לסיום טעינה של הסקריפט הקיים
      const checkLoaded = () => {
        if (isGoogleMapsLoaded()) {
          console.log("✅ Google Maps נטען מסקריפט קיים");
          setIsLoaded(true);
          clearInterval(checkInterval);
        }
      };
      
      const checkInterval = setInterval(checkLoaded, 100);
      
      return () => {
        clearInterval(checkInterval);
      };
    }
    
    // טעינת הסקריפט
    console.log("⌛ מתחיל טעינת Google Maps API...");
    
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      const error = new Error('Google Maps API key לא נמצא. יש לבדוק את קובץ ה-.env');
      console.error('❌', error);
      setLoadError(error);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&region=IL&language=he`;
    script.async = true;
    script.defer = true;

    const handleScriptLoad = () => {
      console.log("✅ Google Maps API נטען בהצלחה");
      setIsLoaded(true);
    };

    const handleScriptError = (e) => {
      const error = new Error('❌ שגיאה בטעינת Google Maps API');
      console.error(error, e);
      setLoadError(error);
    };

    script.addEventListener('load', handleScriptLoad);
    script.addEventListener('error', handleScriptError);
    
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', handleScriptLoad);
      script.removeEventListener('error', handleScriptError);
    };
  }, [isGoogleMapsLoaded]);

  // שמירת ה-ref של המכיל
  const setMapRef = useCallback((ref) => {
    if (ref && ref !== mapContainer) {
      setMapContainer(ref);
    }
  }, [mapContainer]);

  // יצירת מפה אוטומטית כאשר ה-API נטען והמכיל זמין
  useEffect(() => {
    if (isLoaded && mapContainer && !map) {
      createMap(mapContainer);
    }
  }, [isLoaded, mapContainer, map, createMap]);

  return { 
    isLoaded, 
    map, 
    placesService,
    loadError, 
    setMapRef,
    createMap
  };
};