// src/services/notificationService.js
import { supabase } from '../utils/supabaseClient';

/**
 * שירות לניהול התראות משתמש 
 */
export const notificationService = {
  /**
   * שליפת ההתראות של המשתמש
   * @param {string} userId - מזהה המשתמש
   * @param {number} limit - מספר התראות מקסימלי לשליפה
   * @param {number} offset - דילוג על X התראות ראשונות (לצורך דפדוף)
   * @param {boolean} unreadOnly - האם להביא התראות שלא נקראו בלבד
   * @returns {Promise<Object>} - התראות או שגיאה
   */
  async getNotifications(userId, limit = 10, offset = 0, unreadOnly = false) {
    try {
      if (!userId) {
        console.log('No userId provided');
        return { data: [], count: 0, error: new Error('מזהה משתמש חסר') };
      }

      console.log('Fetching notifications for user:', userId);

      // שליפת מספר התראות כולל (עבור דפדוף)
      const countQuery = supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (unreadOnly) {
        countQuery.eq('is_read', false);
      }

      const { count, error: countError } = await countQuery;

      if (countError) throw countError;

      // שליפת ההתראות עצמן
      let query = supabase
        .from('notifications')
        .select(`
          *,
          sender:sender_id (
            id,
            name,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('Notifications fetched:', data);

      return {
        data: data || [],
        count: count || 0,
        error: null
      };
    } catch (err) {
      console.error('שגיאה בטעינת התראות:', err);
      return { data: [], count: 0, error: err };
    }
  },

  /**
   * ספירת התראות שלא נקראו
   * @param {string} userId - מזהה המשתמש
   * @returns {Promise<Object>} - מספר התראות או שגיאה
   */
  async getUnreadCount(userId) {
    try {
      if (!userId) {
        return { count: 0, error: new Error('מזהה משתמש חסר') };
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { count: count || 0, error: null };
    } catch (err) {
      console.error('שגיאה בספירת התראות:', err);
      return { count: 0, error: err };
    }
  },

  /**
   * סימון התראה כנקראה
   * @param {string} userId - מזהה המשתמש
   * @param {string} notificationId - מזהה ההתראה
   * @returns {Promise<Object>} - תוצאה או שגיאה
   */
  async markAsRead(userId, notificationId) {
    try {
      if (!userId || !notificationId) {
        return { success: false, error: new Error('פרמטרים חסרים') };
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (err) {
      console.error('שגיאה בסימון התראה כנקראה:', err);
      return { success: false, error: err };
    }
  },

  /**
   * סימון כל ההתראות כנקראות
   * @param {string} userId - מזהה המשתמש
   * @returns {Promise<Object>} - תוצאה או שגיאה
   */
  async markAllAsRead(userId) {
    try {
      if (!userId) {
        return { success: false, error: new Error('מזהה משתמש חסר') };
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true, error: null };
    } catch (err) {
      console.error('שגיאה בסימון כל ההתראות כנקראות:', err);
      return { success: false, error: err };
    }
  },

  /**
   * מחיקת התראה בודדת
   * @param {string} userId - מזהה המשתמש
   * @param {string} notificationId - מזהה ההתראה
   * @returns {Promise<Object>} - תוצאה או שגיאה
   */
  async deleteNotification(userId, notificationId) {
    try {
      if (!userId || !notificationId) {
        return { success: false, error: new Error('פרמטרים חסרים') };
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (err) {
      console.error('שגיאה במחיקת התראה:', err);
      return { success: false, error: err };
    }
  },

  /**
   * מחיקת כל ההתראות של משתמש
   * @param {string} userId - מזהה המשתמש
   * @returns {Promise<Object>} - תוצאה או שגיאה
   */
  async deleteAllNotifications(userId) {
    try {
      if (!userId) {
        return { success: false, error: new Error('מזהה משתמש חסר') };
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true, error: null };
    } catch (err) {
      console.error('שגיאה במחיקת כל ההתראות:', err);
      return { success: false, error: err };
    }
  },

  /**
   * יצירת התראה חדשה
   * @param {Object} notification - אובייקט ההתראה
   * @returns {Promise<Object>} - תוצאה או שגיאה
   */
  async createNotification(notification) {
    try {
      if (!notification?.user_id) {
        return { success: false, error: new Error('מזהה משתמש חסר בהתראה') };
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select();

      if (error) throw error;

      return { success: true, data: data?.[0] || null, error: null };
    } catch (err) {
      console.error('שגיאה ביצירת התראה:', err);
      return { success: false, data: null, error: err };
    }
  },

  /**
   * הרשמה להתראות בזמן אמת
   * @param {string} userId - מזהה המשתמש
   * @param {Function} callback - פונקציה שתופעל כשמתקבלת התראה חדשה
   * @returns {Object} - אובייקט הערוץ והפונקציה לסגירתו
   */
  subscribeToNotifications(userId, callback) {
    if (!userId || !callback) return { unsubscribe: () => {} };

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        callback(payload.new);
      })
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }
};

export default notificationService;