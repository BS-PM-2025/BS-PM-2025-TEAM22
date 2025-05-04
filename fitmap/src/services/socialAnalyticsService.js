// src/services/socialAnalyticsService.js
import { supabase } from '../utils/supabaseClient';

export const socialAnalyticsService = {
  async getUserEngagementStats(userId) {
    if (!userId) return null;

    // מספר פוסטים
    const { count: postCount } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // מספר תגובות
    const { count: commentCount } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // מספר לייקים שהמשתמש נתן
    const { count: likesGiven } = await supabase
      .from('post_likes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // מספר לייקים שהמשתמש קיבל
    const { count: likesReceived } = await supabase
      .from('posts')
      .select('likes_count', { count: 'exact', head: false })
      .eq('user_id', userId);

    return {
      postCount: postCount || 0,
      commentCount: commentCount || 0,
      likesGiven: likesGiven || 0,
      likesReceived: likesReceived || 0,
    };
  },

  async getTopUsersByFollowers(limit = 10) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, followers_count')
      .order('followers_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('שגיאה בשליפת משתמשים מובילים:', error);
      return [];
    }

    return data || [];
  }
};
