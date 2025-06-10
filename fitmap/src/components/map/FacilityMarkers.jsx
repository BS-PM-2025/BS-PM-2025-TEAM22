// src/components/map/FacilityMarkers.js - גרסה משודרגת עם מרקרים גדולים
import { useEffect, useRef, useCallback, useMemo } from "react";
import {
  getMarkerEmojiForType,
  getMarkerColorForType,
} from "../../utils/geoUtils";
import styles from "./styles/FitnessMap.module.css";

const FacilityMarkers = ({
  googleMap,
  facilities,
  selectedFacility,
  onMarkerClick,
  userLocation,
  showClusters = true,
  animateMarkers = true,
  markerSize = "small", // ברירת מחדל: גדול
}) => {
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const markerClustererRef = useRef(null);

  // הגדרת גדלי מרקרים - גדולים יותר מהמקור
  const markerSizes = useMemo(() => {
    const sizes = {
      small: { width: 55, height: 55, iconSize: 30, userScale: 6 },
      medium: { width: 65, height: 65, iconSize: 26, userScale: 12 },
      large: { width: 80, height: 80, iconSize: 32, userScale: 14 },
      xlarge: { width: 95, height: 95, iconSize: 38, userScale: 16 },
    };
    return sizes[markerSize] || sizes.large;
  }, [markerSize]);

  // מאמו קלבקים לביצועים טובים יותר
  const handleMarkerClick = useCallback(
    (facility) => {
      onMarkerClick?.(facility);
    },
    [onMarkerClick]
  );

  // יצירת אלמנט מרקר מותאם - משודרג עם גדלים דינמיים
  const createCustomMarkerElement = useCallback(
    (facility, isSelected = false) => {
      const { width, height, iconSize } = markerSizes;
      const markerDiv = document.createElement("div");
      const facilityType = facility.type || "gym";
      const color = getMarkerColorForType(facilityType);

      // הגדרת גודל האלמנט
      markerDiv.style.cssText = `
      position: relative;
      width: ${width}px;
      height: ${height}px;
      cursor: pointer;
      transform-origin: center bottom;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
      z-index: ${
        isSelected
          ? 1000
          : facility.rating
          ? Math.floor(facility.rating * 100)
          : 1
      };
    `;

      markerDiv.className = `${styles.customMarker} ${
        isSelected ? styles.selectedMarker : ""
      } ${styles[`marker--${facilityType}`]}`;

      // הוספת אנימציה למרקר נבחר
      if (isSelected && animateMarkers) {
        markerDiv.classList.add(styles.markerBounce);
        markerDiv.style.transform = "scale(1.15)";
      }

      // יצירת העיגול הצבעוני
      const circleElement = document.createElement("div");
      circleElement.style.cssText = `
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: ${color};
      border: ${isSelected ? "5px" : "4px"} solid white;
      position: relative;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      ${
        isSelected
          ? `
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4), 0 0 0 8px rgba(59, 130, 246, 0.2);
        animation: selectedPulse 2s ease-in-out infinite;
      `
          : ""
      }
    `;
      circleElement.className = styles.markerCircle;

      // יצירת האייקון
      const iconElement = document.createElement("div");
      iconElement.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: ${isSelected ? iconSize + 6 : iconSize}px;
      z-index: 2;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
      transition: all 0.3s ease;
      ${isSelected ? "animation: iconBounce 1s ease-in-out infinite;" : ""}
    `;
      iconElement.className = styles.markerIcon;
      iconElement.textContent = getMarkerEmojiForType(facilityType);
      iconElement.style.setProperty("--marker-color", color);

      // הוספת דירוג אם קיים - גדול יותר
      if (facility.rating > 0) {
        const ratingElement = document.createElement("div");
        ratingElement.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
        border: 3px solid white;
        z-index: 3;
        line-height: 1;
        backdrop-filter: blur(10px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      `;
        ratingElement.className = styles.markerRating;
        ratingElement.textContent = facility.rating.toFixed(1);
        markerDiv.appendChild(ratingElement);
      }

      circleElement.appendChild(iconElement);
      markerDiv.appendChild(circleElement);

      // הוספת מידע נוסף לטיפטול
      markerDiv.title = `${facility.name}${
        facility.rating ? ` (${facility.rating}⭐)` : ""
      }`;

      return markerDiv;
    },
    [animateMarkers, markerSizes]
  );

  // יצירת SVG fallback - משודרג עם גדלים דינמיים
  const createSVGIcon = useCallback(
    (facility, isSelected = false) => {
      const { width, iconSize } = markerSizes;
      const facilityType = facility.type || "gym";
      const color = getMarkerColorForType(facilityType);
      const emoji = getMarkerEmojiForType(facilityType);
      const size = isSelected ? width + 15 : width; // הגדלנו את ההפרש
      const strokeWidth = isSelected ? 5 : 4; // גבול עבה יותר

      return {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <defs>
            <filter id="shadow-${
              facility.id
            }" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.4)"/>
            </filter>
            ${
              isSelected
                ? `
              <animate attributeName="r" values="${size / 3};${size / 2.8};${
                    size / 3
                  }" dur="2s" repeatCount="indefinite"/>
            `
                : ""
            }
          </defs>
          <circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" 
                  fill="${color}" 
                  stroke="white" 
                  stroke-width="${strokeWidth}" 
                  filter="url(#shadow-${facility.id})"
                  ${isSelected ? 'class="pulse"' : ""}/>
          <text x="${size / 2}" y="${size / 2 + iconSize / 4}" 
                font-family="Arial, sans-serif" 
                font-size="${isSelected ? iconSize + 4 : iconSize}" 
                text-anchor="middle" 
                fill="white" 
                font-weight="bold"
                text-shadow="0 2px 4px rgba(0,0,0,0.6)">
            ${emoji}
          </text>
          ${
            facility.rating > 0
              ? `
            <rect x="${
              size - 32
            }" y="6" width="26" height="18" rx="9" fill="rgba(0,0,0,0.85)" stroke="white" stroke-width="2"/>
            <text x="${
              size - 19
            }" y="17" font-family="Arial" font-size="11" text-anchor="middle" fill="white" font-weight="700">
              ${facility.rating.toFixed(1)}
            </text>
          `
              : ""
          }
        </svg>
      `),
        scaledSize: new window.google.maps.Size(size, size),
        anchor: new window.google.maps.Point(size / 2, size),
        labelOrigin: new window.google.maps.Point(size / 2, size / 2),
      };
    },
    [markerSizes]
  );

  // יצירת מרקר בודד - אופטימיזציה
  const createMarker = useCallback(
    (facility) => {
      if (!facility.latitude || !facility.longitude || !googleMap) return null;

      const position = new window.google.maps.LatLng(
        parseFloat(facility.latitude),
        parseFloat(facility.longitude)
      );

      const isSelected = selectedFacility?.id === facility.id;

      // ניסיון ראשון - Advanced Marker (Google Maps חדש)
      if (window.google.maps.marker?.AdvancedMarkerElement) {
        try {
          const markerElement = createCustomMarkerElement(facility, isSelected);

          const marker = new window.google.maps.marker.AdvancedMarkerElement({
            position,
            content: markerElement,
            map: googleMap,
            title: facility.name,
            zIndex: isSelected
              ? 1000
              : facility.rating
              ? Math.floor(facility.rating * 100)
              : 1,
          });

          marker.addListener("click", () => handleMarkerClick(facility));
          return marker;
        } catch (err) {
          console.warn("Advanced Marker נכשל, עובר ל-Marker רגיל:", err);
        }
      }

      // Fallback - Marker רגיל עם SVG
      const icon = createSVGIcon(facility, isSelected);

      const marker = new window.google.maps.Marker({
        position,
        map: googleMap,
        icon: icon,
        title: facility.name,
        animation:
          isSelected && animateMarkers
            ? window.google.maps.Animation.BOUNCE
            : null,
        zIndex: isSelected
          ? 1000
          : facility.rating
          ? Math.floor(facility.rating * 100)
          : 1,
        optimized: true, // אופטימיזציה לביצועים
      });

      // עצירת אנימציה אחרי זמן מוגדר
      if (isSelected && marker.getAnimation()) {
        setTimeout(() => {
          if (marker.getMap()) {
            // בדיקה שהמרקר עדיין קיים
            marker.setAnimation(null);
          }
        }, 1500);
      }

      marker.addListener("click", () => handleMarkerClick(facility));
      return marker;
    },
    [
      googleMap,
      selectedFacility,
      handleMarkerClick,
      createCustomMarkerElement,
      createSVGIcon,
      animateMarkers,
    ]
  );

  // יצירת מרקר משתמש - משודרג עם גדל דינמי
  const createUserMarker = useCallback(() => {
    if (!userLocation || !googleMap) return null;

    // הסרת מרקר קיים
    if (userMarkerRef.current) {
      if (userMarkerRef.current.main) {
        userMarkerRef.current.main.setMap(null);
      }
      if (userMarkerRef.current.pulse) {
        userMarkerRef.current.pulse.setMap(null);
      }
    }

    const { userScale } = markerSizes;

    const userMarker = new window.google.maps.Marker({
      position: userLocation,
      map: googleMap,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: userScale,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 4,
      },
      title: "המיקום שלך",
      zIndex: 2000,
      animation: window.google.maps.Animation.DROP,
    });

    // הוספת דופק למרקר משתמש - גדול יותר
    const pulseMarker = new window.google.maps.Marker({
      position: userLocation,
      map: googleMap,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: userScale * 2,
        fillColor: "#4285F4",
        fillOpacity: 0.2,
        strokeColor: "#4285F4",
        strokeWeight: 2,
      },
      zIndex: 1999,
    });

    userMarkerRef.current = { main: userMarker, pulse: pulseMarker };
    return userMarkerRef.current;
  }, [userLocation, googleMap, markerSizes]);

  // ניקוי מרקרים - משודרג
  const clearAllMarkers = useCallback(() => {
    // ניקוי מרקרי מתקנים
    Object.values(markersRef.current).forEach((marker) => {
      if (marker?.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = {};

    // ניקוי מרקר משתמש
    if (userMarkerRef.current) {
      if (userMarkerRef.current.main?.setMap) {
        userMarkerRef.current.main.setMap(null);
      }
      if (userMarkerRef.current.pulse?.setMap) {
        userMarkerRef.current.pulse.setMap(null);
      }
      userMarkerRef.current = null;
    }

    // ניקוי clusterer
    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers();
      markerClustererRef.current = null;
    }
  }, []);

  // מאמו רשימת מתקנים לביצועים
  const facilitiesMap = useMemo(() => {
    return facilities.reduce((acc, facility) => {
      if (facility.id && facility.latitude && facility.longitude) {
        acc[facility.id] = facility;
      }
      return acc;
    }, {});
  }, [facilities]);

  // Effect ראשי - ניהול מרקרים
  useEffect(() => {
    if (!googleMap || !window.google?.maps) return;

    // ניקוי מרקרים קיימים
    clearAllMarkers();

    // יצירת מרקרים חדשים
    const newMarkers = {};
    Object.values(facilitiesMap).forEach((facility) => {
      const marker = createMarker(facility);
      if (marker) {
        newMarkers[facility.id] = marker;
      }
    });

    markersRef.current = newMarkers;

    // יצירת מרקר משתמש
    if (userLocation) {
      createUserMarker();
    }

    // ניקוי בעת unmount
    return () => {
      clearAllMarkers();
    };
  }, [
    googleMap,
    facilitiesMap,
    userLocation,
    createMarker,
    createUserMarker,
    clearAllMarkers,
  ]);

  // Effect נפרד לעדכון מרקר נבחר - למניעת re-render כל המרקרים
  useEffect(() => {
    if (!googleMap || !markersRef.current) return;

    Object.entries(markersRef.current).forEach(([facilityId, marker]) => {
      const facility = facilitiesMap[facilityId];
      if (!facility || !marker) return;

      const isSelected = selectedFacility?.id === facilityId;

      // עדכון z-index
      if (marker.setZIndex) {
        marker.setZIndex(
          isSelected
            ? 1000
            : facility.rating
            ? Math.floor(facility.rating * 100)
            : 1
        );
      }

      // עדכון אנימציה רק למרקרים רגילים
      if (marker.setAnimation && animateMarkers) {
        marker.setAnimation(
          isSelected ? window.google.maps.Animation.BOUNCE : null
        );

        if (isSelected) {
          setTimeout(() => {
            if (marker.getMap()) {
              marker.setAnimation(null);
            }
          }, 1500);
        }
      }

      // עדכון תוכן למרקרים מתקדמים
      if (marker.content && window.google.maps.marker?.AdvancedMarkerElement) {
        const newElement = createCustomMarkerElement(facility, isSelected);
        marker.content = newElement;
      }
    });
  }, [
    selectedFacility,
    facilitiesMap,
    animateMarkers,
    createCustomMarkerElement,
  ]);

  return null;
};

export default FacilityMarkers;
