// src/hooks/useNotifications.js - גרסה מתוקנת
import { useEffect, useState, useCallback, } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './useAuth';
import { notificationService } from '../services/notificationService';

export const useNotifications = () => {
  const { userProfile } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);

  // שליפת התראות ראשוניות
  const fetchNotifications = useCallback(async (pageNum = 0, replace = true) => {
    const userId = userProfile?.id || userProfile?.user_id;
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching notifications for userId:', userId);

      const { data, count, error } = await notificationService.getNotifications(
        userId,
        pageSize,
        pageNum * pageSize
      );

      console.log('Notifications response:', { data, count, error });

      if (error) throw error;

      if (replace) {
        setNotifications(data || []);
      } else {
        setNotifications(prev => [...prev, ...(data || [])]);
      }

      const totalPages = Math.ceil(count / pageSize);
      setHasMore(pageNum < totalPages - 1);
      setPage(pageNum);

      // עדכון מספר התראות שלא נקראו
      const unreadNotifications = data?.filter(n => !n.is_read) || [];
      setUnreadCount(unreadNotifications.length);

      console.log('Unread count:', unreadNotifications.length);
    } catch (err) {
      console.error('שגיאה בטעינת התראות:', err);
      setError('לא ניתן היה לטעון את ההתראות');
    } finally {
      setLoading(false);
    }
  }, [userProfile, pageSize]);

  // ספירת התראות שלא נקראו
  const countUnreadNotifications = useCallback(async () => {
    const userId = userProfile?.id || userProfile?.user_id;
    if (!userId) return;

    try {
      const { count, error } = await notificationService.getUnreadCount(userId);

      if (error) throw error;

      setUnreadCount(count);
      console.log('Unread count updated:', count);
    } catch (err) {
      console.error('שגיאה בספירת התראות שלא נקראו:', err);
    }
  }, [userProfile]);

  // התחברות לערוץ התראות בזמן אמת - עם הרשאה לאחר טעינת המשתמש
  useEffect(() => {
    const userId = userProfile?.id || userProfile?.user_id;

    console.log('useNotifications effect running', {
      userId,
      userProfile
    });

    if (!userId) {
      console.log('No userId, returning early');
      return;
    }

    // טעינת התראות שוב אם המשתמש התחבר זה עתה
    fetchNotifications(0, true);
    countUnreadNotifications();

    const subscription = notificationService.subscribeToNotifications(userId, async (newNotification) => {
      console.log('Realtime notification received:', newNotification);

      // טעינת פרטי השולח אם צריך
      if (newNotification.sender_id) {
        const { data: senderData } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .eq('id', newNotification.sender_id)
          .single();

        if (senderData) {
          newNotification = {
            ...newNotification,
            sender: senderData
          };
        }
      }

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [userProfile?.id, userProfile?.user_id, fetchNotifications, countUnreadNotifications]);

  // סימון התראה כנקראה
  const markAsRead = useCallback(async (notificationId) => {
    const userId = userProfile?.id || userProfile?.user_id;
    if (!userId || !notificationId) return;

    try {
      const { success, error } = await notificationService.markAsRead(userId, notificationId);

      if (error) throw error;

      if (success) {
        // עדכון המצב המקומי
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );

        // עדכון מונה התראות שלא נקראו
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('שגיאה בסימון התראה כנקראה:', err);
    }
  }, [userProfile]);

  // סימון כל ההתראות כנקראות
  const markAllAsRead = useCallback(async () => {
    const userId = userProfile?.id || userProfile?.user_id;
    if (!userId) return;

    try {
      const { success, error } = await notificationService.markAllAsRead(userId);

      if (error) throw error;

      if (success) {
        // עדכון המצב המקומי
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, is_read: true }))
        );

        // איפוס מונה התראות שלא נקראו
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('שגיאה בסימון כל ההתראות כנקראות:', err);
    }
  }, [userProfile]);

  // מחיקת התראה
  const deleteNotification = useCallback(async (notificationId) => {
    const userId = userProfile?.id || userProfile?.user_id;
    if (!userId || !notificationId) return;

    try {
      const { success, error } = await notificationService.deleteNotification(userId, notificationId);

      if (error) throw error;

      if (success) {
        // עדכון המצב המקומי
        const notificationToRemove = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));

        // אם ההתראה לא הייתה נקראה, עדכון המונה
        if (notificationToRemove && !notificationToRemove.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('שגיאה במחיקת התראה:', err);
    }
  }, [notifications, userProfile]);

  // טעינת עוד התראות (עבור דפדוף)
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;

    fetchNotifications(page + 1, false);
  }, [loading, hasMore, page, fetchNotifications]);

  console.log('useNotifications returning:', {
    notificationsCount: notifications.length,
    unreadCount,
    loading,
    error
  });

  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    refresh: () => fetchNotifications(0, true),
  };
};

export default useNotifications;