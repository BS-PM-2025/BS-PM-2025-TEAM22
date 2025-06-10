// src/components/challenges/AchievementBadge.js
import React, { useState, useEffect } from "react";
import {
  FaTrophy,
  FaMedal,
  FaRunning,
  FaDumbbell,
  FaFire,
  FaStar,
  FaCalendarAlt,
  FaClock,
  FaHeartbeat,
  FaAward,
  FaLock,
  FaInfo,
} from "react-icons/fa";
import styles from "./styles/AchievementBadge.module.css";

/**
 * רכיב תג הישג משודרג - מציג הישג או תגית שהמשתמש קיבל
 * @param {Object} achievement - אובייקט ההישג
 * @param {Boolean} isLocked - האם ההישג נעול (לא הושג עדיין)
 * @param {Boolean} isSmall - האם להציג בגודל קטן
 * @param {Function} onClick - פונקציה שתופעל בלחיצה על התג
 * @param {Boolean} showAnimation - האם להציג אנימציה של הישג חדש
 */
function AchievementBadge({
  achievement,
  isLocked = false,
  isSmall = false,
  onClick,
  showAnimation = false,
}) {
  const [animateShimmer, setAnimateShimmer] = useState(showAnimation);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setAnimateShimmer(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showAnimation]);

  if (!achievement) return null;

  // בחירת אייקון בהתאם לקטגוריה
  const getIconComponent = () => {
    const category = achievement.category || "";

    switch (category.toLowerCase()) {
      case "workout":
      case "workouts":
        return <FaDumbbell />;
      case "running":
      case "distance":
        return <FaRunning />;
      case "streak":
      case "consistency":
        return <FaCalendarAlt />;
      case "duration":
      case "time":
        return <FaClock />;
      case "challenge":
      case "challenges":
        return <FaTrophy />;
      case "first":
      case "welcome":
        return <FaStar />;
      case "cardio":
      case "heart":
        return <FaHeartbeat />;
      case "calories":
      case "burn":
        return <FaFire />;
      case "level":
      case "rank":
        return <FaAward />;
      default:
        return <FaMedal />;
    }
  };

  // קביעת צבע לפי רמת ההישג
  const getLevelColor = () => {
    const level = achievement.level || "bronze";

    switch (level.toLowerCase()) {
      case "bronze":
        return "#cd7f32";
      case "silver":
        return "#c0c0c0";
      case "gold":
        return "#ffd700";
      case "platinum":
        return "#e5e4e2";
      case "diamond":
        return "#b9f2ff";
      default:
        return "#0070f3";
    }
  };

  // פורמט תאריך לתצוגה (אם קיים)
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  };

  // תרגום רמת ההישג לעברית
  const translateLevel = (level) => {
    const levelTranslations = {
      bronze: "ארד",
      silver: "כסף",
      gold: "זהב",
      platinum: "פלטינה",
      diamond: "יהלום",
    };
    
    return levelTranslations[level.toLowerCase()] || level;
  };

  // טיפול בלחיצה על התג
  const handleBadgeClick = (e) => {
    if (isSmall) {
      setShowDetails(true);
    }
    
    if (onClick) {
      onClick(achievement);
    }
  };

  // סגירת חלונית פרטים (למצב קטן)
  const handleCloseDetails = (e) => {
    e.stopPropagation();
    setShowDetails(false);
  };

  const badgeColor = getLevelColor();

  return (
    <>
      <div
        className={`
          ${styles.badge} 
          ${isLocked ? styles.lockedBadge : ""} 
          ${isSmall ? styles.smallBadge : ""}
          ${animateShimmer ? styles.animateShimmer : ""}
        `}
        onClick={handleBadgeClick}
        style={{
          "--badge-color": isLocked ? "#a0a0a0" : badgeColor,
        }}
        role="button"
        tabIndex={0}
        aria-label={`הישג: ${achievement.title}${isLocked ? " (נעול)" : ""}`}
      >
        <div className={styles.badgeIcon}>
          {getIconComponent()}
          {isLocked && <div className={styles.lockOverlay}><FaLock /></div>}
        </div>

        {!isSmall && (
          <div className={styles.badgeContent}>
            <div className={styles.badgeHeader}>
              <h3 className={styles.badgeTitle}>{achievement.title}</h3>
              <span className={styles.badgeLevel}>{translateLevel(achievement.level)}</span>
            </div>

            {!isLocked && achievement.earned_date && (
              <div className={styles.earnedDate}>
                הושג ב-{formatDate(achievement.earned_date)}
              </div>
            )}

            <p className={styles.badgeDescription}>
              {isLocked 
                ? achievement.description 
                  ? `השלם ${achievement.description} כדי לפתוח`
                  : "השלם את האתגר כדי לפתוח"
                : achievement.description}
            </p>

            {achievement.required_value && (
              <div className={styles.progressInfo}>
                <span>נדרש: {achievement.required_value}</span>
                {!isLocked && (
                  <div className={styles.completedBadge}>הושלם</div>
                )}
              </div>
            )}
          </div>
        )}

        {isSmall && !isLocked && (
          <div className={styles.smallBadgeTooltip}>
            <span>{achievement.title}</span>
          </div>
        )}
        
        {isSmall && isLocked && (
          <div className={styles.smallBadgeInfoButton}>
            <FaInfo />
          </div>
        )}
      </div>

      {/* חלונית פרטים למצב קטן */}
      {isSmall && showDetails && (
        <div className={styles.badgeDetailsModal}>
          <div className={styles.badgeDetailsContent}>
            <button 
              className={styles.closeDetailsButton}
              onClick={handleCloseDetails}
              aria-label="סגור פרטים"
            >
              &times;
            </button>

            <div className={styles.detailsIconContainer} style={{ backgroundColor: badgeColor }}>
              {getIconComponent()}
            </div>

            <h3 className={styles.detailsTitle}>{achievement.title}</h3>
            <div className={styles.detailsLevel}>{translateLevel(achievement.level)}</div>

            {!isLocked && achievement.earned_date && (
              <div className={styles.detailsEarnedDate}>
                הושג ב-{formatDate(achievement.earned_date)}
              </div>
            )}

            <p className={styles.detailsDescription}>
              {isLocked 
                ? `השלם ${achievement.description || "את האתגר"} כדי לפתוח`
                : achievement.description}
            </p>

            {achievement.required_value && (
              <div className={styles.detailsProgressInfo}>
                <span>יעד להשלמה: {achievement.required_value}</span>
                {!isLocked && (
                  <div className={styles.detailsCompletedBadge}>הושלם</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default AchievementBadge;