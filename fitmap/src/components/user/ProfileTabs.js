import React from 'react';
import { 
  FaChartLine, 
  FaDumbbell, 
  FaUsers,
  FaStar,
  FaComments,
  FaUserFriends,
  FaRss,
  FaBell,
  FaHeart
} from 'react-icons/fa';
import styles from './ProfileT.module.css';

function ProfileTabs({ activeTab, onTabChange, isOwner = false }) {
  return (
    <div className={styles.ProfileTabs}>
      <button 
        className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
        onClick={() => onTabChange('overview')}
      >
        <FaChartLine /> סקירה כללית
      </button>
      
      <button 
        className={`${styles.tabButton} ${activeTab === 'workouts' ? styles.activeTab : ''}`}
        onClick={() => onTabChange('workouts')}
      >
        <FaDumbbell /> אימונים
      </button>
    
      <button 
        className={`${styles.tabButton} ${activeTab === 'challenges' ? styles.activeTab : ''}`}
        onClick={() => onTabChange('challenges')}
      >
        <FaStar /> אתגרים
      </button>
      
      <button 
        className={`${styles.tabButton} ${activeTab === 'groups' ? styles.activeTab : ''}`}
        onClick={() => onTabChange('groups')}
      >
        <FaUsers /> אימונים קבוצתיים
      </button>
      
      {/* טאבים חברתיים חדשים */}
      <button 
        className={`${styles.tabButton} ${activeTab === 'feed' ? styles.activeTab : ''}`}
        onClick={() => onTabChange('feed')}
      >
        <FaRss /> פיד
      </button>
      
      <button 
        className={`${styles.tabButton} ${activeTab === 'followers' ? styles.activeTab : ''}`}
        onClick={() => onTabChange('followers')}
      >
        <FaUserFriends /> עוקבים
      </button>
      
      <button 
        className={`${styles.tabButton} ${activeTab === 'following' ? styles.activeTab : ''}`}
        onClick={() => onTabChange('following')}
      >
        <FaHeart /> נעקבים
      </button>
      
      {/* טאב צ'אטים מוצג רק לבעל הפרופיל */}
      {isOwner && (
        <button 
          className={`${styles.tabButton} ${activeTab === 'chats' ? styles.activeTab : ''}`}
          onClick={() => onTabChange('chats')}
        >
          <FaComments /> צ'אטים פעילים
        </button>
      )}
      
      {/* טאב התראות מוצג רק לבעל הפרופיל */}
      {isOwner && (
        <button 
          className={`${styles.tabButton} ${activeTab === 'notifications' ? styles.activeTab : ''}`}
          onClick={() => onTabChange('notifications')}
        >
          <FaBell /> התראות
        </button>
      )}
    </div>
  );
}

export default ProfileTabs;