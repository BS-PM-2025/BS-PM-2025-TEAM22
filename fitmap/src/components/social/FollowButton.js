// src/components/social/FollowButton.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { FaUserPlus, FaUserCheck, FaSpinner, FaLock, FaUserClock } from 'react-icons/fa';
import styles from './styles/FollowButton.module.css';

const FollowButton = ({
  targetUserId,
  isPrivate = false,
  onFollowChange,
  size = 'md'
}) => {
  const { user, userProfile } = useAuth();
  const [followStatus, setFollowStatus] = useState('notFollowing'); // notFollowing, following, pending, loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !targetUserId || !userProfile || userProfile.id === targetUserId) {
      setLoading(false);
      return;
    }

    checkFollowStatus();
  }, [user, userProfile, targetUserId]);

  const checkFollowStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: followData, error: followError } = await supabase
        .from('follow_relationships')
        .select('*')
        .eq('follower_id', userProfile.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (followError && followError.code !== 'PGRST116') throw followError;

      if (followData) {
        setFollowStatus('following');
        return;
      }

      if (isPrivate) {
        const { data: requestData, error: requestError } = await supabase
          .from('follow_requests')
          .select('*')
          .eq('requester_id', userProfile.id)
          .eq('recipient_id', targetUserId)
          .eq('status', 'pending')
          .maybeSingle();

        if (requestError && requestError.code !== 'PGRST116') throw requestError;

        setFollowStatus(requestData ? 'pending' : 'notFollowing');
      } else {
        setFollowStatus('notFollowing');
      }
    } catch (error) {
      console.error('שגיאה בבדיקת מצב עקיבה:', error);
      setError('לא ניתן היה לבדוק את מצב העקיבה');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowClick = async () => {
    if (!user || !userProfile || loading) return;

    try {
      setLoading(true);
      setError(null);

      if (followStatus === 'following') {
        const { error: unfollowError } = await supabase
          .from('follow_relationships')
          .delete()
          .eq('follower_id', userProfile.id)
          .eq('following_id', targetUserId);

        if (unfollowError) throw unfollowError;

        setFollowStatus('notFollowing');
        if (onFollowChange) onFollowChange(false);
      } else if (isPrivate && followStatus === 'notFollowing') {
        const { error: requestError } = await supabase
          .from('follow_requests')
          .insert({
            requester_id: userProfile.id,
            recipient_id: targetUserId,
            status: 'pending'
          });

        if (requestError) throw requestError;

        await supabase.from('notifications').insert({
          user_id: targetUserId,
          sender_id: userProfile.id,
          type: 'follow',
          title: 'בקשת עקיבה חדשה',
          content: 'ביקש לעקוב אחריך',
          related_user_id: userProfile.id,
          is_read: false,
          created_at: new Date().toISOString()
        });

        setFollowStatus('pending');
        if (onFollowChange) onFollowChange('request');
      } else if (followStatus === 'pending') {
        const { error: deleteRequestError } = await supabase
          .from('follow_requests')
          .delete()
          .eq('requester_id', userProfile.id)
          .eq('recipient_id', targetUserId);

        if (deleteRequestError) throw deleteRequestError;

        setFollowStatus('notFollowing');
        if (onFollowChange) onFollowChange('cancelRequest');
      } else {
        const { error: followError } = await supabase
          .from('follow_relationships')
          .insert({
            follower_id: userProfile.id,
            following_id: targetUserId
          });

        if (followError) throw followError;

        await supabase.from('notifications').insert({
          user_id: targetUserId,
          sender_id: userProfile.id,
          type: 'follow',
          title: 'התחיל לעקוב אחריך',
          content: 'התחיל לעקוב אחריך',
          related_user_id: userProfile.id,
          is_read: false,
          created_at: new Date().toISOString()
        });

        setFollowStatus('following');
        if (onFollowChange) onFollowChange(true);
      }
    } catch (error) {
      console.error('שגיאה בעדכון מצב עקיבה:', error);
      setError('לא ניתן היה לעדכן את מצב העקיבה');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userProfile || userProfile.id === targetUserId) return null;

  const sizeClass = {
    sm: styles.small,
    md: styles.medium,
    lg: styles.large
  }[size] || styles.medium;

  return (
    <button
      className={`${styles.followButton} ${
        followStatus === 'following' ? styles.following :
        followStatus === 'pending' ? styles.pending :
        styles.notFollowing
      } ${sizeClass}`}
      onClick={handleFollowClick}
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? (
        <FaSpinner className={styles.loadingIcon} />
      ) : followStatus === 'following' ? (
        <>
          <FaUserCheck className={styles.icon} />
          <span>עוקב</span>
        </>
      ) : followStatus === 'pending' ? (
        <>
          <FaUserClock className={styles.icon} />
          <span>ממתין לאישור</span>
        </>
      ) : isPrivate ? (
        <>
          <FaLock className={styles.icon} />
          <span>בקש לעקוב</span>
        </>
      ) : (
        <>
          <FaUserPlus className={styles.icon} />
          <span>עקוב</span>
        </>
      )}

      {error && <div className={styles.errorTooltip}>{error}</div>}
    </button>
  );
};

export default FollowButton;
