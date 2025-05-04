// src/services/feedService.js
import { supabase } from '../utils/supabaseClient';

/**
 * שירות לניהול פיד חברתי, פוסטים, לייקים ותגובות
 */
export const feedService = {
  /**
   * יצירת פוסט חדש
   */
  async createPost(postData, relatedActivity = null) {
    try {
      if (!postData.user_id || !postData.content) {
        return { data: null, error: 'חסרים נתונים חיוניים ליצירת פוסט' };
      }

      const post = {
        user_id: postData.user_id,
        content: postData.content.trim(),
        image_url: postData.image_url || null,
        activity_type: postData.activity_type || 'post',
        is_public: typeof postData.is_public !== 'undefined' ? postData.is_public : true,
        created_at: new Date().toISOString()
      };

      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert(post)
        .select(`*, user:user_id (id, name, avatar_url)`).single();

      if (postError) throw postError;

      if (relatedActivity && newPost) {
        await linkActivityToPost(newPost.id, postData.activity_type, relatedActivity);
      }

      return { data: newPost, error: null };
    } catch (error) {
      console.error('שגיאה ביצירת פוסט:', error);
      return { data: null, error: error.message || 'שגיאה ביצירת פוסט' };
    }
  },

  /**
   * מחיקת פוסט
   */
  async deletePost(postId, userId) {
    try {
      if (!postId || !userId) {
        return { success: false, error: 'חסרים פרמטרים נדרשים' };
      }

      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;
      if (!post || post.user_id !== userId) {
        return { success: false, error: 'אין לך הרשאה למחוק פוסט זה' };
      }

      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (deleteError) throw deleteError;

      return { success: true, error: null };
    } catch (error) {
      console.error('שגיאה במחיקת פוסט:', error);
      return { success: false, error: error.message || 'שגיאה במחיקת הפוסט' };
    }
  },

  /**
   * לייק/ביטול לייק לפוסט
   */
  async toggleLike(postId, userId, isLiking = true) {
    try {
      if (!postId || !userId) {
        return { success: false, error: 'חסרים פרמטרים נדרשים' };
      }

      if (isLiking) {
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert({
            related_post_id: postId,
            user_id: userId,
            created_at: new Date().toISOString()
          })
          .onConflict(['related_post_id', 'user_id']).ignore();

        if (insertError && insertError.code !== '23505') throw insertError;
      } else {
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('related_post_id', postId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('שגיאה בעדכון לייק:', error);
      return { success: false, error: error.message || 'שגיאה בעדכון לייק' };
    }
  },

  /**
   * קבלת תגובות לפוסט
   */
  async getComments(postId, currentUserId = null) {
    try {
      if (!postId) {
        return { data: [], error: 'חסר מזהה פוסט' };
      }

      const { data: comments, error: fetchError } = await supabase
        .from('post_comments')
        .select(`*, profiles:user_id (id, name, avatar_url), comment_likes:comment_likes (count)`) 
        .eq('related_post_id', postId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      let enhancedComments = comments || [];
      if (currentUserId && enhancedComments.length > 0) {
        const { data: likedComments } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', currentUserId)
          .in('comment_id', enhancedComments.map(c => c.id));

        const likedCommentIds = new Set(likedComments?.map(l => l.comment_id) || []);

        enhancedComments = enhancedComments.map(comment => ({
          ...comment,
          liked_by_me: likedCommentIds.has(comment.id)
        }));
      }

      return { data: enhancedComments, error: null };
    } catch (error) {
      console.error('שגיאה בשליפת תגובות:', error);
      return { data: [], error: error.message || 'שגיאה בשליפת תגובות' };
    }
  },

  /**
   * הוספת תגובה לפוסט + שליחת התראה
   */
  async addComment(postId, userId, content, parentId = null) {
    try {
      if (!postId || !userId || !content.trim()) {
        return { data: null, error: 'חסרים פרמטרים נדרשים' };
      }

      const comment = {
        related_post_id: postId,
        user_id: userId,
        content: content.trim(),
        parent_id: parentId,
        created_at: new Date().toISOString()
      };

      const { data: newComment, error: insertError } = await supabase
        .from('post_comments')
        .insert(comment)
        .select(`*, profiles:user_id (id, name, avatar_url)`) 
        .single();

      if (insertError) throw insertError;

      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      const postOwnerId = post?.user_id;
      if (postOwnerId && postOwnerId !== userId) {
        await supabase.from('notifications').insert({
          user_id: postOwnerId,
          sender_id: userId,
          type: 'comment',
          title: 'תגובה חדשה על הפוסט שלך',
          content: content.slice(0, 100),
          related_post_id: postId,
          related_user_id: userId,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }

      return { data: { ...newComment, comment_likes: { count: 0 }, liked_by_me: false }, error: null };
    } catch (error) {
      console.error('שגיאה בהוספת תגובה:', error);
      return { data: null, error: error.message || 'שגיאה בהוספת תגובה' };
    }
  },

  /**
   * לייק/ביטול לייק לתגובה
   */
  async toggleCommentLike(commentId, userId, isLiking = true) {
    try {
      if (!commentId || !userId) {
        return { success: false, error: 'חסרים פרמטרים נדרשים' };
      }

      if (isLiking) {
        const { error: insertError } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: userId,
            created_at: new Date().toISOString()
          })
          .onConflict(['comment_id', 'user_id']).ignore();

        if (insertError && insertError.code !== '23505') throw insertError;
      } else {
        const { error: deleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('שגיאה בעדכון לייק לתגובה:', error);
      return { success: false, error: error.message || 'שגיאה בעדכון לייק לתגובה' };
    }
  }
};

async function linkActivityToPost(postId, activityType, activityData) {
  try {
    switch (activityType) {
      case 'workout':
        if (activityData.workout_id) {
          await supabase.from('post_workouts').insert({
            related_post_id: postId,
            workout_id: activityData.workout_id
          });
        }
        break;
      case 'challenge':
        if (activityData.challenge_id) {
          await supabase.from('post_challenges').insert({
            related_post_id: postId,
            challenge_id: activityData.challenge_id
          });
        }
        break;
      case 'group_workout':
        if (activityData.group_workout_id) {
          await supabase.from('post_group_workouts').insert({
            related_post_id: postId,
            group_workout_id: activityData.group_workout_id
          });
        }
        break;
      case 'facility_check_in':
        if (activityData.facility_id) {
          await supabase.from('post_facility_checkins').insert({
            related_post_id: postId,
            facility_id: activityData.facility_id
          });
        }
        break;
    }
  } catch (error) {
    console.error('שגיאה בקישור פעילות לפוסט:', error);
  }
}

export default feedService;
