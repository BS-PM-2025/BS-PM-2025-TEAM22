// src/hooks/useSocialFeed.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

export const useSocialFeed = ({ userId = null, pageSize = 10 } = {}) => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const userIdRef = useRef(userId);

  // לא לשים loading ו־hasMore בתוך useCallback — הם משתנים תדיר
  const loadPosts = useCallback(async (pageNumber = 0, replace = false) => {
    setLoading(true);
    try {
      const from = pageNumber * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('posts')
        .select('*, user:user_id (id, name, avatar_url)')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (userIdRef.current) {
        query = query.eq('user_id', userIdRef.current);
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (replace) {
        setPosts(data || []);
      } else {
        setPosts(prev => [...prev, ...(data || [])]);
      }

      if (!data || data.length < pageSize) {
        setHasMore(false);
      } else {
        setPage(pageNumber + 1);
      }
    } catch (err) {
      console.error('שגיאה בטעינת פוסטים:', err);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  const resetFeed = useCallback(() => {
    setPage(0);
    setHasMore(true);
    setPosts([]);
    loadPosts(0, true);
  }, [loadPosts]);

  useEffect(() => {
    userIdRef.current = userId;
    resetFeed();
  }, [userId, resetFeed]);

  return {
    posts,
    loading,
    hasMore,
    loadMore: () => {
      if (!loading && hasMore) {
        loadPosts(page);
      }
    },
    reload: resetFeed,
  };
};
