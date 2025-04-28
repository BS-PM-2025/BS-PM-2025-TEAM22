// src/components/map/FacilityMarkers.js
import React, { useEffect, useRef, useState } from "react";
import { getMarkerIconForType } from "../../utils/geoUtils";
import PropTypes from 'prop-types';

/**
 * קומפוננטת מרקרים למתקנים על המפה
 * משופרת עם מעקב אחר שינויים והוספה/הסרה יעילה של מרקרים
 */
function FacilityMarkers({ googleMap, facilities, selectedFacility, onMarkerClick, userLocation }) {
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const [infoContent, setInfoContent] = useState("");
  
  // הכן חלון מידע אחד לשימוש עבור כל המרקרים
  useEffect(() => {
    if (googleMap && !infoWindowRef.current) {
      infoWindowRef.current = new window.google.maps.InfoWindow();
      
      // מאזין לסגירת חלון המידע
      infoWindowRef.current.addListener('closeclick', () => {
        setInfoContent("");
      });
    }
    
    // ניקוי בעת סיום
    return () => {
      if (infoWindowRef.current) {
        window.google.maps.event.clearInstanceListeners(infoWindowRef.current);
        infoWindowRef.current = null;
      }
    };
  }, [googleMap]);

  // עדכון מרקר המשתמש
  useEffect(() => {
    if (!googleMap || !userLocation) {
      return;
    }
    
    // הסרת מרקר ישן אם קיים
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }
    
    // יצירת מרקר חדש למשתמש
    userMarkerRef.current = new window.google.maps.Marker({
      position: userLocation,
      map: googleMap,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2
      },
      title: "המיקום שלך",
      zIndex: 1000 // מעל כל המרקרים האחרים
    });
    
    // התאמת זום המפה למיקום המשתמש בפעם הראשונה
    if (!markersRef.current.initialZoomDone) {
      googleMap.setCenter(userLocation);
      googleMap.setZoom(14);
      markersRef.current.initialZoomDone = true;
    }
    
  }, [googleMap, userLocation]);
  
  // עדכון המרקרים במפה
  useEffect(() => {
    if (!googleMap || !facilities) {
      return;
    }
    
    console.log("עדכון מרקרים:", facilities.length, "מתקנים");
    
    const existingMarkerIds = new Set(Object.keys(markersRef.current).filter(id => id !== 'initialZoomDone'));
    const newMarkerIds = new Set();
    
    // עדכון או יצירת מרקרים
    facilities.forEach(facility => {
      if (!facility.latitude || !facility.longitude) {
        return;
      }
      
      const facilityId = String(facility.id);
      newMarkerIds.add(facilityId);
      
      // עדכון מרקר קיים במקום ליצור חדש
      if (existingMarkerIds.has(facilityId)) {
        const marker = markersRef.current[facilityId];
        existingMarkerIds.delete(facilityId);
        
        // עדכון אייקון אם השתנה סוג המתקן
        const newIcon = getMarkerIconForType(facility.type, facility.source);
        marker.setIcon(newIcon);
        
        // עדכון ה-zIndex אם זה המתקן הנבחר
        if (selectedFacility && selectedFacility.id === facility.id) {
          marker.setZIndex(100);
          marker.setAnimation(window.google.maps.Animation.BOUNCE);
          setTimeout(() => {
            marker.setAnimation(null);
          }, 1500);
        } else {
          marker.setZIndex(1);
          marker.setAnimation(null);
        }
      } else {
        // יצירת מרקר חדש
        const marker = new window.google.maps.Marker({
          position: {
            lat: parseFloat(facility.latitude),
            lng: parseFloat(facility.longitude)
          },
          map: googleMap,
          title: facility.name,
          icon: getMarkerIconForType(facility.type, facility.source),
          zIndex: selectedFacility && selectedFacility.id === facility.id ? 100 : 1,
          animation: window.google.maps.Animation.DROP // אנימציה לשיפור חוויית המשתמש
        });
        
        // הוספת מאזין לחיצה
        marker.addListener('click', () => {
          // יצירת תוכן חלון המידע
          const contentString = `
            <div style="direction: rtl; text-align: right; padding: 10px; max-width: 250px;">
              <h3 style="margin-top: 0; color: #2c3e50;">${facility.name}</h3>
              <p style="margin-bottom: 5px;">${facility.address || ''}</p>
              <p style="margin-bottom: 5px;">סוג: ${facility.type || 'לא ידוע'}</p>
              ${facility.rating ? `<p style="margin-bottom: 5px;">דירוג: ${facility.rating.toFixed(1)} / 5</p>` : ''}
              <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                <button id="view-details-${facility.id}" 
                        style="background-color: #3498db; color: white; border: none; 
                               padding: 8px 12px; border-radius: 4px; cursor: pointer;">
                  הצג פרטים
                </button>
                <div style="font-size: 11px; color: #7f8c8d; display: flex; align-items: center;">
                  ${facility.source === 'google' ? 'נתוני Google' : 'מאגר מקומי'}
                </div>
              </div>
            </div>
          `;
          
          // פתיחת חלון המידע
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(contentString);
            infoWindowRef.current.open(googleMap, marker);
            
            // הוספת מאזין לחצן 'הצג פרטים'
            window.google.maps.event.addListenerOnce(infoWindowRef.current, 'domready', () => {
              const button = document.getElementById(`view-details-${facility.id}`);
              if (button) {
                button.addEventListener('click', () => {
                  onMarkerClick(facility);
                  infoWindowRef.current.close();
                });
              }
            });
          }
        });
        
        // שמירת המרקר במערך
        markersRef.current[facilityId] = marker;
      }
    });
    
    // הסרת מרקרים שאינם עוד ברשימה
    existingMarkerIds.forEach(id => {
      if (markersRef.current[id]) {
        markersRef.current[id].setMap(null);
        delete markersRef.current[id];
      }
    });
    
    // התאמת גבולות המפה לכל המרקרים אם יש מרקרים
    if (facilities.length > 0 && !selectedFacility) {
      const bounds = new window.google.maps.LatLngBounds();
      
      // הוספת מיקום המשתמש לגבולות אם קיים
      if (userLocation) {
        bounds.extend(userLocation);
      }
      
      // הוספת כל המרקרים לגבולות
      facilities.forEach(facility => {
        if (facility.latitude && facility.longitude) {
          bounds.extend({
            lat: parseFloat(facility.latitude), 
            lng: parseFloat(facility.longitude)
          });
        }
      });
      
      // התאמת המפה לגבולות
      googleMap.fitBounds(bounds);
      
      // הגבלת הזום המקסימלי
      const listener = window.google.maps.event.addListenerOnce(googleMap, 'idle', () => {
        if (googleMap.getZoom() > 15) {
          googleMap.setZoom(15);
        }
      });
    }
    
  }, [googleMap, facilities, selectedFacility, onMarkerClick, userLocation]);

  // עדכון המרקר של המתקן הנבחר
  useEffect(() => {
    if (!googleMap || !selectedFacility) {
      return;
    }
    
    // אם המתקן הנבחר יש לו מרקר, עדכן אותו
    const facilityId = String(selectedFacility.id);
    if (markersRef.current[facilityId]) {
      const marker = markersRef.current[facilityId];
      
      // הגדרת zIndex גבוה
      marker.setZIndex(100);
      
      // אנימציה זמנית
      marker.setAnimation(window.google.maps.Animation.BOUNCE);
      setTimeout(() => {
        marker.setAnimation(null);
      }, 1500);
      
      // התמקדות במרקר
      googleMap.setCenter({
        lat: parseFloat(selectedFacility.latitude),
        lng: parseFloat(selectedFacility.longitude)
      });
      googleMap.setZoom(16);
    }
  }, [googleMap, selectedFacility]);

  // ניקוי כל המרקרים בעת סיום
  useEffect(() => {
    return () => {
      Object.values(markersRef.current).forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      });
      if (userMarkerRef.current) {
        userMarkerRef.current.setMap(null);
      }
    };
  }, []);

  // לא מרנדר שום דבר - זהו רכיב שמטפל רק בלוגיקה
  return null;
}

FacilityMarkers.propTypes = {
  googleMap: PropTypes.object,
  facilities: PropTypes.array,
  selectedFacility: PropTypes.object,
  onMarkerClick: PropTypes.func.isRequired,
  userLocation: PropTypes.object
};

FacilityMarkers.defaultProps = {
  facilities: [],
};

export default FacilityMarkers;