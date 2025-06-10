// src/components/challenges/ChallengeCard.js
import React, { useState } from "react";
import {
  FaUsers,
  FaCalendarAlt,
  FaTrophy,
  FaChartLine,
  FaMedal,
  FaInfoCircle,
  FaSignInAlt,
  FaSpinner,
  FaArrowRight,
  FaCheck,
  FaRegClock,
} from "react-icons/fa";
import UserProgressBar from "./UserProgressBar";
import styles from "./styles/ChallengeCard.module.css";

/**
 * כרטיס אתגר משודרג - מציג מידע בסיסי על אתגר ומאפשר מעבר לדף פרטים
 * @param {Object} challenge - אובייקט האתגר
 * @param {Object} userProgress - התקדמות המשתמש באתגר (אם קיימת)
 * @param {Function} onJoin - פונקציה להצטרפות לאתגר
 * @param {Function} onViewDetails - פונקציה למעבר לדף פרטי האתגר
 */
function ChallengeCard({ challenge, userProgress, onJoin, onViewDetails }) {
  const [isJoining, setIsJoining] = useState(false);
  const [expandProgress, setExpandProgress] = useState(false);
  const [showTooltip, setShowTooltip] = useState("");

  if (!challenge) return null;

  // האם המשתמש כבר משתתף באתגר
  const isParticipating = userProgress && userProgress.hasJoined;

  // האם האתגר פעיל (לא הסתיים ולא עתידי)
  const now = new Date();
  const startDate = new Date(challenge.start_date);
  const endDate = new Date(challenge.end_date);
  const isActive = now >= startDate && now <= endDate;
  const isFuture = now < startDate;
  const isCompleted = now > endDate;

  // חישוב ימים שנותרו לאתגר
  const getDaysRemaining = () => {
    if (isCompleted) return 0;

    const diffTime = endDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // פורמט תאריך לתצוגה
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  };

  // טיפול בהצטרפות לאתגר
  const handleJoin = async (e) => {
    e.stopPropagation();
    
    if (isFuture || isCompleted) return;

    try {
      setIsJoining(true);
      
      if (onJoin) {
        await onJoin(challenge.id);
      }
    } catch (error) {
      console.error("שגיאה בהצטרפות לאתגר:", error);
    } finally {
      setIsJoining(false);
    }
  };

  // קבלת אחוז ההשלמה
  const getCompletionPercent = () => {
    if (!isParticipating || !userProgress || !challenge.target_value) 
      return 0;
      
    return Math.min(
      Math.round((userProgress.current_value / challenge.target_value) * 100),
      100
    );
  };

  // הצגת טולטיפ
  const showInfoTooltip = (text, e) => {
    e.stopPropagation();
    setShowTooltip(text);
  };

  // הסתרת טולטיפ
  const hideTooltip = () => {
    setShowTooltip("");
  };

  // בדיקה אם האתגר הושלם על ידי המשתמש
  const isCompletedByUser = () => {
    return (
      isParticipating &&
      userProgress &&
      userProgress.current_value >= challenge.target_value
    );
  };

  // לוגיקה לקבלת מחלקת CSS לפי מצב האתגר
  const getChallengeStatusClass = () => {
    if (isCompletedByUser()) return styles.completedByUserChallenge;
    if (isCompleted) return styles.completedChallenge;
    if (isFuture) return styles.futureChallenge;
    if (isActive) return styles.activeChallenge;
    return "";
  };

  // מטריקה בפורמט קריא
  const formatMetric = () => {
    const target = challenge.target_value;
    
    switch (challenge.metric) {
      case "km":
        return `${target} ק"מ`;
      case "minutes":
        return `${target} דקות`;
      case "workouts":
        return `${target} אימונים`;
      case "steps":
        return `${target} צעדים`;
      case "calories":
        return `${target} קלוריות`;
      default:
        return `${target} ${challenge.metric}`;
    }
  };

  // חישוב זמן הנותר לתחילת האתגר
  const getTimeUntilStart = () => {
    if (!isFuture) return "";
    
    const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilStart <= 0) return "מתחיל היום";
    if (daysUntilStart === 1) return "מתחיל מחר";
    if (daysUntilStart < 7) return `מתחיל בעוד ${daysUntilStart} ימים`;
    
    const weeksUntilStart = Math.floor(daysUntilStart / 7);
    return `מתחיל בעוד ${weeksUntilStart} ${weeksUntilStart === 1 ? 'שבוע' : 'שבועות'}`;
  };

  return (
    <div
      className={`${styles.card} ${getChallengeStatusClass()}`}
      onClick={onViewDetails}
    >
      <div className={styles.cardHeader}>
        {challenge.image_url ? (
          <div
            className={styles.challengeImage}
            style={{ backgroundImage: `url(${challenge.image_url})` }}
          />
        ) : (
          <div className={styles.challengeImagePlaceholder}>
            <FaTrophy />
          </div>
        )}

        <div className={styles.challengeBadge}>
          {isFuture && (
            <span className={styles.futureBadge}>
              <FaRegClock /> {getTimeUntilStart()}
            </span>
          )}
          {isActive && (
            <span className={styles.activeBadge}>
              <FaChartLine /> פעיל
            </span>
          )}
          {isCompleted && (
            <span className={styles.completedBadge}>
              <FaCheck /> הסתיים
            </span>
          )}
          {isCompletedByUser() && (
            <span className={styles.completedByUserBadge}>
              <FaCheck /> הושלם
            </span>
          )}
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.challengeTitle}>{challenge.title}</h3>

        <div className={styles.challengeDetails}>
          <div className={styles.detailItem}>
            <FaCalendarAlt className={styles.detailIcon} />
            <span>
              {formatDate(challenge.start_date)} -{" "}
              {formatDate(challenge.end_date)}
            </span>
          </div>

          <div 
            className={styles.detailItem} 
            onMouseEnter={(e) => showInfoTooltip(`סה"כ ${challenge.participants_count} משתתפים באתגר זה`, e)}
            onMouseLeave={hideTooltip}
          >
            <FaUsers className={styles.detailIcon} />
            <span>{challenge.participants_count} משתתפים</span>
          </div>

          {isActive && (
            <div 
              className={styles.detailItem}
              onMouseEnter={(e) => showInfoTooltip(`נותרו ${getDaysRemaining()} ימים לסיום האתגר`, e)}
              onMouseLeave={hideTooltip}
            >
              <FaChartLine className={styles.detailIcon} />
              <span>נותרו {getDaysRemaining()} ימים</span>
            </div>
          )}

          {challenge.reward && (
            <div 
              className={styles.detailItem}
              onMouseEnter={(e) => showInfoTooltip(`השלם את האתגר לקבלת: ${challenge.reward}`, e)}
              onMouseLeave={hideTooltip}
            >
              <FaMedal className={styles.detailIcon} />
              <span>פרס: {challenge.reward}</span>
            </div>
          )}

          <div className={styles.targetValueBadge}>
            <FaTrophy className={styles.targetIcon} />
            <span>יעד: {formatMetric()}</span>
          </div>
        </div>

        <div className={styles.challengeDescription}>
          {challenge.description.length > 120
            ? `${challenge.description.substring(0, 120)}...`
            : challenge.description}
        </div>
      </div>

      {isParticipating && userProgress && (
        <div 
          className={`${styles.progressSection} ${expandProgress ? styles.expandedProgress : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setExpandProgress(!expandProgress);
          }}
        >
          <div className={styles.progressHeader}>
            <span>ההתקדמות שלך</span>
            <span className={styles.progressPercent}>{getCompletionPercent()}%</span>
          </div>
          <UserProgressBar
            currentValue={userProgress.current_value}
            targetValue={challenge.target_value}
            metric={challenge.metric}
            compact={!expandProgress}
          />
        </div>
      )}

      <div className={styles.cardActions}>
        <button 
          className={styles.detailsButton} 
          onClick={onViewDetails}
          aria-label="צפה בפרטים מלאים"
        >
          פרטים מלאים <FaArrowRight className={styles.buttonIcon} />
        </button>

        {!isCompleted && !isParticipating && (
          <button
            className={styles.joinButton}
            onClick={handleJoin}
            disabled={isFuture || isJoining}
            aria-label={isFuture ? "האתגר טרם התחיל" : "הצטרף לאתגר"}
          >
            {isJoining ? (
              <>
                <FaSpinner className={`${styles.buttonIcon} ${styles.spinnerIcon}`} />
                מצטרף...
              </>
            ) : isFuture ? (
              <>
                <FaRegClock className={styles.buttonIcon} />
                בקרוב
              </>
            ) : (
              <>
                <FaSignInAlt className={styles.buttonIcon} />
                הצטרף לאתגר
              </>
            )}
          </button>
        )}
      </div>

      {/* טולטיפ מידע */}
      {showTooltip && (
        <div className={styles.infoTooltip}>
          <FaInfoCircle className={styles.tooltipIcon} />
          {showTooltip}
        </div>
      )}
    </div>
  );
}

export default ChallengeCard;