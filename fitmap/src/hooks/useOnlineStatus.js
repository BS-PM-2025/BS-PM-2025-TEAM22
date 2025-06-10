// src/hooks/useOnlineStatus.js
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

/**
 * הוק המציג את סטטוס החיבור של משתמש
 * 
 * @param {string} userId - מזהה המשתמש לבדיקה
 * @returns {Object} - אובייקט המכיל את סטטוס החיבור ומידע על פעילות אחרונה
 */
export const useOnlineStatus = (userId) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);

  useEffect(() => {
    if (!userId) return;

    // פונקציה לקבלת סטטוס המשתמש מבסיס הנתונים
    const fetchUserStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('user_status')
          .select('is_online, last_seen')
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setIsOnline(data.is_online);
          setLastSeen(data.last_seen);
        }
      } catch (err) {
        console.error('שגיאה בשליפת סטטוס משתמש:', err);
      }
    };

    // הגדרת ערוץ בזמן אמת לסטטוס המשתמש
    const statusSubscription = supabase
      .channel(`status:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_status',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        // עדכון סטטוס כאשר יש שינוי בבסיס הנתונים
        if (payload.new) {
          setIsOnline(payload.new.is_online);
          setLastSeen(payload.new.last_seen);
        }
      })
      .subscribe();

    // טעינת סטטוס התחלתי
    fetchUserStatus();

    // ניקוי בעת הסרת הקומפוננטה
    return () => {
      supabase.removeChannel(statusSubscription);
    };
  }, [userId]);

  return { isOnline, lastSeen };
};

export default useOnlineStatus;