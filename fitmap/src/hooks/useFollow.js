// src/hooks/useFollow.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../utils/supabaseClient';

/**
 * הוק לניהול פעולות עקיבה/ביטול עקיבה אחרי משתמשים
 * 
 * @param {string} targetUserId - מזהה המשתמש שרוצים לעקוב אחריו (אופציונלי)
 * @returns {Object} - פונקציות וסטטוס עקיבה
 */
export const useFollow = (targetUserId = null) => {
  const { userProfile } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPendingRequest, setIsPendingRequest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mutualFollowers, setMutualFollowers] = useState([]);

  // בדיקה האם המשתמש הנוכחי עוקב אחרי המשתמש המבוקש
  const checkFollowStatus = useCallback(async () => {
    if (!userProfile?.user_id || !targetUserId || userProfile.user_id === targetUserId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // בדיקה האם קיים קשר עקיבה
      const { data, error } = await supabase
        .from('follow_relationships')
        .select('id')
        .eq('follower_id', userProfile.user_id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);

      // אם לא עוקב, בדיקה האם יש בקשת עקיבה ממתינה
      if (!data) {
        const { data: requestData, error: requestError } = await supabase
          .from('follow_requests')
          .select('status')
          .eq('requester_id', userProfile.user_id)
          .eq('target_id', targetUserId)
          .maybeSingle();

        if (requestError) throw requestError;
        setIsPendingRequest(requestData?.status === 'pending');
      } else {
        setIsPendingRequest(false);
      }

      // שליפת עוקבים משותפים
      const mutualUsers = await getMutualFollowers(userProfile.user_id, targetUserId);
      setMutualFollowers(mutualUsers);

    } catch (err) {
      console.error('שגיאה בבדיקת סטטוס עקיבה:', err);
      setError('שגיאה בטעינת סטטוס עקיבה');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.user_id, targetUserId]);

  // טעינה ראשונית של סטטוס העקיבה
  useEffect(() => {
    if (targetUserId) {
      checkFollowStatus();
    }
  }, [targetUserId, checkFollowStatus]);

  /**
   * מעקב אחרי משתמש
   * @param {string} userId - מזהה המשתמש לעקיבה (אופציונלי, ברירת מחדל משתמש במשתנה targetUserId)
   */
  const follow = async (userId = targetUserId) => {
    if (!userProfile?.user_id || !userId || userProfile.user_id === userId) {
      return { success: false, error: new Error('פרמטרים שגויים') };
    }

    setLoading(true);
    setError(null);

    try {
      // בדיקה האם המשתמש פרטי
      const { data: targetProfile, error: profileError } = await supabase
        .from('profiles')
        .select('is_private')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // אם המשתמש פרטי, יוצר בקשת עקיבה
      if (targetProfile.is_private) {
        const { error } = await supabase
          .from('follow_requests')
          .insert({
            requester_id: userProfile.user_id,
            target_id: userId,
            status: 'pending'
          });

        if (error) {
          // אם כבר קיימת בקשה, לא נחשב שגיאה
          if (error.code === '23505') { // UNIQUE VIOLATION
            return { success: true, isPending: true, error: null };
          }
          throw error;
        }

        setIsPendingRequest(true);
      } else {
        // מוסיף מיד לרשימת העוקבים אם המשתמש ציבורי
        const { error } = await supabase
          .from('follow_relationships')
          .insert({
            follower_id: userProfile.user_id,
            following_id: userId
          });

        if (error) {
          // אם כבר קיים, לא נחשב שגיאה
          if (error.code === '23505') { // UNIQUE VIOLATION
            return { success: true, error: null };
          }
          throw error;
        }

        setIsFollowing(true);
        setIsPendingRequest(false);
      }

      return { success: true };
    } catch (err) {
      console.error('שגיאה במעקב אחרי משתמש:', err);
      setError('שגיאה במעקב אחרי משתמש');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  /**
   * ביטול מעקב אחרי משתמש
   * @param {string} userId - מזהה המשתמש לביטול עקיבה (אופציונלי, ברירת מחדל משתמש במשתנה targetUserId)
   */
  const unfollow = async (userId = targetUserId) => {
    if (!userProfile?.user_id || !userId) {
      return { success: false, error: new Error('פרמטרים שגויים') };
    }

    setLoading(true);
    setError(null);

    try {
      // הסרת הקשר מטבלת follow_relationships
      const { error } = await supabase
        .from('follow_relationships')
        .delete()
        .eq('follower_id', userProfile.user_id)
        .eq('following_id', userId);

      // בדיקה אם יש בקשת עקיבה ממתינה ומחיקתה
      await supabase
        .from('follow_requests')
        .delete()
        .eq('requester_id', userProfile.user_id)
        .eq('target_id', userId);

      setIsFollowing(false);
      setIsPendingRequest(false);
      return { success: true, error };
    } catch (err) {
      console.error('שגיאה בביטול מעקב אחרי משתמש:', err);
      setError('שגיאה בביטול מעקב אחרי משתמש');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  /**
   * ביטול בקשת עקיבה ממתינה
   * @param {string} userId - מזהה המשתמש (אופציונלי, ברירת מחדל משתמש במשתנה targetUserId)
   */
  const cancelFollowRequest = async (userId = targetUserId) => {
    if (!userProfile?.user_id || !userId) {
      return { success: false, error: new Error('פרמטרים שגויים') };
    }

    setLoading(true);
    setError(null);

    try {
      // בעצם קריאה לאותה פונקציה כמו unfollow שגם מוחקת בקשות
      const result = await unfollow(userId);

      if (result.error) throw result.error;

      setIsPendingRequest(false);
      return { success: true };
    } catch (err) {
      console.error('שגיאה בביטול בקשת עקיבה:', err);
      setError('שגיאה בביטול בקשת עקיבה');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  /**
   * אישור בקשת עקיבה
   * @param {string} requesterId - מזהה המשתמש שביקש לעקוב
   */
  const approveFollowRequest = async (requesterId) => {
    if (!userProfile?.user_id || !requesterId) {
      return { success: false, error: new Error('פרמטרים שגויים') };
    }

    setLoading(true);
    setError(null);

    try {
      // עדכון הסטטוס ל-accepted
      const { error: updateError } = await supabase
        .from('follow_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('requester_id', requesterId)
        .eq('target_id', userProfile.user_id);

      if (updateError) throw updateError;

      // הוספת קשר עקיבה
      const { error: insertError } = await supabase
        .from('follow_relationships')
        .insert({
          follower_id: requesterId,
          following_id: userProfile.user_id
        });

      if (insertError && insertError.code !== '23505') throw insertError;

      return { success: true };
    } catch (err) {
      console.error('שגיאה באישור בקשת עקיבה:', err);
      setError('שגיאה באישור בקשת עקיבה');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  /**
   * דחיית בקשת עקיבה
   * @param {string} requesterId - מזהה המשתמש שביקש לעקוב
   */
  const rejectFollowRequest = async (requesterId) => {
    if (!userProfile?.user_id || !requesterId) {
      return { success: false, error: new Error('פרמטרים שגויים') };
    }

    setLoading(true);
    setError(null);

    try {
      // עדכון הסטטוס ל-rejected
      const { error } = await supabase
        .from('follow_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('requester_id', requesterId)
        .eq('target_id', userProfile.user_id);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      console.error('שגיאה בדחיית בקשת עקיבה:', err);
      setError('שגיאה בדחיית בקשת עקיבה');
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  /**
   * שליפת רשימת עוקבים
   * @param {string} userId - מזהה המשתמש (אופציונלי, ברירת מחדל משתמש במשתנה targetUserId)
   * @param {number} limit - מספר תוצאות מקסימלי
   * @param {number} offset - היסט לדפדוף
   */
  const getFollowers = async (userId = targetUserId, limit = 10, offset = 0) => {
    if (!userId) {
      return { data: [], count: 0, error: new Error('מזהה משתמש חסר') };
    }

    setLoading(true);
    setError(null);

    try {
      // קבלת מספר כולל של עוקבים (לדפדוף)
      const { count, error: countError } = await supabase
        .from('follow_relationships')
        .select('follower_id', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (countError) throw countError;

      // שליפת העוקבים עם פרטי הפרופיל
      const { data, error } = await supabase
        .from('follow_relationships')
        .select(`
          follower_id,
          follower:follower_id (
            id,
            name,
            avatar_url,
            city,
            fitness_level,
            followers_count
          )
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // המרה למבנה פשוט יותר
      const formatted = data?.map(item => ({
        ...item.follower,
        isFollowing: true // כבר עוקבים אחרי המשתמש המבוקש
      })) || [];

      return { 
        data: formatted, 
        count: count || 0, 
        error: null 
      };
    } catch (err) {
      console.error('שגיאה בטעינת רשימת עוקבים:', err);
      setError('שגיאה בטעינת רשימת עוקבים');
      return { data: [], count: 0, error: err };
    } finally {
      setLoading(false);
    }
  };

  /**
   * שליפת רשימת נעקבים
   * @param {string} userId - מזהה המשתמש (אופציונלי, ברירת מחדל משתמש במשתנה targetUserId)
   * @param {number} limit - מספר תוצאות מקסימלי
   * @param {number} offset - היסט לדפדוף
   */
  const getFollowing = async (userId = targetUserId, limit = 10, offset = 0) => {
    if (!userId) {
      return { data: [], count: 0, error: new Error('מזהה משתמש חסר') };
    }

    setLoading(true);
    setError(null);

    try {
      // קבלת מספר כולל של נעקבים (לדפדוף)
      const { count, error: countError } = await supabase
        .from('follow_relationships')
        .select('following_id', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (countError) throw countError;

      // שליפת הנעקבים עם פרטי הפרופיל
      const { data, error } = await supabase
        .from('follow_relationships')
        .select(`
          following_id,
          following:following_id (
            id,
            name,
            avatar_url,
            city,
            fitness_level,
            followers_count
          )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // המרה למבנה פשוט יותר
      const formatted = data?.map(item => ({
        ...item.following,
        isFollowing: true // המשתמש המבוקש כבר עוקב אחריהם
      })) || [];

      return { 
        data: formatted, 
        count: count || 0, 
        error: null 
      };
    } catch (err) {
      console.error('שגיאה בטעינת רשימת נעקבים:', err);
      setError('שגיאה בטעינת רשימת נעקבים');
      return { data: [], count: 0, error: err };
    } finally {
      setLoading(false);
    }
  };

  /**
   * שליפת בקשות עקיבה ממתינות
   * @param {number} limit - מספר תוצאות מקסימלי
   * @param {number} offset - היסט לדפדוף
   */
  const getPendingRequests = async (limit = 10, offset = 0) => {
    if (!userProfile?.user_id) {
      return { data: [], count: 0, error: new Error('משתמש לא מחובר') };
    }

    setLoading(true);
    setError(null);

    try {
      // קבלת מספר כולל של בקשות
      const { count, error: countError } = await supabase
        .from('follow_requests')
        .select('requester_id', { count: 'exact', head: true })
        .eq('target_id', userProfile.user_id)
        .eq('status', 'pending');

      if (countError) throw countError;

      // שליפת הבקשות עם פרטי הפרופיל
      const { data, error } = await supabase
        .from('follow_requests')
        .select(`
          requester_id,
          created_at,
          requester:requester_id (
            id,
            name,
            avatar_url,
            city,
            fitness_level,
            followers_count
          )
        `)
        .eq('target_id', userProfile.user_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // המרה למבנה פשוט יותר
      const formatted = data?.map(item => ({
        ...item.requester,
        requestDate: item.created_at
      })) || [];

      return { 
        data: formatted, 
        count: count || 0, 
        error: null 
      };
    } catch (err) {
      console.error('שגיאה בטעינת בקשות עקיבה:', err);
      setError('שגיאה בטעינת בקשות עקיבה');
      return { data: [], count: 0, error: err };
    } finally {
      setLoading(false);
    }
  };

  /**
   * שליפת הצעות משתמשים לעקיבה
   * @param {string} userId - מזהה המשתמש עבורו נרצה הצעות
   * @param {number} limit - מספר הצעות מקסימלי
   * @returns {Promise<Array>}
   */
  const getSuggestedUsers = async (userId, limit = 5) => {
    try {
      if (!userId) {
        return [];
      }

      // שליפת תחומי עניין של המשתמש
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('fitness_level, preferred_workouts, city')
        .eq('id', userId)
        .single();

      // מציאת משתמשים עם העדפות דומות
      const { data: similarUsers } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, city, fitness_level, followers_count')
        .neq('id', userId) // לא המשתמש עצמו
        .order('followers_count', { ascending: false }) // המשתמשים הפופולריים יותר
        .limit(limit * 2); // שולף יותר בשביל סינון

      if (!similarUsers || similarUsers.length === 0) {
        return [];
      }

      // סינון משתמשים שכבר עוקבים אחריהם
      const { data: following } = await supabase
        .from('follow_relationships')
        .select('following_id')
        .eq('follower_id', userId);

      const followingIds = following?.map(f => f.following_id) || [];

      // סינון ומיון לפי רלוונטיות
      const filteredUsers = similarUsers
        .filter(user => !followingIds.includes(user.id))
        .sort((a, b) => {
          let relevanceA = 0;
          let relevanceB = 0;

          // עיר זהה
          if (userProfile?.city && a.city === userProfile.city) relevanceA += 3;
          if (userProfile?.city && b.city === userProfile.city) relevanceB += 3;

          // רמת כושר דומה
          if (userProfile?.fitness_level && a.fitness_level === userProfile.fitness_level) relevanceA += 2;
          if (userProfile?.fitness_level && b.fitness_level === userProfile.fitness_level) relevanceB += 2;

          // יותר עוקבים = יותר רלוונטי
          relevanceA += (a.followers_count || 0) / 100;
          relevanceB += (b.followers_count || 0) / 100;

          return relevanceB - relevanceA;
        })
        .slice(0, limit);

      return filteredUsers;
    } catch (err) {
      console.error('שגיאה בשליפת הצעות למשתמשים:', err);
      return [];
    }
  };

  /**
   * קבלת המשתמשים המשותפים: B עוקב אחרי A וגם אחרי המשתמש הנוכחי
   * @param {string} userId - מזהה המשתמש הנוכחי
   * @param {string} targetId - מזהה המשתמש שבודקים
   * @param {number} limit - מספר תוצאות מקסימלי
   * @returns {Promise<Array>}
   */
  const getMutualFollowers = async (userId, targetId, limit = 3) => {
    try {
      if (!userId || !targetId) {
        return [];
      }

      // שליפת עוקבים משותפים
      const { data, error } = await supabase.rpc('get_mutual_followers', {
        user_id_1: userId,
        user_id_2: targetId,
        limit_num: limit
      });

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('שגיאה בקבלת עוקבים משותפים:', err);
      return [];
    }
  };

  return {
    isFollowing,
    isPendingRequest,
    loading,
    error,
    mutualFollowers,
    follow,
    unfollow,
    cancelFollowRequest,
    approveFollowRequest,
    rejectFollowRequest,
    getFollowers,
    getFollowing,
    getPendingRequests,
    getSuggestedUsers,
    checkFollowStatus,
  };
};

export default useFollow;