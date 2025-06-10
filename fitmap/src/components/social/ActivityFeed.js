import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaSpinner, FaExclamationTriangle, FaBellSlash } from 'react-icons/fa';
import { supabase } from '../../utils/supabaseClient';
import ActivityCard from './ActivityCard';
/**
 * פיד פעילויות - מציג רשימת פעילויות אחרונות באפליקציה
 * גרסה משודרגת עם טעינת נתונים חכמה, infinite scroll וביצועים משופרים
 */
function ActivityFeed({
  limit = 10,
  userId = null,
  className = '',
  showEmptyState = true,
  emptyStateMessage,
  title
}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  // Observer עבור infinite scroll
  const observer = useRef();
  const lastActivityRef = useCallback(node => {
    if (loading) return;
    
    // ניתוק ה-observer מהאלמנט הקודם
    if (observer.current) observer.current.disconnect();
    
    // יצירת observer חדש שמזהה גלילה לסוף הרשימה
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isFetchingMore) {
        loadMore();
      }
    });
    
    // חיבור ה-observer לאלמנט הנוכחי
    if (node) observer.current.observe(node);
  }, [loading, hasMore, isFetchingMore]);

  // פונקציה לחישוב זמן יחסי
  const calculateTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const activityTime = new Date(timestamp);
    
    // וידוא שהתאריך תקין
    if (isNaN(activityTime.getTime())) return '';
    
    const diffMs = now.getTime() - activityTime.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return diffDay === 1 ? 'לפני יום' : `לפני ${diffDay} ימים`;
    } else if (diffHour > 0) {
      return diffHour === 1 ? 'לפני שעה' : `לפני ${diffHour} שעות`;
    } else if (diffMin > 0) {
      return diffMin === 1 ? 'לפני דקה' : `לפני ${diffMin} דקות`;
    } else {
      return 'זה עתה';
    }
  };

  // פונקציה לטעינת פעילויות
  const fetchActivities = useCallback(async (pageNumber = 0, append = false) => {
    try {
      if (pageNumber === 0) {
        setLoading(true);
      } else {
        setIsFetchingMore(true);
      }
      
      setError(null);
      
      let query = supabase
        .from('activities')
        .select(`
          *,
          user:user_id (
            id,
            name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .range(pageNumber * limit, (pageNumber * limit) + limit - 1);
      
      // אם צוין משתמש ספציפי, מסנן רק את הפעילויות שלו
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        throw fetchError;
      }
      
      // בדיקה אם יש עוד פעילויות לטעון
      setHasMore(data.length === limit);
      
      // עיבוד התאריכים והוספת נתונים שימושיים
      const processedActivities = data.map(activity => ({
        ...activity,
        time_ago: calculateTimeAgo(activity.created_at)
      }));
      
      // אם זה עמוד ראשון, החלף את כל הפעילויות
      // אחרת, הוסף לרשימה הקיימת
      if (!append) {
        setActivities(processedActivities);
      } else {
        setActivities(prev => [...prev, ...processedActivities]);
      }
      
    } catch (err) {
      console.error('שגיאה בטעינת פעילויות:', err);
      setError('אירעה שגיאה בטעינת הפעילויות');
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }, [userId, limit]);
  
  // טעינה ראשונית של פעילויות
  useEffect(() => {
    setPage(0);
    fetchActivities(0, false);
  }, [userId, limit, fetchActivities]); // טעינה מחדש אם המשתמש או המגבלה משתנים
  
  // הגדרת listener לעדכון בזמן אמת
  useEffect(() => {
    const subscription = supabase
      .channel('activities_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activities'
      }, (payload) => {
        // בדיקה אם לכלול את הפעילות החדשה בפיד
        const shouldInclude = !userId || payload.new.user_id === userId;
        
        if (shouldInclude) {
          // מעבד את הפעילות החדשה
          const newActivity = {
            ...payload.new,
            time_ago: 'זה עתה',
            // נוסיף את פרטי המשתמש בהמשך
          };
          
          // מקבל פרטי משתמש
          supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .eq('id', newActivity.user_id)
            .single()
            .then(({ data: userData }) => {
              if (userData) {
                // מוסיף את פרטי המשתמש ומעדכן את הפיד
                setActivities(prev => [{
                  ...newActivity,
                  user: userData
                }, ...prev]);
              }
            });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);
  
  // טעינת עוד פעילויות
  const loadMore = () => {
    if (!loading && !isFetchingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchActivities(nextPage, true);
    }
  };

  // רינדור תצוגת טעינה
  if (loading && activities.length === 0) {
    return (
      <div className={`activity-feed-loading ${className}`} aria-live="polite">
        <FaSpinner className="loading-spinner" aria-hidden="true" />
        <p>טוען פעילויות...</p>
      </div>
    );
  }
  
  // רינדור הודעת שגיאה
  if (error && activities.length === 0) {
    return (
      <div className={`activity-feed-error ${className}`} aria-live="assertive">
        <FaExclamationTriangle className="error-icon" aria-hidden="true" />
        <p>{error}</p>
        <button 
          onClick={() => fetchActivities(0, false)}
          className="retry-button"
          aria-label="נסה לטעון מחדש"
        >
          נסה שוב
        </button>
      </div>
    );
  }
  
  // רינדור פיד ריק
  if (activities.length === 0 && showEmptyState) {
    return (
      <div className={`activity-feed-empty ${className}`} aria-live="polite">
        <FaBellSlash className="empty-icon" aria-hidden="true" />
        <p>{emptyStateMessage || 'אין פעילויות להצגה'}</p>
      </div>
    );
  }

  // רינדור פיד פעילויות
  return (
    <div className={`activity-feed ${className}`} aria-label="פיד פעילויות">
      {title && <h2 className="activity-feed-title">{title}</h2>}
      
      <div className="activity-feed-list">
        {activities.map((activity, index) => {
          const isLastItem = index === activities.length - 1;
          
          // האלמנט האחרון מקבל רפרנס עבור ה-infinite scroll
          return isLastItem && hasMore ? (
            <div ref={lastActivityRef} key={`${activity.id}-${index}`}>
              <ActivityCard activity={activity} />
            </div>
          ) : (
            <ActivityCard 
              key={`${activity.id}-${index}`} 
              activity={activity} 
            />
          );
        })}
      </div>
      
      {/* אזור טעינה נוספת */}
      {isFetchingMore && (
        <div className="loading-more">
          <FaSpinner className="loading-spinner" aria-hidden="true" />
          <span>טוען עוד...</span>
        </div>
      )}
      
      {!hasMore && activities.length > 0 && (
        <div className="end-of-feed">
          <p>הגעת לסוף הפיד</p>
        </div>
      )}
    </div>
  );
}

export default ActivityFeed;