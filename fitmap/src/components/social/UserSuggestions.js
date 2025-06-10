// src/components/social/UserSuggestions.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFollow } from '../../hooks/useFollow';
import { supabase } from '../../utils/supabaseClient';
import FollowButton from './FollowButton';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaUserPlus, 
  FaChevronLeft, 
  FaChevronRight,
  FaSearch,
  FaArrowLeft 
} from 'react-icons/fa';
import styles from './styles/UserSuggestions.module.css';

const UserSuggestions = () => {
  const { userProfile } = useAuth();
  const { getSuggestedUsers } = useFollow();
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile?.user_id) {
      fetchSuggestedUsers();
    }
  }, [userProfile]);

  const fetchSuggestedUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const suggestions = await getSuggestedUsers(userProfile.user_id, 10);
      
      const usersWithFollowStatus = await Promise.all(
        suggestions.map(async (user) => {
          const { data: followData } = await supabase
            .from('follow_relationships')
            .select('id')
            .eq('follower_id', userProfile.user_id)
            .eq('following_id', user.id)
            .maybeSingle();
          
          return {
            ...user,
            isFollowing: !!followData
          };
        })
      );
      
      setSuggestedUsers(usersWithFollowStatus);
    } catch (err) {
      console.error('שגיאה בטעינת הצעות משתמשים:', err);
      setError('לא ניתן לטעון הצעות משתמשים');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < suggestedUsers.length - 3) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFollowChange = (userId, newFollowStatus) => {
    setSuggestedUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, isFollowing: newFollowStatus } : user
      )
    );
  };

  const handleExploreClick = () => {
    navigate('/explore');
  };

  if (!userProfile) return null;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>הצעות לעקיבה</h2>
        </div>
        <div className={styles.loading}>טוען הצעות...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>הצעות לעקיבה</h2>
        </div>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  const visibleUsers = suggestedUsers.slice(currentIndex, currentIndex + 3);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>הצעות לעקיבה</h2>
        <button 
          className={styles.exploreButton}
          onClick={handleExploreClick}
        >
          <FaSearch className={styles.searchIcon} />
          גלה עוד
          <FaArrowLeft className={styles.arrowIcon} />
        </button>
      </div>
      
      {suggestedUsers.length === 0 ? (
        <div className={styles.empty}>
          <p>אין הצעות כרגע</p>
          <button 
            className={styles.exploreLinkButton}
            onClick={handleExploreClick}
          >
            <FaSearch className={styles.buttonIcon} />
            גלה משתמשים חדשים
          </button>
        </div>
      ) : (
        <div className={styles.carousel}>
          {currentIndex > 0 && (
            <button onClick={handlePrev} className={styles.navButton}>
              <FaChevronLeft />
            </button>
          )}
          
          <div className={styles.usersContainer}>
            {visibleUsers.map(user => (
              <div key={user.id} className={styles.userCard}>
                <Link to={`/profile/${user.id}`} className={styles.userLink}>
                  <div className={styles.avatarContainer}>
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.name || 'משתמש'} 
                        className={styles.avatar}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        <FaUser />
                      </div>
                    )}
                  </div>
                  
                  <h3 className={styles.userName}>{user.name || 'משתמש'}</h3>
                  
                  {user.city && (
                    <p className={styles.userCity}>{user.city}</p>
                  )}
                  
                  {user.followers_count >= 0 && (
                    <p className={styles.followers}>
                      {user.followers_count} עוקבים
                    </p>
                  )}
                </Link>
                
                <div className={styles.buttonContainer}>
                  <FollowButton 
                    targetUserId={user.id}
                    onFollowChange={(isFollowing) => handleFollowChange(user.id, isFollowing)}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {currentIndex < suggestedUsers.length - 3 && (
            <button onClick={handleNext} className={styles.navButton}>
              <FaChevronRight />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSuggestions;