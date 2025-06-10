import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../utils/supabaseClient";
import {
  calculateDistance,
  createFacilityFromGooglePlace,
} from "../utils/geoUtils";

export const useCombinedFacilities = (filters, userLocation, googleMaps) => {
  const [allFacilities, setAllFacilities] = useState([]);
  const [googleFacilities, setGoogleFacilities] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);

  const didFetchDBRef = useRef(false);

  // שלב 1: טען מתקנים מה־DB פעם אחת
  useEffect(() => {
    if (didFetchDBRef.current) return;
    didFetchDBRef.current = true;

    const fetchAllFacilities = async () => {
      setLoading(true);
      try {
        console.log("Loading facilities from database...");
        const { data, error } = await supabase.from("facilities").select("*");
        if (error) throw error;
        console.log(`Loaded ${data.length} from DB`);
        setAllFacilities(data.map(f => ({ ...f, source: 'database' })));
      } catch (err) {
        console.error("Error loading DB facilities:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllFacilities();
  }, []);

  // שלב 2: חיפוש מורחב ב־Google Places
  const searchNearbyFitnessFacilities = useCallback((location, distanceKm = 10) => {
    if (!googleMaps.placesService || !location) return;

    setIsSearchingGoogle(true);

    const radius = Math.min(distanceKm * 1000, 50000);
    
    // רשימה מורחבת של סוגי מקומות לחיפוש
    const typesToSearch = [
      // כושר וספורט מסורתיים
      { type: 'gym', keyword: 'fitness gym' },
      { type: 'spa', keyword: 'spa wellness' },
      { type: 'physiotherapist', keyword: 'rehabilitation therapy' },
      
      // מתקני מים
      { type: 'swimming_pool', keyword: 'swimming pool' },
      { type: 'aquarium', keyword: 'aquatic center' },
      
      // ספורט כדור
      { type: 'stadium', keyword: 'stadium sports' },
      { type: 'bowling_alley', keyword: 'bowling' },
      { type: 'golf_course', keyword: 'golf course' },
      
      // מתקני חוצות
      { type: 'park', keyword: 'fitness park outdoor gym' },
      { type: 'campground', keyword: 'camping hiking' },
      { type: 'zoo', keyword: 'zoo animal park' },
      { type: 'amusement_park', keyword: 'amusement park' },
      
      // ספורט אקסטרים
      { type: 'bicycle_store', keyword: 'bike rental cycling' },
      
      // מתקנים חברתיים
      { type: 'community_center', keyword: 'community center' },
      
      // ספורט מחבט
      { type: 'tennis_court', keyword: 'tennis court' },
      { type: 'basketball_court', keyword: 'basketball court' },
      { type: 'soccer_field', keyword: 'soccer football field' },
      
      // בידור ופנאי
      { type: 'movie_theater', keyword: 'cinema movie' },
      { type: 'arcade', keyword: 'arcade gaming' },
      { type: 'night_club', keyword: 'nightclub dancing' },
      
      // שירותים רלוונטיים
      { type: 'hospital', keyword: 'medical center sports medicine' },
      { type: 'pharmacy', keyword: 'pharmacy supplements' },
      { type: 'gas_station', keyword: 'gas station convenience' },
      { type: 'shopping_mall', keyword: 'shopping sports store' },
      
      // חינוך ותרבות
      { type: 'school', keyword: 'sports facility school gym' },
      { type: 'university', keyword: 'university sports center' },
      { type: 'library', keyword: 'community library' },
      { type: 'museum', keyword: 'sports museum' }
    ];

    let allResults = [];
    let completed = 0;
    const totalSearches = typesToSearch.length;

    const handleSearchResult = (results, status, searchInfo) => {
      completed++;
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        // סינון תוצאות כדי למנוע כפילויות
        const newResults = results.filter(result => 
          !allResults.some(existing => existing.place_id === result.place_id)
        );
        
        // הוספת מידע על סוג החיפוש
        newResults.forEach(result => {
          result.search_type = searchInfo.type;
          result.search_keyword = searchInfo.keyword;
        });
        
        allResults.push(...newResults);
        console.log(`חיפוש ${searchInfo.type}: נמצאו ${newResults.length} תוצאות חדשות`);
      } else if (status !== window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        console.warn(`שגיאה בחיפוש ${searchInfo.type}:`, status);
      }

      // כשכל החיפושים הסתיימו
      if (completed === totalSearches) {
        console.log(`סה"כ נמצאו ${allResults.length} מקומות מ-Google Places`);
        
        // המרה למבנה המתקנים שלנו
        const formattedFacilities = allResults
          .map(createFacilityFromGooglePlace)
          .filter(Boolean);
        
        console.log(`לאחר עיבוד: ${formattedFacilities.length} מתקנים תקפים`);
        setGoogleFacilities(formattedFacilities);
        setIsSearchingGoogle(false);
      }
    };

    // ביצוע חיפושים מקבילים
    typesToSearch.forEach((searchInfo) => {
      const request = {
        location: new window.google.maps.LatLng(location.lat, location.lng),
        radius,
        type: searchInfo.type,
        keyword: searchInfo.keyword
      };
      
      googleMaps.placesService.nearbySearch(
        request, 
        (results, status) => handleSearchResult(results, status, searchInfo)
      );
    });

    // חיפוש נוסף עם textSearch לתוצאות מדויקות יותר
    const textSearchQueries = [
      'gym fitness center',
      'outdoor fitness park',
      'swimming pool',
      'yoga studio pilates',
      'martial arts dojo',
      'basketball court',
      'tennis court',
      'soccer field',
      'running track',
      'climbing gym',
      'crossfit box',
      'spa wellness center'
    ];

    textSearchQueries.forEach((query, index) => {
      setTimeout(() => {
        const textRequest = {
          location: new window.google.maps.LatLng(location.lat, location.lng),
          radius,
          query: query
        };
        
        googleMaps.placesService.textSearch(textRequest, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const newResults = results.filter(result => 
              !allResults.some(existing => existing.place_id === result.place_id)
            );
            
            newResults.forEach(result => {
              result.search_type = 'text_search';
              result.search_keyword = query;
            });
            
            allResults.push(...newResults);
            console.log(`חיפוש טקסט "${query}": נמצאו ${newResults.length} תוצאות חדשות`);
          }
        });
      }, index * 100); // עיכוב קטן בין חיפושים למניעת חסימה
    });

  }, [googleMaps.placesService]);

  // שלב 2.1: הרץ חיפוש אוטומטי כשהמיקום משתנה
  const prevLocationRef = useRef(null);
  useEffect(() => {
    if (!userLocation || !googleMaps.placesService) return;

    const changed = !prevLocationRef.current ||
      calculateDistance(
        prevLocationRef.current.lat, 
        prevLocationRef.current.lng, 
        userLocation.lat, 
        userLocation.lng
      ) > 0.5;

    if (changed) {
      searchNearbyFitnessFacilities(userLocation, filters.distance);
      prevLocationRef.current = userLocation;
    }
  }, [userLocation, filters.distance, googleMaps.placesService, searchNearbyFitnessFacilities]);

  // שלב 3: סינון ומיזוג מתקדם
  const filterPredicates = useCallback(facility => {
    // סינון לפי סוג מתקן
    if (filters.types.length && !filters.types.includes(facility.type)) {
      return false;
    }
    
    // סינון לפי מרחק
    if (userLocation && filters.distance > 0) {
      const dist = calculateDistance(
        userLocation.lat, userLocation.lng,
        parseFloat(facility.latitude), parseFloat(facility.longitude)
      );
      if (dist > filters.distance) return false;
    }
    
    // סינון לפי ציוד
    if (filters.equipment.length && facility.equipment) {
      const hasRequiredEquipment = filters.equipment.some(e => 
        facility.equipment.includes(e)
      );
      if (!hasRequiredEquipment) return false;
    }
    
    // סינון לפי מאפיינים
    if (filters.features.length && facility.features) {
      const hasAllFeatures = filters.features.every(f => 
        facility.features.includes(f)
      );
      if (!hasAllFeatures) return false;
    }
    
    // סינון לפי דירוג (אם מוגדר)
    if (filters.minRating && facility.rating < filters.minRating) {
      return false;
    }
    
    // סינון לפי מחיר (אם מוגדר)
    if (filters.maxPriceLevel !== undefined && facility.price_level > filters.maxPriceLevel) {
      return false;
    }
    
    // סינון לפי סטטוס פתוח/סגור
    if (filters.openNow && facility.opening_hours && !facility.opening_hours.open_now) {
      return false;
    }
    
    return true;
  }, [filters, userLocation]);

  // שלב 4: מיזוג וסידור התוצאות
  useEffect(() => {
    setLoading(true);
    
    const filteredDB = allFacilities.filter(filterPredicates);
    const filteredGoogle = googleFacilities.filter(filterPredicates);
    
    // מיזוג התוצאות
    const merged = [...filteredDB, ...filteredGoogle];
    
    // סידור לפי מרחק ודירוג
    if (userLocation) {
      merged.sort((a, b) => {
        const distanceA = calculateDistance(
          userLocation.lat, userLocation.lng,
          parseFloat(a.latitude), parseFloat(a.longitude)
        );
        const distanceB = calculateDistance(
          userLocation.lat, userLocation.lng,
          parseFloat(b.latitude), parseFloat(b.longitude)
        );
        
        // אם המרחק דומה (פחות מ-500 מטר), סדר לפי דירוג
        if (Math.abs(distanceA - distanceB) < 0.5) {
          return (b.rating || 0) - (a.rating || 0);
        }
        
        return distanceA - distanceB;
      });
    }
    
    // הוספת מידע נוסף לכל מתקן
    const enhancedFacilities = merged.map(facility => ({
      ...facility,
      distance: userLocation ? calculateDistance(
        userLocation.lat, userLocation.lng,
        parseFloat(facility.latitude), parseFloat(facility.longitude)
      ) : null,
      isPopular: facility.review_count >= 50,
      isHighRated: facility.rating >= 4.0,
      isExcellent: facility.rating >= 4.5
    }));

    setFacilities(enhancedFacilities);
    setLoading(false);
  }, [allFacilities, googleFacilities, filterPredicates, userLocation]);

  // פונקציות עזר נוספות
  const getFacilitiesByType = useCallback((type) => {
    return facilities.filter(facility => facility.type === type);
  }, [facilities]);

  const getNearbyFacilities = useCallback((maxDistance = 2) => {
    return facilities.filter(facility => 
      facility.distance && facility.distance <= maxDistance
    );
  }, [facilities]);

  const getTopRatedFacilities = useCallback((minRating = 4.0, limit = 10) => {
    return facilities
      .filter(facility => facility.rating >= minRating)
      .slice(0, limit);
  }, [facilities]);

  return {
    facilities,
    loading,
    isSearchingGoogle,
    hasGoogleResults: googleFacilities.length > 0,
    searchNearbyFitnessFacilities,
    
    // פונקציות עזר נוספות
    getFacilitiesByType,
    getNearbyFacilities,
    getTopRatedFacilities,
    
    // סטטיסטיקות
    stats: {
      total: facilities.length,
      database: allFacilities.length,
      google: googleFacilities.length,
      nearby: getNearbyFacilities(1).length,
      highRated: facilities.filter(f => f.isHighRated).length
    }
  };
};