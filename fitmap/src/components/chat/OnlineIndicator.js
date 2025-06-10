// src/components/chat/OnlineIndicator.js
import React, { useEffect } from 'react';
import { FaCircle } from 'react-icons/fa';
import { useOnlineStatus } from '../../contexts/OnlineStatusContext';
import styles from './styles/OnlineIndicator.module.css';

/**
 * רכיב להצגת מצב מקוון של משתמש
 * 
 * @param {Object} props
 * @param {string} props.userId - מזהה המשתמש לבדיקה
 * @param {boolean} props.showLabel - האם להציג טקסט לצד האייקון
 */
const OnlineIndicator = ({ userId, showLabel = false }) => {
  const { onlineUsers, checkUserStatus } = useOnlineStatus();
  
  useEffect(() => {
    if (userId) {
      checkUserStatus(userId);
    }
  }, [userId, checkUserStatus]);

  // קבלת נתוני הסטטוס
  const userStatus = onlineUsers[userId] || { isOnline: false };
  const isOnline = userStatus.isOnline;

  return (
    <div className={styles.indicatorContainer}>
      <FaCircle className={`${styles.indicator} ${isOnline ? styles.online : styles.offline}`} />
      {showLabel && (
        <span className={styles.label}>
          {isOnline ? 'מקוון' : 'לא מקוון'}
        </span>
      )}
    </div>
  );
};

export default OnlineIndicator;