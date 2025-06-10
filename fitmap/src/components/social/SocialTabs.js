// src/components/social/SocialTabs.js
import React from 'react';
import { FaHome, FaUserPlus, FaBell, FaRunning } from 'react-icons/fa';
import styles from './styles/SocialTabs.module.css';

/**
 * טאבים חברתיים לפיד המשתמש
 * 
 * @param {Object} props
 * @param {string} props.activeTab - הטאב הפעיל: 'feed' | 'suggestions' | 'notifications' | 'activity'
 * @param {Function} props.onTabChange - פונקציה לשינוי הטאב
 */
function SocialTabs({ activeTab = 'feed', onTabChange }) {
  return (
    <nav className={styles.socialTabs}>
      <button
        className={`${styles.tabButton} ${activeTab === 'feed' ? styles.active : ''}`}
        onClick={() => onTabChange('feed')}
        aria-label="פיד חברתי"
      >
        <FaHome />
        <span>פיד</span>
      </button>

      <button
        className={`${styles.tabButton} ${activeTab === 'suggestions' ? styles.active : ''}`}
        onClick={() => onTabChange('suggestions')}
        aria-label="המלצות לעקיבה"
      >
        <FaUserPlus />
        <span>הצעות</span>
      </button>

      <button
        className={`${styles.tabButton} ${activeTab === 'notifications' ? styles.active : ''}`}
        onClick={() => onTabChange('notifications')}
        aria-label="התראות"
      >
        <FaBell />
        <span>התראות</span>
      </button>

      <button
  className={`${styles.tabButton} ${activeTab === 'activities' ? styles.active : ''}`}
  onClick={() => onTabChange('activities')}
  aria-label="פיד פעילויות"
>
  <FaRunning />
  <span>פעילויות</span>
</button>
    </nav>
  );
}

export default SocialTabs;
