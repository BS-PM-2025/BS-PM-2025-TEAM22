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

  // Prevent duplicate DB fetch in React StrictMode
  const didFetchDBRef = useRef(false);

  // 1. Load DB facilities once on mount
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

  // 2. Search Google when userLocation or placesService available
  const searchNearby = useCallback((location, distanceKm = 10) => {
    if (!googleMaps.placesService || !location) return;
    setIsSearchingGoogle(true);
    const radius = Math.min(distanceKm * 1000, 50000);
    let allResults = [];
    let completed = 0;
    const requests = [
      { location: new window.google.maps.LatLng(location.lat, location.lng), radius, type: 'gym', keyword: 'fitness' },
      { location: new window.google.maps.LatLng(location.lat, location.lng), radius, type: 'park', keyword: 'fitness' }
    ];
    const handle = (results, status) => {
      completed++;
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        allResults.push(...results.filter(r => !allResults.some(e => e.place_id === r.place_id)));
      }
      if (completed === requests.length) {
        const formatted = allResults.map(createFacilityFromGooglePlace).filter(Boolean);
        console.log(`Google places found: ${formatted.length}`);
        setGoogleFacilities(formatted);
        setIsSearchingGoogle(false);
      }
    };
    requests.forEach(req => googleMaps.placesService.nearbySearch(req, handle));
  }, [googleMaps.placesService]);

  // Trigger search when location or distance changes
  const prevLocationRef = useRef(null);
  useEffect(() => {
    if (!userLocation || !googleMaps.placesService) return;

    const changed = !prevLocationRef.current ||
      calculateDistance(prevLocationRef.current.lat, prevLocationRef.current.lng, userLocation.lat, userLocation.lng) > 0.5;
    if (changed) {
      searchNearby(userLocation, filters.distance);
      prevLocationRef.current = userLocation;
    }
  }, [userLocation, filters.distance, googleMaps.placesService, searchNearby]);

  // 3. Merge and filter
  const filterPredicates = useCallback(facility => {
    if (filters.types.length && !filters.types.includes(facility.type)) return false;
    if (userLocation && filters.distance > 0) {
      const dist = calculateDistance(
        userLocation.lat, userLocation.lng,
        parseFloat(facility.latitude), parseFloat(facility.longitude)
      );
      if (dist > filters.distance) return false;
    }
    if (filters.equipment.length && !filters.equipment.some(e => facility.equipment?.includes(e))) return false;
    if (filters.features.length && !filters.features.every(f => facility.features?.includes(f))) return false;
    return true;
  }, [filters, userLocation]);

  useEffect(() => {
    setLoading(true);
    const filteredDB = allFacilities.filter(filterPredicates);
    const filteredGoogle = googleFacilities.filter(filterPredicates);
    const merged = [...filteredDB, ...filteredGoogle];
    if (userLocation) {
      merged.sort((a, b) => {
        const da = calculateDistance(
          userLocation.lat, userLocation.lng,
          parseFloat(a.latitude), parseFloat(a.longitude)
        );
        const db = calculateDistance(
          userLocation.lat, userLocation.lng,
          parseFloat(b.latitude), parseFloat(b.longitude)
        );
        return da - db;
      });
    }
    setFacilities(merged);
    setLoading(false);
  }, [allFacilities, googleFacilities, filterPredicates, userLocation]);

  return {
    facilities,
    loading,
    isSearchingGoogle,
    refresh: () => searchNearby(userLocation, filters.distance)
  };
};
