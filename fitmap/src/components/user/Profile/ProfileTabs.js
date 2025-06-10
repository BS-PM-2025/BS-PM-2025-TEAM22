// src/components/profile/ProfileTabs.js
import React from "react";
import {
  FaChartLine,
  FaDumbbell,
  FaUsers,
  FaStar,
  FaComments,
  FaBell,
} from "react-icons/fa";
import styles from "./ProfileT.module.css"; // ודא שהשם תואם לקובץ שלך

/**
 * סרגל טאבים של פרופיל המשתמש
 * @param {string} activeTab - הטאב הפעיל כרגע
 * @param {function} onTabChange - פונקציה לשינוי הטאב
 * @param {boolean} isOwner - האם זה הפרופיל של המשתמש הנוכחי
 */
function ProfileTabs({ activeTab, onTabChange, isOwner = false }) {
  console.log("isOwner?", isOwner);

  const tabs = [
    { key: "overview", label: "סקירה כללית", icon: <FaChartLine /> },
    { key: "workouts", label: "אימונים", icon: <FaDumbbell /> },
    { key: "challenges", label: "אתגרים", icon: <FaStar /> },
    { key: "groups", label: "אימונים קבוצתיים", icon: <FaUsers /> },
  ];

  if (isOwner) {
    tabs.push(
      { key: "chats", label: "צ'אטים פעילים", icon: <FaComments /> },
      { key: "notifications", label: "התראות", icon: <FaBell /> }
    );
  }

  return (
    <div className={styles.ProfileTabs}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`${styles.tabButton} ${
            activeTab === tab.key ? styles.activeTab : ""
          }`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}

export default ProfileTabs;
