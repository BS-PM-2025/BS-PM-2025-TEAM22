// src/hooks/useMapMarkers.js
import { useEffect, useRef } from "react";
import { getMarkerIconForType } from "../utils/geoUtils";

export const useMapMarkers = ({
  googleMap,
  facilities,
  userLocation,
  selectedFacility,
  onMarkerClick,
  isLoaded
}) => {
  const markersRef = useRef({});

  // helper: create either AdvancedMarkerElement or Marker
  const createMarker = (facility) => {
    const position = new window.google.maps.LatLng(
      parseFloat(facility.latitude),
      parseFloat(facility.longitude)
    );
    const icon = getMarkerIconForType(facility.type, facility.source);

    if (
      window.google.maps.marker &&
      window.google.maps.marker.AdvancedMarkerElement
    ) {
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position,
        map: googleMap,
        title: facility.name,
        icon
      });
      marker.addListener('click', () => onMarkerClick(facility));
      return marker;
    } else {
      const marker = new window.google.maps.Marker({
        position,
        map: googleMap,
        title: facility.name,
        icon
      });
      marker.addListener('click', () => onMarkerClick(facility));
      return marker;
    }
  };

  // synchronize facility markers
  useEffect(() => {
    if (!googleMap || !isLoaded) return;

    const existingIds = new Set(Object.keys(markersRef.current));
    const currentIds = new Set();

    facilities.forEach(facility => {
      const id = String(facility.id);
      currentIds.add(id);

      // add new marker
      if (!markersRef.current[id]) {
        markersRef.current[id] = createMarker(facility);
      } else {
        // update icon if type changed
        const marker = markersRef.current[id];
        const newIcon = getMarkerIconForType(facility.type, facility.source);
        if (marker.icon !== newIcon) {
          marker.setIcon(newIcon);
        }
      }
    });

    // remove old markers
    existingIds.forEach(id => {
      if (!currentIds.has(id)) {
        const marker = markersRef.current[id];
        marker.setMap(null);
        delete markersRef.current[id];
      }
    });
  }, [facilities, googleMap, isLoaded, onMarkerClick]);

  // user location marker
  useEffect(() => {
    if (!googleMap || !isLoaded || !userLocation) return;

    // remove previous
    if (markersRef.current._user) {
      markersRef.current._user.setMap(null);
    }

    const userMarker = new window.google.maps.Marker({
      position: userLocation,
      map: googleMap,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2
      },
      title: "המיקום שלך",
      zIndex: 1000
    });

    markersRef.current._user = userMarker;
  }, [userLocation, googleMap, isLoaded]);

  // highlight selected
  useEffect(() => {
    if (!googleMap || !isLoaded) return;

    // reset all
    Object.entries(markersRef.current).forEach(([key, marker]) => {
      if (key !== String(selectedFacility?.id) && key !== '_user') {
        marker.setZIndex(1);
      }
    });

    // highlight selected
    if (selectedFacility) {
      const marker = markersRef.current[String(selectedFacility.id)];
      if (marker) {
        marker.setZIndex(100);
      }
    }
  }, [selectedFacility, googleMap, isLoaded]);

  return markersRef.current;
};