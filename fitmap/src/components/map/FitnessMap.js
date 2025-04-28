// src/components/map/FitnessMap.js
import React, { useState, useEffect, useRef } from "react";
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
import styles from "../../styles/FitnessMap.module.css";

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
    hasGoogleResults
  } = useCombinedFacilities(filters, userLocation, googleMaps);

  const isLoading = loading || !googleMaps.isLoaded;

  // When filters change
  const handleFiltersChange = (newFilters) => {
    const prevDistance = filters.distance;
    setFilters(newFilters);
    // If distance changed, rerun Google search
    if (
      newFilters.distance !== prevDistance &&
      userLocation &&
      typeof searchNearbyFitnessFacilities === 'function'
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
      if (typeof searchNearbyFitnessFacilities === 'function') {
        searchNearbyFitnessFacilities(newLocation, filters.distance);
      }
    }
  };

  // Marker click
  const handleMarkerClick = (facility) => {
    setSelectedFacility(facility);
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
      <UserLocationControl onCenterOnUser={() => centerOnUser(googleMaps.map)} />
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

      {/* Details drawer */}
      {selectedFacility && (
        <div className={styles.detailsPanel}>
          <FitnessDetails
            facility={selectedFacility}
            onClose={() => setSelectedFacility(null)}
            userProfile={userProfile}
          />
        </div>
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