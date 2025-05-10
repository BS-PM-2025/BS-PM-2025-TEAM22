import React, { useEffect, useState } from 'react';
import UserProgressBar from '../../challenges/UserProgressBar';
import { FaCalendarAlt, FaTrophy, FaRunning, FaCalendar, FaStar, FaDumbbell } from 'react-icons/fa';
import styles from "./Profile.module.css";

function ChallengesTab({ challenges, loading, navigate, formatDateHebrew }) {
  const [processedChallenges, setProcessedChallenges] = useState([]);
  
  // Process challenges to ensure all required properties exist
  useEffect(() => {
    if (!challenges) return;
    
    console.log("Original challenges data:", challenges);
    
    const processed = challenges.map(challenge => {
      // המרה מפורשת למספרים
      const currentValue = parseFloat(challenge.current_value) || 0;
      const targetValue = parseFloat(challenge.target_value) || 100;
      
      // חישוב התקדמות מחדש - כך שנהיה בטוחים שהיא מחושבת נכון
      const progress = targetValue > 0 ? Math.min(100, Math.round((currentValue / targetValue) * 100)) : 0;
      
      return {
        ...challenge,
        current_value: currentValue,
        target_value: targetValue,
        progress: progress,
        // וידוא שכל השדות קיימים עם ערכי ברירת מחדל
        name: challenge.name || challenge.title || "אתגר",
        description: challenge.description || "",
        icon: challenge.icon || "trophy",
        reward_points: Number(challenge.reward_points) || 0
      };
    });
    
    console.log("Processed challenges data:", processed);
    setProcessedChallenges(processed);
  }, [challenges]);

  if (loading) {
    return (
      <div className={styles.loadingData}>
        <div className={styles.loadingSpinner}></div>
        <p>טוען נתוני אתגרים...</p>
      </div>
    );
  }
  
  // Helper function to get the appropriate icon for a challenge
  const getChallengeIcon = (iconName) => {
    switch(iconName) {
      case 'trophy': return <FaTrophy className={styles.challengeIcon} />;
      case 'running': return <FaRunning className={styles.challengeIcon} />;
      case 'calendar': return <FaCalendar className={styles.challengeIcon} />;
      case 'dumbbell': return <FaDumbbell className={styles.challengeIcon} />;
      default: return <FaStar className={styles.challengeIcon} />;
    }
  };

  return (
    <div className={styles.challengesContent}>
      <div className={styles.sectionHeaderWithAction}>
        <h2 className={styles.sectionTitle}>אתגרים שלי</h2>
        <button 
          className={styles.viewAllButton}
          onClick={() => navigate('/challenges')}
        >
          גלה עוד אתגרים
        </button>
      </div>
      
      {processedChallenges.length === 0 ? (
        <div className={styles.emptyState}>
          <p>אינך משתתף באתגרים כרגע</p>
          <button 
            className={styles.primaryButton}
            onClick={() => navigate('/challenges')}
          >
            הצטרף לאתגר
          </button>
        </div>
      ) : (
        <div className={styles.challengesList}>
          {processedChallenges.map(challenge => (
            <div className={styles.challengeItem} key={challenge.id}>
              <div className={styles.challengeHeader}>
                <div className={styles.challengeTitleWrapper}>
                  {getChallengeIcon(challenge.icon)}
                  <h3 className={styles.challengeTitle}>
                    {challenge.name}
                  </h3>
                </div>
                <button 
                  className={styles.viewDetailsButton}
                  onClick={() => navigate(`/challenges/${challenge.id}`)}
                >
                  צפה בפרטים
                </button>
              </div>
              
              <p className={styles.challengeDescription}>{challenge.description}</p>
              
              {/* Progress display - with fixed values */}
              <div className={styles.progressSection}>
                <UserProgressBar 
                  currentValue={challenge.current_value}
                  targetValue={challenge.target_value}
                  metric={challenge.metric}
                />
              </div>
              
              {(challenge.start_date || challenge.end_date) && (
                <div className={styles.challengeDates}>
                  {challenge.start_date && (
                    <span className={styles.startDate}>
                      <FaCalendarAlt className={styles.dateIcon} /> התחלה: {formatDateHebrew(challenge.start_date)}
                    </span>
                  )}
                  {challenge.end_date && (
                    <span className={styles.endDate}>
                      <FaCalendarAlt className={styles.dateIcon} /> סיום: {formatDateHebrew(challenge.end_date)}
                    </span>
                  )}
                </div>
              )}
              
              {challenge.reward_points > 0 && (
                <div className={styles.rewardPoints}>
                  <FaTrophy className={styles.rewardIcon} />
                  <span>{challenge.reward_points} נקודות</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChallengesTab;