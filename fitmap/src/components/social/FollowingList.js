// FollowingList.js - דף להצגת רשימת המשתמשים שמשתמש עוקב אחריהם
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaSpinner, FaExclamationTriangle, FaArrowRight } from 'react-icons/fa';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import UserProfileMini from '../../pages/UserProfile';
import UserFollowButton from './FollowButton';

function FollowingList() {
  const { userId } = useParams();
  const { userProfile } = useAuth();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetchFollowing = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        // שליפת שם המשתמש
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', userId)
          .single();

        if (userError) throw userError;
        if (userData) setUsername(userData.name);

        // שליפת רשימת המשתמשים שעוקב אחריהם
        const { data, error: followingError } = await supabase
          .from('follow_relationships')
          .select(`
            following_id,
            following:following_id (
              id,
              name,
              avatar_url
            )
          `)
          .eq('follower_id', userId);

        if (followingError) throw followingError;

        const formattedFollowing = data?.map(item => item.following) || [];
        setFollowing(formattedFollowing);
      } catch (err) {
        console.error('שגיאה בטעינת רשימת אנשים שעוקב אחריהם:', err);
        setError('אירעה שגיאה בטעינת הרשימה');
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [userId]);

  // פונקציה שמתעדכנת כשמשתמש עוקב או מבטל עקיבה
  const handleFollowChange = (followedUserId, isFollowing) => {
    if (!isFollowing && userProfile?.user_id === userId) {
      setFollowing(prev => prev.filter(user => user.id !== followedUserId));
    }
  };

  return (
    <div className="following-list-container">
      <h2 className="following-title">
        {username ? `המשתמשים ש-${username} עוקב אחריהם:` : 'רשימת עקיבות'}
      </h2>

      {loading && (
        <div className="loading-state">
          <FaSpinner className="spinner-icon" />
          <span>טוען רשימה...</span>
        </div>
      )}

      {error && (
        <div className="error-state">
          <FaExclamationTriangle className="error-icon" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && following.length === 0 && (
        <div className="empty-state">
          <p>לא נמצאו משתמשים שהמשתמש עוקב אחריהם.</p>
          {userProfile?.user_id === userId && (
            <Link to="/explore" className="explore-link">
              <FaArrowRight /> גלה משתמשים חדשים
            </Link>
          )}
        </div>
      )}

      <div className="users-list">
        {following.map(user => (
          <div key={user.id} className="user-card">
            <UserProfileMini user={user} />
            {userProfile && (
              <UserFollowButton
                targetUserId={user.id}
                onFollowChange={handleFollowChange}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FollowingList;