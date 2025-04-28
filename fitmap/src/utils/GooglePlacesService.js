// src/utils/GooglePlacesService.js
import axios from 'axios';

class GooglePlacesService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  // חיפוש מתקנים על המפה לפי מיקום ורדיוס בקילומטרים
  async searchFacilitiesNearby(location, radius = 1, facilityTypes = ['gym', 'park']) {
    try {
      // המרת רדיוס לפי מטרים (גוגל דורש מטרים)
      const radiusInMeters = radius * 1000;
      
      // שמירת הבקשה לחיפוש מקומות קרובים
      const response = await axios.get(`${this.baseUrl}/place/nearbysearch/json`, {
        params: {
          location: `${location.lat},${location.lng}`,
          radius: radiusInMeters,
          type: facilityTypes.join('|'),
          keyword: 'fitness outdoor workout',
          language: 'he',
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        console.error(`חיפוש מקומות נכשל: ${response.data.status}`, response.data);
        return [];
      }

      // המרת פרטי מקומות לפורמט האחיד של האפליקציה
      if (response.data.results && response.data.results.length > 0) {
        return this.transformPlacesToFacilities(response.data.results);
      }
      
      return [];
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

      // המרת המקום לפורמט מתקן
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
    
    const facilities = [];
    
    for (const place of places) {
      const facility = this.transformPlaceToFacility(place);
      if (facility) {
        facilities.push(facility);
      }
    }
    
    return facilities;
  }

  // המרת מקום מגוגל לפורמט מתקן באפליקציה
  transformPlaceToFacility(place) {
    if (!place || !place.geometry || !place.geometry.location) {
      console.error('שגיאה: מבנה המקום אינו תקין', place);
      return null;
    }
    
    try {
      // הכנת מערך תמונות, אם קיים
      const images = place.photos ? 
        place.photos.map(photo => 
          `${this.baseUrl}/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`
        ) : [];

      // זיהוי סוג המתקן על פי תגיות של גוגל
      let type = 'מתקן כושר';
      if (place.types) {
        if (place.types.includes('park')) type = 'פארק כושר';
        else if (place.types.includes('gym')) type = 'חדר כושר';
      }

      // הערכת ציוד אפשרי על פי סוג המקום
      let equipment = [];
      if (type === 'פארק כושר') {
        equipment = ['pullup_bars', 'parallel_bars'];
      } else if (type === 'חדר כושר') {
        equipment = ['cardio_machines', 'weight_machines'];
      }

      // הערכת מאפיינים אפשריים על פי סוג המקום
      let features = [];
      if (type === 'פארק כושר') {
        features = ['shaded', 'lit'];
      } else if (type === 'חדר כושר') {
        features = ['accessible', 'restrooms'];
      }

      // אימות שיש לנו את כל השדות החיוניים
      const latitude = typeof place.geometry.location.lat === 'function' 
        ? place.geometry.location.lat() 
        : place.geometry.location.lat;
        
      const longitude = typeof place.geometry.location.lng === 'function'
        ? place.geometry.location.lng()
        : place.geometry.location.lng;

      return {
        id: place.place_id, // נשתמש במזהה של גוגל כמזהה המתקן
        name: place.name || 'מתקן ללא שם',
        address: place.formatted_address || place.vicinity || 'כתובת לא ידועה',
        type: type,
        rating: place.rating || 0,
        review_count: place.user_ratings_total || 0,
        latitude: latitude,
        longitude: longitude,
        google_place_id: place.place_id,
        source: 'google',
        images: images,
        equipment: equipment,
        features: features,
        // שדות נוספים שעשויים להיות שימושיים
        is_open: place.opening_hours?.open_now,
        opening_hours: place.opening_hours?.weekday_text
      };
    } catch (error) {
      console.error('שגיאה בהמרת מקום למתקן:', error, place);
      return null;
    }
  }

  // קבלת URL לתמונה עבור מקום מגוגל
  getPhotoUrl(photoReference, maxWidth = 400) {
    if (!photoReference) return null;
    return `${this.baseUrl}/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${this.apiKey}`;
  }
}

export default GooglePlacesService;