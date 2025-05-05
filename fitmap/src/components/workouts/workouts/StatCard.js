// StatCard.js - קובץ שנוצר כבסיס
// src/components/workouts/StatCard.js
import React from 'react';
import styles from './styles/StatCard.module.css';

/**
 * כרטיס סטטיסטיקה - מציג נתון בודד עם כותרת ואייקון
 * @param {string} title - כותרת הסטטיסטיקה
 * @param {string|number} value - ערך הסטטיסטיקה
 * @param {React.ReactNode} icon - אייקון להצגה
 * @param {string} color - צבע האייקון (ברירת מחדל: primary)
 */
function StatCard({ title, value, icon, color = 'var(--primary)' }) {
  return (
    <div className={styles.statCard}>
      <div 
        className={styles.iconContainer}
        style={{ backgroundColor: `${color}20`, color: color }}
      >
        {icon}
      </div>
      <div className={styles.statContent}>
        <h3 className={styles.statTitle}>{title}</h3>
        <div className={styles.statValue}>{value}</div>
      </div>
    </div>
  );
}

export default StatCard;