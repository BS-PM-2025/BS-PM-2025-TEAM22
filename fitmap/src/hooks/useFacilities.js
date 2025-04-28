// useFacilities.js - קוד מתוקן
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export const useFacilities = (filters = {}) => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        
        // שינוי ל-query פשוט יותר ללא קשרי Join
        let query = supabase.from('facilities').select('*');
        
        // הוספת פילטרים אם יש
        if (filters.types && filters.types.length > 0) {
          query = query.in('type', filters.types);
        }
        
        // אפשר להוסיף פילטרים נוספים לפי צורך
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        // עכשיו יש לנו מתקנים, ננסה להביא ביקורות בנפרד
        let facilitiesWithDetails = [...data || []];
        
        try {
          if (data && data.length > 0) {
            const facilityIds = data.map(f => f.id);
            const { data: reviewsData, error: reviewsError } = await supabase
              .from('reviews')
              .select('*')
              .in('facility_id', facilityIds);
              
            if (!reviewsError && reviewsData) {
              // קישור ביקורות למתקנים
              facilitiesWithDetails = data.map(facility => {
                const facilityReviews = reviewsData.filter(r => r.facility_id === facility.id);
                return {
                  ...facility,
                  reviews: facilityReviews,
                  rating: calculateAverageRating(facilityReviews)
                };
              });
            }
          }
        } catch (detailsError) {
          console.warn("שגיאה בטעינת פרטי מתקנים נוספים:", detailsError);
          // ממשיכים גם אם נכשלה טעינת הפרטים הנוספים
        }
        
        setFacilities(facilitiesWithDetails);
      } catch (err) {
        console.error('שגיאה בטעינת מתקנים:', err);
        setError(err.message || 'שגיאה בטעינת מתקנים');
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, [filters.types]);

  // פונקציה לחישוב דירוג ממוצע
  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) {
      return 0;
    }
    
    const sum = reviews.reduce((total, review) => {
      return total + (review.rating || 0);
    }, 0);
    
    return sum / reviews.length;
  };

  return { facilities, loading, error };
};