
// 10. קומפוננטת טאב אימונים קבוצתיים (GroupWorkoutsTab.js):

import React from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaPlus } from 'react-icons/fa';
import styles from "./Profile.module.css";

function GroupWorkoutsTab({ groupWorkouts, loading, navigate, formatDateHebrew }) {
  if (loading) {
    return (
      <div className={styles.loadingData}>
        <div className={styles.loadingSpinner}></div>
        <p>טוען נתוני אימונים קבוצתיים...</p>
      </div>
    );
  }

  return (
    <div className={styles.groupsContent}>
      <div className={styles.sectionHeaderWithAction}>
        <h2 className={styles.sectionTitle}>אימונים קבוצתיים</h2>
        <button 
          className={styles.addButton}
          onClick={() => navigate('/group-workouts')}
        >
          <FaPlus /> צור אימון קבוצתי
        </button>
      </div>
      
      {groupWorkouts.length === 0 ? (
        <div className={styles.emptyState}>
          <p>אינך רשום לאימונים קבוצתיים כרגע</p>
          <button 
            className={styles.primaryButton}
            onClick={() => navigate('/group-workouts')}
          >
            מצא אימונים קבוצתיים
          </button>
        </div>
      ) : (
        <div className={styles.groupWorkoutsGrid}>
          {groupWorkouts.map(workout => (
            <div 
              className={styles.groupWorkoutCard} 
              key={workout.id} 
              onClick={() => navigate(`/group-workouts/${workout.id}`)}
            >
              <h3 className={styles.workoutTitle}>{workout.title}</h3>
              <div className={styles.workoutDetails}>
                <span className={styles.workoutDate}>
                  <FaCalendarAlt /> {formatDateHebrew(workout.start_time)}
                </span>
                <span className={styles.workoutTime}>
                  <FaClock /> {new Date(workout.start_time).toLocaleTimeString('he-IL', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span className={styles.workoutLocation}>
                  <FaMapMarkerAlt /> {workout.facility_name}
                </span>
                <span className={styles.workoutParticipants}>
                  <FaUsers /> {workout.participant_count || 0} משתתפים
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GroupWorkoutsTab;

