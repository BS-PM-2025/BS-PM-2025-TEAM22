// src/components/chat/TypingIndicator.js
import React from 'react';
import styles from './styles/TypingIndicator.module.css';

/**
 * רכיב אינדיקטור הקלדה - מציג חיווי כאשר המשתמש מקליד
 * 
 * @param {Object} props
 * @param {Object} props.user - אובייקט המשתמש המקליד
 */
const TypingIndicator = ({ user }) => {
  return (
    <div className={styles.typingContainer}>
      <div className={styles.dots}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p className={styles.typingText}>
        {user?.name || 'המשתמש'} מקליד...
      </p>
    </div>
  );
};

export default TypingIndicator;