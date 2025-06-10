// src/hooks/useMapMarkers.js - גרסה משודרגת
import { useEffect, useRef, useCallback, useMemo } from "react";
import { 
  getMarkerEmojiForType, 
  getMarkerColorForType,
  calculateDistance 
} from "../utils/geoUtils";

export const useMapMarkers = ({
  googleMap,
  facilities,
  userLocation,
  selectedFacility,
  onMarkerClick,
  isLoaded,
  options = {}
}) => {
  const {
    animateMarkers = true,
    showRatings = true,
    markerSize = 'medium', // small, medium, large
    enableHover = true,
    maxDistance = null, // מרחק מקסימלי להצגת מרקרים בק"מ
    filterByType = null, // פילטר לפי סוג מתקן
    showUserPulse = true, // דופק למרקר משתמש
    customStyles = {} // סגנונות מותאמים
  } = options;

  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const userPulseRef = useRef(null);
  const infoWindowRef = useRef(null);

  // מאמו לחישוב גדלי מרקרים - גדלים מוגדלים
  const markerSizes = useMemo(() => {
    const sizes = {
      small: { width: 48, height: 48, iconSize: 18, scale: 8 },      // הוגדל מ-32
      medium: { width: 60, height: 60, iconSize: 24, scale: 12 },    // הוגדל מ-44
      large: { width: 76, height: 76, iconSize: 30, scale: 16 }      // הוגדל מ-56
    };
    return sizes[markerSize] || sizes.medium;
  }, [markerSize]);

  // פילטור מתקנים לפי מרחק וסוג
  const filteredFacilities = useMemo(() => {
    let filtered = [...facilities];

    // פילטר לפי מרחק
    if (maxDistance && userLocation) {
      filtered = filtered.filter(facility => {
        if (!facility.latitude || !facility.longitude) return false;
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          parseFloat(facility.latitude),
          parseFloat(facility.longitude)
        );
        return distance <= maxDistance;
      });
    }

    // פילטר לפי סוג
    if (filterByType) {
      filtered = filtered.filter(facility => 
        Array.isArray(filterByType) 
          ? filterByType.includes(facility.type)
          : facility.type === filterByType
      );
    }

    return filtered;
  }, [facilities, maxDistance, userLocation, filterByType]);

  // יצירת אלמנט מרקר מותאם עם DOM
  const createCustomMarkerElement = useCallback((facility, isSelected = false) => {
    const { width, height, iconSize } = markerSizes;
    const facilityType = facility.type || "gym";
    const color = getMarkerColorForType(facilityType);
    const emoji = getMarkerEmojiForType(facilityType);
    
    // מיכל ראשי
    const markerDiv = document.createElement("div");
    markerDiv.style.cssText = `
      position: relative;
      width: ${width}px;
      height: ${height}px;
      cursor: pointer;
      transform-origin: center bottom;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25));
      z-index: ${isSelected ? 1000 : facility.rating ? Math.floor(facility.rating * 100) : 1};
      ${isSelected ? 'animation: selectedMarkerBounce 1.5s ease-in-out;' : ''}
    `;

    // עיגול רקע
    const circleElement = document.createElement("div");
    circleElement.style.cssText = `
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: ${color};
      border: ${isSelected ? '4px' : '3px'} solid white;
      position: relative;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      ${isSelected ? `
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3), 0 0 0 6px rgba(59, 130, 246, 0.2);
        animation: selectedPulse 2s ease-in-out infinite;
      ` : ''}
      ${customStyles.circle || ''}
    `;

    // אייקון
    const iconElement = document.createElement("div");
    iconElement.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: ${isSelected ? iconSize + 4 : iconSize}px;
      z-index: 2;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
      ${isSelected ? 'animation: iconBounce 1s ease-in-out infinite;' : ''}
      ${customStyles.icon || ''}
    `;
    iconElement.textContent = emoji;

    // דירוג
    if (showRatings && facility.rating > 0) {
      const ratingElement = document.createElement("div");
      ratingElement.style.cssText = `
        position: absolute;
        top: -6px;
        right: -6px;
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
        border: 2px solid white;
        z-index: 3;
        line-height: 1;
        backdrop-filter: blur(10px);
        ${customStyles.rating || ''}
      `;
      ratingElement.textContent = facility.rating.toFixed(1);
      markerDiv.appendChild(ratingElement);
    }

    // אפקטי hover
    if (enableHover) {
      let hoverTimeout;
      
      markerDiv.addEventListener('mouseenter', () => {
        markerDiv.style.transform = 'scale(1.15) translateY(-4px)';
        markerDiv.style.filter = 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.35))';
        
        // הצגת מידע עם עיכוב
        hoverTimeout = setTimeout(() => {
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }
          
          infoWindowRef.current = new window.google.maps.InfoWindow({
            content: `
              <div style="font-family: 'Inter', sans-serif; max-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">
                  ${facility.name}
                </h3>
                <p style="margin: 0 0 4px 0; color: #64748b; font-size: 12px;">
                  ${facility.address || 'כתובת לא זמינה'}
                </p>
                ${facility.rating ? `
                  <div style="display: flex; align-items: center; gap: 4px; margin-top: 8px;">
                    <span style="color: #f59e0b; font-size: 12px;">⭐</span>
                    <span style="color: #1e293b; font-size: 12px; font-weight: 500;">
                      ${facility.rating.toFixed(1)}
                    </span>
                    ${facility.review_count ? `
                      <span style="color: #64748b; font-size: 11px;">
                        (${facility.review_count} ביקורות)
                      </span>
                    ` : ''}
                  </div>
                ` : ''}
                ${userLocation ? `
                  <div style="margin-top: 8px; color: #3b82f6; font-size: 11px; font-weight: 500;">
                    📍 ${calculateDistance(
                      userLocation.lat, userLocation.lng,
                      parseFloat(facility.latitude), parseFloat(facility.longitude)
                    ).toFixed(1)} ק"מ
                  </div>
                ` : ''}
              </div>
            `,
            position: new window.google.maps.LatLng(
              parseFloat(facility.latitude),
              parseFloat(facility.longitude)
            )
          });
          
          infoWindowRef.current.open(googleMap);
        }, 800);
      });

      markerDiv.addEventListener('mouseleave', () => {
        markerDiv.style.transform = isSelected ? 'scale(1.2)' : 'scale(1)';
        markerDiv.style.filter = 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25))';
        
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
        }
        
        if (infoWindowRef.current) {
          setTimeout(() => {
            if (infoWindowRef.current) {
              infoWindowRef.current.close();
            }
          }, 200);
        }
      });
    }

    circleElement.appendChild(iconElement);
    markerDiv.appendChild(circleElement);
    
    return markerDiv;
  }, [markerSizes, showRatings, enableHover, customStyles, userLocation, googleMap]);

  // יצירת אייקון SVG fallback
  const createSVGIcon = useCallback((facility, isSelected = false) => {
    const { width, iconSize } = markerSizes;
    const facilityType = facility.type || "gym";
    const color = getMarkerColorForType(facilityType);
    const emoji = getMarkerEmojiForType(facilityType);
    const size = isSelected ? width + 8 : width;

    return {
      url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
            </filter>
            ${isSelected ? `
              <animate attributeName="r" values="${size/3};${size/2.5};${size/3}" dur="2s" repeatCount="indefinite"/>
            ` : ''}
          </defs>
          <circle cx="${size/2}" cy="${size/2}" r="${size/3}" 
                  fill="${color}" 
                  stroke="white" 
                  stroke-width="${isSelected ? 4 : 3}" 
                  filter="url(#shadow)"/>
          <text x="${size/2}" y="${size/2 + iconSize/3}" 
                font-family="Arial, sans-serif" 
                font-size="${iconSize}" 
                text-anchor="middle" 
                fill="white" 
                font-weight="bold">
            ${emoji}
          </text>
          ${showRatings && facility.rating > 0 ? `
            <rect x="${size - 24}" y="4" width="20" height="14" rx="7" fill="rgba(0,0,0,0.85)"/>
            <text x="${size - 14}" y="13" font-family="Arial" font-size="9" text-anchor="middle" fill="white" font-weight="600">
              ${facility.rating.toFixed(1)}
            </text>
          ` : ''}
        </svg>
      `),
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size/2, size),
      labelOrigin: new window.google.maps.Point(size/2, size/2),
    };
  }, [markerSizes, showRatings]);

  // יצירת מרקר בודד
  const createMarker = useCallback((facility) => {
    if (!facility.latitude || !facility.longitude || !googleMap) return null;

    const position = new window.google.maps.LatLng(
      parseFloat(facility.latitude),
      parseFloat(facility.longitude)
    );

    const isSelected = selectedFacility?.id === facility.id;

    // ניסיון ראשון - Advanced Marker
    if (window.google.maps.marker?.AdvancedMarkerElement) {
      try {
        const markerElement = createCustomMarkerElement(facility, isSelected);
        
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          position,
          content: markerElement,
          map: googleMap,
          title: facility.name,
          zIndex: isSelected ? 1000 : facility.rating ? Math.floor(facility.rating * 100) : 1,
        });

        marker.addListener('click', () => onMarkerClick(facility));
        return marker;
      } catch (err) {
        console.warn('Advanced Marker נכשל, עובר למרקר רגיל:', err);
      }
    }

    // Fallback - Marker רגיל
    const icon = createSVGIcon(facility, isSelected);
    
    const marker = new window.google.maps.Marker({
      position,
      map: googleMap,
      icon: icon,
      title: facility.name,
      animation: isSelected && animateMarkers ? window.google.maps.Animation.BOUNCE : null,
      zIndex: isSelected ? 1000 : facility.rating ? Math.floor(facility.rating * 100) : 1,
      optimized: true,
    });

    // עצירת אנימציה
    if (isSelected && marker.getAnimation()) {
      setTimeout(() => {
        if (marker.getMap()) {
          marker.setAnimation(null);
        }
      }, 1500);
    }

    marker.addListener('click', () => onMarkerClick(facility));
    return marker;
  }, [googleMap, selectedFacility, onMarkerClick, createCustomMarkerElement, createSVGIcon, animateMarkers]);

  // יצירת מרקר משתמש מתקדם
  const createUserMarker = useCallback(() => {
    if (!userLocation || !googleMap) return;

    // הסרת מרקרים קיימים
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }
    if (userPulseRef.current) {
      userPulseRef.current.setMap(null);
    }

    const { scale } = markerSizes;

    // מרקר ראשי
    const userMarker = new window.google.maps.Marker({
      position: userLocation,
      map: googleMap,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: scale + 2,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 3,
      },
      title: "המיקום שלך",
      zIndex: 2000,
      animation: window.google.maps.Animation.DROP,
    });

    userMarkerRef.current = userMarker;

    // דופק (אם מופעל)
    if (showUserPulse) {
      const pulseMarker = new window.google.maps.Marker({
        position: userLocation,
        map: googleMap,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: scale * 2.5,
          fillColor: "#4285F4",
          fillOpacity: 0.2,
          strokeColor: "#4285F4",
          strokeWeight: 1,
        },
        zIndex: 1999,
        clickable: false,
      });

      userPulseRef.current = pulseMarker;
    }
  }, [userLocation, googleMap, markerSizes, showUserPulse]);

  // ניקוי כל המרקרים
  const clearAllMarkers = useCallback(() => {
    Object.values(markersRef.current).forEach((marker) => {
      if (marker?.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = {};

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }

    if (userPulseRef.current) {
      userPulseRef.current.setMap(null);
      userPulseRef.current = null;
    }

    if (infoWindowRef.current) {
      infoWindowRef.current.close();
      infoWindowRef.current = null;
    }
  }, []);

  // סנכרון מרקרי מתקנים - משודרג עם פילטרים
  useEffect(() => {
    if (!googleMap || !isLoaded) return;

    const existingIds = new Set(Object.keys(markersRef.current));
    const currentIds = new Set();

    filteredFacilities.forEach(facility => {
      const id = String(facility.id);
      currentIds.add(id);

      // הוספת מרקר חדש
      if (!markersRef.current[id]) {
        const marker = createMarker(facility);
        if (marker) {
          markersRef.current[id] = marker;
        }
      } else {
        // עדכון מרקר קיים אם השתנה
        const marker = markersRef.current[id];
        const isSelected = selectedFacility?.id === facility.id;
        
        // עדכון z-index
        if (marker.setZIndex) {
          marker.setZIndex(isSelected ? 1000 : facility.rating ? Math.floor(facility.rating * 100) : 1);
        }
        
        // עדכון אנימציה למרקרים רגילים
        if (marker.setAnimation && animateMarkers) {
          marker.setAnimation(isSelected ? window.google.maps.Animation.BOUNCE : null);
          
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
      }
    });

    // הסרת מרקרים ישנים
    existingIds.forEach(id => {
      if (!currentIds.has(id)) {
        const marker = markersRef.current[id];
        if (marker) {
          marker.setMap(null);
          delete markersRef.current[id];
        }
      }
    });

    return () => {
      clearAllMarkers();
    };
  }, [filteredFacilities, googleMap, isLoaded, selectedFacility, createMarker, createCustomMarkerElement, animateMarkers, clearAllMarkers]);

  // מרקר משתמש
  useEffect(() => {
    if (!googleMap || !isLoaded) return;

    createUserMarker();
  }, [userLocation, googleMap, isLoaded, createUserMarker]);

  // הדגשת מרקר נבחר - אופטימיזציה נפרדת
  useEffect(() => {
    if (!googleMap || !isLoaded) return;

    // איפוס כל המרקרים
    Object.entries(markersRef.current).forEach(([key, marker]) => {
      if (key !== String(selectedFacility?.id)) {
        if (marker.setZIndex) {
          const facility = filteredFacilities.find(f => String(f.id) === key);
          marker.setZIndex(facility?.rating ? Math.floor(facility.rating * 100) : 1);
        }
      }
    });

    // הדגשת המרקר הנבחר
    if (selectedFacility) {
      const marker = markersRef.current[String(selectedFacility.id)];
      if (marker) {
        if (marker.setZIndex) {
          marker.setZIndex(1000);
        }
        
        // מיקוד במרקר
        googleMap.panTo(new window.google.maps.LatLng(
          parseFloat(selectedFacility.latitude),
          parseFloat(selectedFacility.longitude)
        ));
      }
    }
  }, [selectedFacility, googleMap, isLoaded, filteredFacilities]);

  // החזרת API ציבורי
  return {
    markers: markersRef.current,
    userMarker: userMarkerRef.current,
    userPulse: userPulseRef.current,
    filteredFacilities,
    clearAllMarkers,
    createMarker,
    // פונקציות שירות נוספות
    focusOnFacility: (facility) => {
      if (googleMap && facility) {
        googleMap.panTo(new window.google.maps.LatLng(
          parseFloat(facility.latitude),
          parseFloat(facility.longitude)
        ));
        googleMap.setZoom(16);
      }
    },
    showAllMarkers: () => {
      if (googleMap && filteredFacilities.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        
        filteredFacilities.forEach(facility => {
          bounds.extend(new window.google.maps.LatLng(
            parseFloat(facility.latitude),
            parseFloat(facility.longitude)
          ));
        });
        
        if (userLocation) {
          bounds.extend(userLocation);
        }
        
        googleMap.fitBounds(bounds, { padding: 50 });
      }
    }
  };
};