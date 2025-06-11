// src/contexts/OnlineStatusContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../hooks/useAuth';

// יצירת Context
const OnlineStatusContext = createContext({
  onlineUsers: {},
  updateUserStatus: () => {},
  checkUserStatus: () => {}
});

/**
 * ספק Context לניהול סטטוס מקוון של משתמשים
 */
export const OnlineStatusProvider = ({ children }) => {
  const { userProfile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState({});
  const [subscriptions, setSubscriptions] = useState({});

  // עדכון סטטוס המשתמש הנוכחי
  const updateCurrentUserStatus = async (isOnline) => {
    if (!userProfile?.id) return;

    try {
      await supabase
        .from('user_status')
        .upsert({
          user_id: userProfile.id,
          is_online: isOnline,
          last_seen: isOnline ? null : new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('שגיאה בעדכון סטטוס משתמש:', error);
    }
  };

  // בדיקת סטטוס משתמש ספציפי והאזנה לשינויי סטטוס
  const checkUserStatus = async (userId) => {
    if (!userId || onlineUsers[userId] !== undefined) return;

    try {
      // שליפת סטטוס נוכחי
      const { data } = await supabase
        .from('user_status')
        .select('is_online, last_seen')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setOnlineUsers(prev => ({
          ...prev,
          [userId]: {
            isOnline: data.is_online || false,
            lastSeen: data.last_seen
          }
        }));
      } else {
        // אם אין נתונים, המשתמש לא מקוון
        setOnlineUsers(prev => ({
          ...prev,
          [userId]: {
            isOnline: false,
            lastSeen: null
          }
        }));
      }

      // רק אם עוד לא קיימת האזנה למשתמש זה
      if (!subscriptions[userId]) {
        const subscription = supabase
          .channel(`user-status-${userId}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'user_status',
            filter: `user_id=eq.${userId}`
          }, (payload) => {
            if (payload.new) {
              setOnlineUsers(prev => ({
                ...prev,
                [userId]: {
                  isOnline: payload.new.is_online || false,
                  lastSeen: payload.new.last_seen
                }
              }));
            }
          })
          .subscribe();

        // שמירת המנוי החדש
        setSubscriptions(prev => ({
          ...prev,
          [userId]: subscription
        }));
      }
    } catch (error) {
      console.error('שגיאה בבדיקת סטטוס משתמש:', error);
    }
  };

  // עדכון הסטטוס של המשתמש הנוכחי בטעינה ובעזיבה
  useEffect(() => {
    if (!userProfile?.id) return;

    // עדכון לסטטוס מקוון בעת טעינת הדף
    updateCurrentUserStatus(true);

    // טיפול באירועי חיבור ועזיבה
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      updateCurrentUserStatus(isVisible);
    };

    const handleBeforeUnload = () => {
      // נסיון לעדכן סטטוס לפני סגירת הדף
      updateCurrentUserStatus(false);
    };

    // האזנה לאירועים
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // ניקוי בעת הסרת הרכיב
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // עדכון לסטטוס לא מקוון
      updateCurrentUserStatus(false);
      
      // ניקוי מנויים
      Object.values(subscriptions).forEach(subscription => {
        if (subscription) {
          supabase.removeChannel(subscription);
        }
      });
    };
  }, [userProfile]);

  const contextValue = {
    onlineUsers,
    updateUserStatus: updateCurrentUserStatus,
    checkUserStatus
  };

  return (
    <OnlineStatusContext.Provider value={contextValue}>
      {children}
    </OnlineStatusContext.Provider>
  );
};

// הוק לשימוש בנתוני הסטטוס
export const useOnlineStatus = () => {
  const context = useContext(OnlineStatusContext);
  
  if (!context) {
    throw new Error('useOnlineStatus חייב להיות בתוך OnlineStatusProvider');
  }
  
  return context;
};