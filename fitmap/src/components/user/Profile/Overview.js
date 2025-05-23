import React, { useEffect } from "react";
import StatCard from "../../workouts/StatCard";
import ProgressCharts from "../../workouts/ProgressCharts";
import WorkoutHistoryItem from "../../workouts/WorkoutHistoryItem";
import UserProgressBar from "../../challenges/UserProgressBar";
import {
  FaDumbbell,
  FaClock,
  FaFire,
  FaHeartbeat,
  FaRunning,
  FaMedal,
  FaTrophy,
  FaCalendarAlt
} from "react-icons/fa";
import styles from "./Profile.module.css";

function Overview({ userData, formatMinutes, navigate }) {
  const { stats, workoutHistory, challenges, loading } = userData;

  // בדיקה ויזואלית של הנתונים - נמחק בהמשך
  useEffect(() => {
    console.log("Overview mounted with userData:", {
      stats: stats,
      workoutHistoryLength: workoutHistory?.length || 0,
      challengesLength: challenges?.length || 0,
      loading
    });
  }, [stats, workoutHistory, challenges, loading]);

  // וידוא שיש ערכים תקינים בכל הסטטיסטיקות
  const safeStats = {
    totalWorkouts: Number(stats?.totalWorkouts || 0),
    totalMinutes: Number(stats?.totalMinutes || 0),
    totalCalories: Number(stats?.totalCalories || 0),
    favoriteWorkoutType: stats?.favoriteWorkoutType || "אין מספיק נתונים",
    currentStreak: Number(stats?.currentStreak || 0),
    longestStreak: Number(stats?.longestStreak || 0),
    completedChallenges: Number(stats?.completedChallenges || 0),
    achievementCount: Number(stats?.achievementCount || 0)
  };

  // אובייקט עזר לקביעת צבעים ואייקונים
  const cardConfigs = [
    {
      title: "סך הכל אימונים",
      value: safeStats.totalWorkouts,
      icon: <FaDumbbell />,
      color: "var(--primary)"
    },
    {
      title: "זמן אימון כולל",
      value: formatMinutes(safeStats.totalMinutes),
      icon: <FaClock />,
      color: "var(--energy)"
    },
    {
      title: "קלוריות שנשרפו",
      value: `${safeStats.totalCalories.toLocaleString()} קלוריות`,
      icon: <FaFire />,
      color: "var(--warning)"
    },
    {
      title: "סוג אימון מועדף",
      value: safeStats.favoriteWorkoutType,
      icon: <FaHeartbeat />,
      color: "var(--success)"
    },
    {
      title: "רצף אימונים נוכחי",
      value: `${safeStats.currentStreak} ימים`,
      icon: <FaRunning />,
      color: "var(--power)"
    },
    {
      title: "רצף אימונים הארוך ביותר",
      value: `${safeStats.longestStreak} ימים`,
      icon: <FaCalendarAlt />,
      color: "var(--primary-dark)"
    },
    {
      title: "אתגרים שהושלמו",
      value: safeStats.completedChallenges,
      icon: <FaTrophy />,
      color: "var(--accent)"
    },
    {
      title: "הישגים",
      value: safeStats.achievementCount,
      icon: <FaMedal />,
      color: "var(--secondary)"
    }
  ];

  if (loading) {
    return (
      <div className={styles.loadingData}>
        <div className={styles.loadingSpinner}></div>
        <p>טוען נתונים...</p>
      </div>
    );
  }

  // מניעת שגיאה אם אין סגנונות מוגדרים
  const defaultContainerClass = { 
    overviewContent: styles.overviewContent || 'overviewContent', 
    statsGrid: styles.statsGrid || 'statsGrid',
    chartsSection: styles.chartsSection || 'chartsSection',
    sectionTitle: styles.sectionTitle || 'sectionTitle',
    recentWorkoutsSection: styles.recentWorkoutsSection || 'recentWorkoutsSection',
    sectionHeader: styles.sectionHeader || 'sectionHeader',
    viewAllButton: styles.viewAllButton || 'viewAllButton',
    recentWorkoutsList: styles.recentWorkoutsList || 'recentWorkoutsList',
    activeChallengesSection: styles.activeChallengesSection || 'activeChallengesSection',
    challengesProgress: styles.challengesProgress || 'challengesProgress',
    challengeProgressItem: styles.challengeProgressItem || 'challengeProgressItem',
    challengeTitle: styles.challengeTitle || 'challengeTitle',
    emptyState: styles.emptyState || 'emptyState'
  };

  return (
    <div className={defaultContainerClass.overviewContent}>
      {/* כרטיסיות סטטיסטיקה */}
      <div className={defaultContainerClass.statsGrid}>
        {cardConfigs.map((card, index) => (
          <StatCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
          />
        ))}
      </div>

      {/* גרפים - רק אם יש מספיק נתונים */}
      {workoutHistory && workoutHistory.length > 1 && (
        <div className={defaultContainerClass.chartsSection}>
          <h2 className={defaultContainerClass.sectionTitle}>נתוני התקדמות</h2>
          <ProgressCharts workoutHistory={workoutHistory} />
        </div>
      )}

      {/* אימונים אחרונים */}
      {workoutHistory && workoutHistory.length > 0 && (
        <div className={defaultContainerClass.recentWorkoutsSection}>
          <div className={defaultContainerClass.sectionHeader}>
            <h2 className={defaultContainerClass.sectionTitle}>אימונים אחרונים</h2>
            <button
              className={defaultContainerClass.viewAllButton}
              onClick={() => navigate("/workouts")}
            >
              הצג הכל
            </button>
          </div>
          <div className={defaultContainerClass.recentWorkoutsList}>
            {workoutHistory.slice(0, 3).map((workout) => (
              <WorkoutHistoryItem 
                key={workout.id} 
                workout={workout} 
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* אתגרים פעילים */}
      {challenges && challenges.length > 0 && (
        <div className={defaultContainerClass.activeChallengesSection}>
          <div className={defaultContainerClass.sectionHeader}>
            <h2 className={defaultContainerClass.sectionTitle}>אתגרים פעילים</h2>
            <button
              className={defaultContainerClass.viewAllButton}
              onClick={() => navigate("/challenges")}
            >
              הצג הכל
            </button>
          </div>
          <div className={defaultContainerClass.challengesProgress}>
            {challenges.slice(0, 2).map((challenge) => {
              // חישוב מחדש של ערכי current_value ו-target_value כמספרים
              const currentValue = parseFloat(challenge.current_value) || 0;
              const targetValue = parseFloat(challenge.target_value) || 100;
              
              return (
                <div className={defaultContainerClass.challengeProgressItem} key={challenge.id}>
                  <h3 className={defaultContainerClass.challengeTitle}>{challenge.title || challenge.name}</h3>
                  <UserProgressBar
                    currentValue={currentValue}
                    targetValue={targetValue}
                    metric={challenge.metric}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* מצב ריק - אין נתונים */}
      {(!workoutHistory || workoutHistory.length === 0) && (
        <div className={defaultContainerClass.emptyState}>
          <p>אין היסטוריית אימונים להצגה</p>
        </div>
      )}
    </div>
  );
}

export default Overview;