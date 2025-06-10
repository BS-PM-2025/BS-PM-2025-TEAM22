// src/components/social/NotificationsList.js
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaUserPlus, FaHeart, FaComment, FaTrophy, FaBell, FaEnvelope
} from 'react-icons/fa';
import styles from './styles/NotificationsList.module.css';

function NotificationsList({ notifications = [], onMarkAsRead }) {
  const renderIcon = (type) => {
    switch (type) {
      case 'follow': return <FaUserPlus />;
      case 'like': return <FaHeart />;
      case 'comment': return <FaComment />;
      case 'challenge_complete': return <FaTrophy />;
      case 'new_message': return <FaEnvelope />;
      default: return <FaBell />;
    }
  };

  const getIconBackground = (type) => {
    switch (type) {
      case 'follow': return 'var(--primary)';
      case 'like': return '#ff4757';
      case 'comment': return '#3498db';
      case 'challenge_complete': return '#f39c12';
      case 'new_message': return '#1abc9c';
      default: return 'var(--primary)';
    }
  };

  const getLink = (n) => {
    switch (n.type) {
      case 'follow':
        return `/profile/${n.sender_id}`;
      case 'like':
      case 'comment':
        return n.related_post_id ? `/posts/${n.related_post_id}` : '#';
      case 'challenge_complete':
        return n.challenge_id ? `/challenges/${n.challenge_id}` : '#'; // ודא שקיימת עמודה כזו
      case 'new_message':
        return `/chat/${n.related_user_id || n.sender_id}`;
      default:
        return '#';
    }
  };
  

  const renderMessage = (n) => {
    const name = n.sender?.name || 'משתמש';
    switch (n.type) {
      case 'follow': return `${name} התחיל לעקוב אחריך`;
      case 'like': return `${name} אהב את הפוסט שלך`;
      case 'comment': return `${name} הגיב על הפוסט שלך`;
      case 'challenge_complete': return `${name} השלים אתגר!`;
      case 'new_message': return n.content || `${name} שלח לך הודעה חדשה`;
      default: return n.content || 'יש לך התראה חדשה';
    }
  };

  const formatTimeAgo = (isoTime) => {
    const diff = (Date.now() - new Date(isoTime)) / 1000;
    if (diff < 60) return 'הרגע';
    if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דקות`;
    if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שעות`;
    return new Date(isoTime).toLocaleDateString('he-IL');
  };

  if (notifications.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIconWrapper}>
          <FaBell className={styles.emptyIcon} />
        </div>
        <p className={styles.emptyTitle}>אין התראות חדשות</p>
        <p className={styles.emptyDescription}>תהיה הראשון לקבל התראות על אינטראקציות חדשות</p>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {notifications.map((n) => (
        <li 
          key={n.id} 
          className={`${styles.item} ${!n.is_read ? styles.unread : ''}`}
        >
          <Link to={getLink(n)} className={styles.link}>
            <div 
              className={styles.iconWrapper}
              style={{ backgroundColor: getIconBackground(n.type) }}
            >
              {renderIcon(n.type)}
            </div>
            <div className={styles.content}>
              <p className={styles.message}>{renderMessage(n)}</p>
              <div className={styles.footer}>
                <time className={styles.time}>{formatTimeAgo(n.created_at)}</time>
                {!n.is_read && <span className={styles.dot} />}
              </div>
            </div>
          </Link>
          {!n.is_read && onMarkAsRead && (
            <button
              className={styles.markRead}
              onClick={() => onMarkAsRead(n.id)}
              aria-label="סמן כנקרא"
            >
              <span className={styles.checkmark}>✓</span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export default NotificationsList;