// src/components/map/FitnessMap.js - גרסה מושלמת
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useUserLocation } from "../../hooks/useUserLocation";
import { useCombinedFacilities } from "../../hooks/useCombinedFacilities";
import { useGoogleMaps } from "../../hooks/useGoogleMaps";
import PlaceSearch from "./PlaceSearch";
import UserLocationControl from "./UserLocationControl";
import FilterToggle from "./FilterToggle";
import FitnessFilters from "./FitnessFilters";
import FacilityList from "./FacilityList";
import FitnessDetails from "./facility-details/FitnessDetails";
import FacilityMarkers from "./FacilityMarkers";
import StreetView from "./Navigation/StreetView";
import styles from "./styles/FitnessMap.module.css";
import StartWalkingButton from "./Navigation/StartWalkingButton";

function FitnessMap() {
  const { userProfile } = useAuth();
  const { userLocation, setUserLocation, centerOnUser } = useUserLocation();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    types: [],
    equipment: [],
    features: [],
    distance: 10,
  });
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [showStreetView, setShowStreetView] = useState(false);
  const [showWalkButton, setShowWalkButton] = useState(false);
  const mapContainerRef = useRef(null);

  // Load Google Maps
  const googleMaps = useGoogleMaps();
  useEffect(() => {
    if (mapContainerRef.current) {
      googleMaps.setMapRef(mapContainerRef.current);
    }
  }, [googleMaps]);

  // Facilities hook
  const {
    facilities,
    loading,
    isSearchingGoogle,
    searchNearbyFitnessFacilities,
    hasGoogleResults,
  } = useCombinedFacilities(filters, userLocation, googleMaps);

  const isLoading = loading || !googleMaps.isLoaded;

  // עדכון מצב כפתור ההליכה - יוצג רק כאשר יש מיקום משתמש ואין Street View פתוח
  useEffect(() => {
    setShowWalkButton(userLocation && !showStreetView);
  }, [userLocation, showStreetView]);

  // פונקציה להתחלת הליכה במיקום המשתמש
  const handleStartWalking = useCallback(() => {
    if (!userLocation) {
      console.warn("לא ניתן להתחיל הליכה ללא מיקום משתמש");
      return;
    }

    // יצירת מתקן מדומה במיקום המשתמש
    const userLocationFacility = {
      id: `user_location_${Date.now()}`, // מזהה דינמי למניעת התנגשויות
      name: "המיקום שלך",
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      address: "המיקום הנוכחי שלך",
      type: "walking_start",
    };

    // הגדרת המתקן הנבחר והפעלת Street View בצורה מדורגת
    setSelectedFacility(userLocationFacility);

    // עיכוב קטן לפני פתיחת Street View למניעת התנגשויות DOM
    setTimeout(() => {
      setShowStreetView(true);
    }, 10);
  }, [userLocation]);

  // When filters change
  const handleFiltersChange = (newFilters) => {
    const prevDistance = filters.distance;
    setFilters(newFilters);
    // If distance changed, rerun Google search
    if (
      newFilters.distance !== prevDistance &&
      userLocation &&
      typeof searchNearbyFitnessFacilities === "function"
    ) {
      searchNearbyFitnessFacilities(userLocation, newFilters.distance);
    }
  };

  // Place search selection
  const handlePlaceSelected = (place) => {
    const loc = place.geometry?.location;
    if (loc) {
      const newLocation = { lat: loc.lat(), lng: loc.lng() };
      setUserLocation(newLocation);
      if (typeof searchNearbyFitnessFacilities === "function") {
        searchNearbyFitnessFacilities(newLocation, filters.distance);
      }
    }
  };

  // Marker click
  const handleMarkerClick = (facility) => {
    // אם מצב Street View פתוח, נסגור אותו תחילה
    setShowStreetView(false);

    // עדכון המתקן הנבחר
    setSelectedFacility(facility);
  };

  // פונקציה לפתיחת Street View
  const handleStreetView = (facility) => {
    if (!facility || !facility.latitude || !facility.longitude) {
      console.error("לא ניתן להציג Street View - נתוני מיקום חסרים");
      return;
    }

    // נוודא שהערכים הם מספרים תקינים
    const lat =
      typeof facility.latitude === "string"
        ? parseFloat(facility.latitude)
        : facility.latitude;

    const lng =
      typeof facility.longitude === "string"
        ? parseFloat(facility.longitude)
        : facility.longitude;

    if (isNaN(lat) || isNaN(lng)) {
      console.error("לא ניתן להציג Street View - מיקום לא תקין");
      return;
    }

    // הגדרת המתקן הנבחר
    setSelectedFacility(facility);

    // הפעלת מצב Street View עם עיכוב קל
    setTimeout(() => {
      setShowStreetView(true);
    }, 10);
  };

  // Warn if no google results
  useEffect(() => {
    if (
      !hasGoogleResults &&
      !isSearchingGoogle &&
      userLocation &&
      googleMaps.isLoaded
    ) {
      console.warn("אין תוצאות מגוגל לאחר ניסיונות");
    }
  }, [hasGoogleResults, isSearchingGoogle, userLocation, googleMaps.isLoaded]);

  return (
    <div className={styles.mapContainer}>
      {/* Map canvas */}
      <div ref={mapContainerRef} className={styles.mapWrapper}>
        {!googleMaps.isLoaded && (
          <div className={styles.loading}>טוען מפה...</div>
        )}
      </div>

      {/* Markers layer */}
      {googleMaps.isLoaded && googleMaps.map && (
        <FacilityMarkers
          googleMap={googleMaps.map}
          facilities={facilities}
          selectedFacility={selectedFacility}
          onMarkerClick={handleMarkerClick}
          userLocation={userLocation}
        />
      )}

      {/* Controls */}
      <PlaceSearch onPlaceSelected={handlePlaceSelected} />
      <UserLocationControl
        onCenterOnUser={() => centerOnUser(googleMaps.map)}
      />
      <FilterToggle showFilters={showFilters} setShowFilters={setShowFilters} />

      {showFilters && (
        <div className={styles.filterPanelAnimated}>
          <FitnessFilters
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
          />
        </div>
      )}

      {/* Sidebar list */}
      <FacilityList
        facilities={facilities}
        userLocation={userLocation}
        selectedFacility={selectedFacility}
        setSelectedFacility={setSelectedFacility}
        isLoading={isLoading}
        isSearchingGoogle={isSearchingGoogle}
      />

      {/* כפתור התחלת הליכה - מוצג רק כשיש מיקום משתמש ואין תצוגת Street View */}
      <StartWalkingButton
        onClick={handleStartWalking}
        isVisible={showWalkButton}
        disabled={!userLocation}
      />

      {/* Details drawer - רק כאשר לא נמצאים במצב Street View */}
      {selectedFacility && !showStreetView && (
        <div className={styles.detailsPanel}>
          <FitnessDetails
            facility={selectedFacility}
            onClose={() => setSelectedFacility(null)}
            userProfile={userProfile}
            // הוספת props עבור פתיחת Street View
            onStreetView={() => handleStreetView(selectedFacility)}
          />
        </div>
      )}

      {/* Street View component - מוצג רק כאשר showStreetView אמיתי */}
      {showStreetView && selectedFacility && (
        <StreetView
          // מפתח דינמי לאילוץ רינדור מחדש
          key={`street_view_${selectedFacility.id}_${Date.now()}`}
          position={{
            lat: parseFloat(selectedFacility.latitude),
            lng: parseFloat(selectedFacility.longitude),
          }}
          facilityName={selectedFacility.name}
          onClose={() => {
            // סגירה בשלבים עם עיכוב קטן למניעת התנגשויות DOM
            setShowStreetView(false);
            setTimeout(() => {
              setSelectedFacility(null);
            }, 50);
          }}
        />
      )}

      {/* Errors & warnings */}
      {googleMaps.loadError && (
        <div className={styles.errorMessage}>
          שגיאה בטעינת מפה: {googleMaps.loadError.message}
        </div>
      )}
    </div>
  );
}

export default FitnessMap;
