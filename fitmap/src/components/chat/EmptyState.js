// src/components/chat/EmptyState.js
import React from 'react';
import { FaComments, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import styles from './styles/EmptyState.module.css';

/**
 * רכיב מצב ריק - מציג הודעות מצב שונות כאשר אין תוכן בצ'אט
 * 
 * @param {Object} props
 * @param {string} props.type - סוג המצב הריק ('no-chats', 'empty-chat', 'no-results', 'error')
 * @param {string} props.userName - שם המשתמש (עבור empty-chat)
 * @param {Function} props.onAction - פונקציה שתפעל בלחיצה על כפתור פעולה
 */
const EmptyState = ({ type, userName, onAction }) => {
  switch (type) {
    case 'no-chats':
      return (
        <div className={styles.container}>
          <FaComments className={styles.icon} />
          <h3>אין שיחות עדיין</h3>
          <p>התחל שיחה חדשה עם משתמשים אחרים</p>
          <button className={styles.actionButton} onClick={onAction}>
            התחל שיחה חדשה
          </button>
        </div>
      );
    case 'empty-chat':
      return (
        <div className={styles.container}>
          <div className={styles.iconContainer}>
            <FaComments className={styles.icon} />
          </div>
          <h3>{userName ? `שיחה עם ${userName}` : 'שיחה חדשה'}</h3>
          <p>אין הודעות עדיין. שלח הודעה כדי להתחיל את השיחה.</p>
        </div>
      );
    case 'no-results':
      return (
        <div className={styles.container}>
          <FaSearch className={styles.icon} />
          <h3>לא נמצאו תוצאות</h3>
          <p>נסה לשנות את מונחי החיפוש שלך</p>
          <button className={styles.actionButton} onClick={onAction}>
            נקה חיפוש
          </button>
        </div>
      );
    case 'error':
      return (
        <div className={styles.container}>
          <FaExclamationTriangle className={styles.iconError} />
          <h3>שגיאה</h3>
          <p>אירעה שגיאה בטעינת הנתונים</p>
          <button className={styles.actionButton} onClick={onAction}>
            נסה שנית
          </button>
        </div>
      );
    default:
      return null;
  }
};

export default EmptyState;