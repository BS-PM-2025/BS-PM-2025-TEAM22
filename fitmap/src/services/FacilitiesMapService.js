// src/services/FacilitiesMapService.js
import { supabase } from '../utils/supabaseClient';
import GooglePlacesService from '../utils/GooglePlacesService';

class FacilitiesMapService {
  constructor() {
    this.googlePlacesService = new GooglePlacesService();
    this.cachedFacilities = null;
    this.lastFetchTimestamp = null;
    this.cacheExpiryTime = 5 * 60 * 1000; // 5 דקות בקאש
  }

  // קבלת כל המתקנים - פנימיים וחיצוניים
  async getAllFacilities(location, radius) {
    try {
      // בדיקה האם יש מידע בקאש והוא עדיין תקף
      const now = Date.now();
      if (this.cachedFacilities && this.lastFetchTimestamp && 
          (now - this.lastFetchTimestamp < this.cacheExpiryTime)) {
        console.log('מחזיר מתקנים מקאש');
        return this.cachedFacilities;
      }

      // שליפת מתקנים מהדאטאבייס שלנו
      console.log('טוען מתקנים מהדאטאבייס...');
      const internalFacilities = await this.getInternalFacilities();
      
      // שליפת מתקנים מגוגל
      console.log('טוען מתקנים מגוגל...');
      let googleFacilities = [];
      if (location && radius) {
        googleFacilities = await this.getGoogleFacilities(location, radius);
      }
      
      // שילוב התוצאות והסרת כפילויות
      const allFacilities = this.mergeFacilities(internalFacilities, googleFacilities);
      
      // עדכון הקאש
      this.cachedFacilities = allFacilities;
      this.lastFetchTimestamp = now;
      
      return allFacilities;
    } catch (error) {
      console.error('שגיאה בטעינת מתקנים:', error);
      throw error;
    }
  }

  // קבלת מתקנים מהדאטאבייס הפנימי
  async getInternalFacilities() {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      // הוספת שדה מקור למתקנים פנימיים
      return data.map(facility => ({
        ...facility,
        source: 'internal'
      }));
    } catch (error) {
      console.error('שגיאה בשליפת מתקנים פנימיים:', error);
      return [];
    }
  }

  // קבלת מתקנים מגוגל
  async getGoogleFacilities(location, radius) {
    try {
      return await this.googlePlacesService.searchFacilitiesNearby(location, radius);
    } catch (error) {
      console.error('שגיאה בשליפת מתקנים מגוגל:', error);
      return [];
    }
  }

  // איחוד מתקנים והסרת כפילויות (כאשר מתקן מופיע גם בדאטאבייס וגם בגוגל)
  mergeFacilities(internalFacilities, googleFacilities) {
    // יצירת מפה של מזהי המתקנים הפנימיים שיש להם מזהה מקום בגוגל
    const internalGoogleIds = new Set(
      internalFacilities
        .filter(f => f.google_place_id)
        .map(f => f.google_place_id)
    );
    
    // סינון רשימת המתקנים מגוגל כך שלא יהיו כפילויות
    const filteredGoogleFacilities = googleFacilities.filter(
      f => !internalGoogleIds.has(f.google_place_id)
    );
    
    // איחוד הרשימות
    return [...internalFacilities, ...filteredGoogleFacilities];
  }

  // קבלת פרטי מתקן לפי המזהה שלו
  async getFacilityById(id, source = 'internal') {
    try {
      if (source === 'internal') {
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        return {
          ...data,
          source: 'internal'
        };
      } else if (source === 'google') {
        return await this.googlePlacesService.getFacilityDetails(id);
      }
      
      throw new Error(`מקור לא נתמך: ${source}`);
    } catch (error) {
      console.error(`שגיאה בשליפת מתקן (${source}) לפי מזהה:`, error);
      throw error;
    }
  }

  // קבלת מתקנים מסוננים לפי קריטריונים
  async getFilteredFacilities(filters, location) {
    try {
      // שליפת כל המתקנים
      let facilities = await this.getAllFacilities(location, filters.radius || 5);
      
      // סינון לפי סוג המתקן
      if (filters.types && filters.types.length > 0) {
        facilities = facilities.filter(f => filters.types.includes(f.type));
      }
      
      // סינון לפי מאפיינים
      if (filters.features && filters.features.length > 0) {
        facilities = facilities.filter(f => {
          // בודק שלמתקן יש את כל המאפיינים שנבחרו
          return filters.features.every(feature => 
            f.features && f.features.includes(feature)
          );
        });
      }
      
      // סינון לפי ציוד
      if (filters.equipment && filters.equipment.length > 0) {
        facilities = facilities.filter(f => {
          // בודק שלמתקן יש לפחות פריט ציוד אחד מהרשימה שנבחרה
          return filters.equipment.some(eq => 
            f.equipment && f.equipment.includes(eq)
          );
        });
      }
      
      // סינון לפי דירוג
      if (filters.minRating) {
        facilities = facilities.filter(f => 
          f.rating >= filters.minRating
        );
      }
      
      // החזרת המתקנים המסוננים
      return facilities;
    } catch (error) {
      console.error('שגיאה בסינון מתקנים:', error);
      throw error;
    }
  }
}

export default new FacilitiesMapService();