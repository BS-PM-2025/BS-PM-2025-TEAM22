// src/utils/GooglePlacesService.js
import axios from 'axios';
import { mapGoogleTypeToLocalType } from './geoUtils'; // ייבוא קריטי!

class GooglePlacesService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  async searchFacilitiesNearby(location, radius = 1) {
    try {
      const radiusInMeters = radius * 1000;
      
      const searchKeywords = [
        'gym',
        'fitness center',
        'park',
        'swimming pool',
        'spa',
        'yoga studio',
        'stadium',
        'soccer field',
        'basketball court',
        'tennis court',
        'skatepark'
      ];
  
      const allFacilities = [];
  
      for (const keyword of searchKeywords) {
        const response = await axios.get(`${this.baseUrl}/place/nearbysearch/json`, {
          params: {
            location: `${location.lat},${location.lng}`,
            radius: radiusInMeters,
            keyword: keyword,
            language: 'he',
            key: this.apiKey
          }
        });
  
        if (response.data.status === 'OK' && Array.isArray(response.data.results)) {
          const facilities = this.transformPlacesToFacilities(response.data.results);
          allFacilities.push(...facilities);
        } else if (response.data.status !== 'ZERO_RESULTS') {
          console.error(`חיפוש ${keyword} נכשל: ${response.data.status}`, response.data);
        }
      }
  
      // 🛡️ מניעת כפילויות
      const uniqueFacilities = [];
      const ids = new Set();
      for (const facility of allFacilities) {
        if (!ids.has(facility.id)) {
          uniqueFacilities.push(facility);
          ids.add(facility.id);
        }
      }
  
      return uniqueFacilities;
    } catch (error) {
      console.error('שגיאה בחיפוש מתקנים:', error);
      return [];
    }
  }
  

  // קבלת פרטים מלאים למתקן לפי מזהה המקום בגוגל
  async getFacilityDetails(placeId) {
    try {
      const response = await axios.get(`${this.baseUrl}/place/details/json`, {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,geometry,photos,rating,types,opening_hours,user_ratings_total',
          language: 'he',
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        console.error(`שליפת פרטי מקום נכשלה: ${response.data.status}`, response.data);
        return null;
      }

      return this.transformPlaceToFacility(response.data.result);
    } catch (error) {
      console.error('שגיאה בשליפת פרטי מתקן:', error);
      return null;
    }
  }

  // המרת רשימת מקומות מגוגל לפורמט מתקנים באפליקציה
  transformPlacesToFacilities(places) {
    if (!Array.isArray(places)) {
      console.error('שגיאה: הפרמטר places אינו מערך', places);
      return [];
    }
    return places.map(this.transformPlaceToFacility).filter(Boolean);
  }

  // המרת מקום מגוגל לפורמט מתקן באפליקציה
  transformPlaceToFacility = (place) => {
    if (!place || !place.geometry || !place.geometry.location) {
      console.error('שגיאה: מבנה המקום אינו תקין', place);
      return null;
    }
    
    try {
      const latitude = typeof place.geometry.location.lat === 'function'
        ? place.geometry.location.lat()
        : place.geometry.location.lat;
      
      const longitude = typeof place.geometry.location.lng === 'function'
        ? place.geometry.location.lng()
        : place.geometry.location.lng;

      const images = place.photos ? 
        place.photos.map(photo => 
          `${this.baseUrl}/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`
        ) : [];

      const type = mapGoogleTypeToLocalType(place.types || []);

      return {
        id: place.place_id,
        name: place.name || 'מתקן ללא שם',
        address: place.formatted_address || place.vicinity || 'כתובת לא ידועה',
        type: type,
        rating: place.rating || 0,
        review_count: place.user_ratings_total || 0,
        latitude,
        longitude,
        google_place_id: place.place_id,
        source: 'google',
        images,
        is_open: place.opening_hours?.open_now,
        opening_hours: place.opening_hours?.weekday_text
      };
    } catch (error) {
      console.error('שגיאה בהמרת מקום למתקן:', error, place);
      return null;
    }
  }

  getPhotoUrl(photoReference, maxWidth = 400) {
    if (!photoReference) return null;
    return `${this.baseUrl}/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.apiKey}`;
  }
}

export default GooglePlacesService;
