// 7. קומפוננטת טאב אימונים (WorkoutsTab.js):

import React, { useState } from "react";
import WorkoutHistoryItem from "../../workouts/WorkoutHistoryItem";
import WorkoutCalendar from "../../workouts/WorkoutCalendar";
import { FaPlus } from "react-icons/fa";
import styles from "./Profile.module.css";
import AddWorkoutForm from "../../workouts/AddWorkoutForm";
import { useAuth } from "../../../hooks/useAuth";
function WorkoutsTab({ workoutHistory, loading, navigate, onAddWorkout }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const { userProfile } = useAuth();

  const addWorkout = async (workoutData) => {
    await onAddWorkout(workoutData);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className={styles.loadingData}>
        <div className={styles.loadingSpinner}></div>
        <p>טוען נתוני אימונים...</p>
      </div>
    );
  }

  return (
    <div className={styles.workoutsContent}>
      <div className={styles.sectionHeaderWithAction}>
        <h2 className={styles.sectionTitle}>היסטוריית אימונים</h2>

        {showAddForm && (
          <div className={styles.formOverlay}>
            <AddWorkoutForm
              onSubmit={addWorkout}
              onCancel={() => setShowAddForm(false)}
              userProfile={userProfile}
            />
          </div>
        )}
      </div>

      {workoutHistory.length === 0 ? (
        <div className={styles.emptyState}>
          <p>טרם הוספת אימונים למערכת</p>
          <button 
                className={styles.startButton}
                onClick={() => setShowAddForm(true)}
              >
                <FaPlus />
                הוסף אימון ראשון
              </button>
        </div>
      ) : (
        <>
          <div className={styles.calendarSection}>
            <h3 className={styles.subSectionTitle}>יומן אימונים</h3>
            <WorkoutCalendar workoutHistory={workoutHistory} />
          </div>

          <div className={styles.workoutsList}>
            <h3 className={styles.subSectionTitle}>רשימת אימונים</h3>
            {workoutHistory.map((workout) => (
              <WorkoutHistoryItem key={workout.id} workout={workout} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default WorkoutsTab;
