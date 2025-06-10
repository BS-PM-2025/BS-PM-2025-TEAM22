// src/components/social/ProfileCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaMapMarkerAlt, FaDumbbell, FaUserFriends } from 'react-icons/fa';
import FollowButton from './FollowButton';
import styles from './styles/ProfileCard.module.css'; // צור קובץ CSS תואם

/**
 * כרטיס פרופיל מתומצת
 * 
 * @param {Object} props
 * @param {Object} props.user - אובייקט פרופיל המשתמש
 * @param {boolean} props.showFollowButton - האם להציג כפתור עקיבה
 */
function ProfileCard({ user, showFollowButton = true }) {
  if (!user) return null;

  const getFitnessLevelLabel = (level) => {
    switch (level) {
      case 'beginner': return 'מתחיל';
      case 'intermediate': return 'בינוני';
      case 'advanced': return 'מתקדם';
      default: return 'לא ידוע';
    }
  };

  return (
    <div className={styles.card}>
      <Link to={`/profile/${user.id}`} className={styles.avatar}>
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.name || 'משתמש'} />
        ) : (
          <div className={styles.avatarFallback}><FaUser /></div>
        )}
      </Link>

      <div className={styles.info}>
        <Link to={`/profile/${user.id}`} className={styles.name}>
          {user.name || 'משתמש'}
        </Link>

        {user.city && (
          <p className={styles.meta}><FaMapMarkerAlt /> {user.city}</p>
        )}

        {user.fitness_level && (
          <p className={styles.meta}><FaDumbbell /> {getFitnessLevelLabel(user.fitness_level)}</p>
        )}

        {typeof user.followers_count === 'number' && (
          <p className={styles.meta}><FaUserFriends /> {user.followers_count} עוקבים</p>
        )}
      </div>

      {showFollowButton && (
        <div className={styles.actions}>
          <FollowButton targetUserId={user.id} />
        </div>
      )}
    </div>
  );
}

export default ProfileCard;
