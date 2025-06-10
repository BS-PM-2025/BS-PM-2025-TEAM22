// src/components/workouts/WorkoutPlan.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaStopwatch, FaDumbbell, FaAngleDown, FaAngleUp, FaPlayCircle } from 'react-icons/fa';
import styles from './styles/WorkoutPlan.module.css';

/**
 * קומפוננטת תצוגת תוכנית אימון שנוצרה
 * @param {Object} workout - אובייקט האימון הכולל את כל הפרטים
 * @param {string} facilityId - מזהה המתקן
 */

function WorkoutPlan({ workout, facilityId }) {
  const [openExerciseId, setOpenExerciseId] = useState(null);
  const [isWarmupOpen, setIsWarmupOpen] = useState(false);
  const [isStretchOpen, setIsStretchOpen] = useState(false);

  if (!workout) {
    return (
      <div className={styles.errorMessage}>
        לא נמצאה תוכנית אימון
      </div>
    );
  }
  
  const warmupExercises = [
    { 
      name: 'ריצה קלה במקום', 
      duration: '2 דקות',
      description: 'רוץ במקום בקצב קל כדי להגביר את זרימת הדם'
    },
    { 
      name: 'סיבובי כתפיים', 
      duration: '30 שניות',
      description: 'סיבובים עדינים קדימה ואחורה'
    },
    { 
      name: 'סיבובי ירכיים', 
      duration: '30 שניות לכל צד',
      description: 'סיבובים רחבים של המפרק'
    },
    { 
      name: 'ג׳אמפינג ג׳ק', 
      duration: '1 דקה',
      description: 'קפיצות עם פישוק רגליים והרמת ידיים'
    }
  ];
  
  const stretchExercises = [
    { 
      name: 'מתיחת חזה', 
      duration: '30 שניות',
      description: 'שלב את ידיך מאחורי גבך ומשוך את הכתפיים לאחור'
    },
    { 
      name: 'מתיחת כתף', 
      duration: '30 שניות לכל צד',
      description: 'משוך את היד לרוחב החזה ולחץ עם היד השנייה'
    },
    { 
      name: 'מתיחת ארבע ראשי', 
      duration: '30 שניות לכל צד',
      description: 'תפוס את כף הרגל ומשוך לכיוון הישבן'
    },
    { 
      name: 'מתיחת דו ראשי שוקי', 
      duration: '30 שניות לכל צד',
      description: 'הצב רגל אחת לפנים והרגל השנייה ישרה לאחור, דחוף את העקב לרצפה'
    }
  ];

  const toggleExercise = (id) => {
    setOpenExerciseId(openExerciseId === id ? null : id);
  };

  const getIntensityText = (intensity) => {
    switch(intensity) {
      case 'low': return 'קלה';
      case 'medium': return 'בינונית';
      case 'high': return 'גבוהה';
      default: return intensity;
    }
  };

  const getGoalText = (goal) => {
    switch(goal) {
      case 'strength': return 'חיזוק';
      case 'cardio': return 'סיבולת';
      case 'flexibility': return 'גמישות';
      default: return goal;
    }
  };

  return (
    <div className={styles.workoutPlanContainer}>
      <div className={styles.workoutHeader}>
        <h2>{workout.name}</h2>
        <div className={styles.workoutMetrics}>
          <div className={styles.metric}>
            <FaStopwatch className={styles.metricIcon} />
            <span>{workout.duration} דקות</span>
          </div>
          <div className={styles.metric}>
            <FaDumbbell className={styles.metricIcon} />
            <span>עצימות {getIntensityText(workout.intensity)}</span>
          </div>
          <div className={styles.metric}>
            <i className="fas fa-bullseye"></i>
            <span>מטרה: {getGoalText(workout.goal)}</span>
          </div>
        </div>
      </div>

      {/* חימום */}
      <div className={styles.workoutSection}>
        <div 
          className={styles.sectionHeader} 
          onClick={() => setIsWarmupOpen(!isWarmupOpen)}
        >
          <h3>חימום</h3>
          <button className={styles.toggleButton}>
            {isWarmupOpen ? <FaAngleUp /> : <FaAngleDown />}
          </button>
        </div>
        
        {isWarmupOpen && (
          <div className={styles.sectionContent}>
            <div className={styles.warmupExercises}>
              {warmupExercises.map((exercise, index) => (
                <div key={index} className={styles.warmupExercise}>
                  <div className={styles.warmupExerciseName}>
                    <span>{exercise.name}</span>
                    <span className={styles.warmupDuration}>{exercise.duration}</span>
                  </div>
                  <div className={styles.warmupExerciseDescription}>
                    {exercise.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* תרגילים עיקריים */}
      <div className={styles.workoutSection}>
        <div className={styles.sectionHeader}>
          <h3>תרגילים עיקריים</h3>
        </div>
        <div className={styles.exercisesList}>
          {workout.exercises.map((exercise, index) => (
            <div key={exercise.id} className={styles.exerciseItem}>
              <div className={styles.exerciseHeader}>
                <div className={styles.exerciseIndex}>{index + 1}</div>
                <div className={styles.exerciseInfo} onClick={() => toggleExercise(exercise.id)}>
                  <h4>{exercise.name}</h4>
                  <div className={styles.exerciseDetails}>
                    <span>{exercise.sets} סטים</span>
                    <span>{exercise.reps} חזרות</span>
                    <span>מנוחה: {exercise.restSeconds} שניות</span>
                  </div>
                </div>
                <button 
                  className={styles.toggleButton}
                  onClick={() => toggleExercise(exercise.id)}
                >
                  {openExerciseId === exercise.id ? <FaAngleUp /> : <FaAngleDown />}
                </button>
              </div>
              
              {openExerciseId === exercise.id && (
                <div className={styles.exerciseExpanded}>
                  <div className={styles.exerciseDescription}>
                    <p>{exercise.description}</p>
                    <p className={styles.exerciseInstructions}>{exercise.instructions}</p>
                  </div>
                  
                  {exercise.videoUrl && (
                    <div className={styles.exerciseVideo}>
                      <Link to={`/exercises/${exercise.id}`} className={styles.videoLink}>
                        <FaPlayCircle /> צפה בהדגמת התרגיל
                      </Link>
                    </div>
                  )}
                  
                  <div className={styles.exerciseTarget}>
                    <strong>שרירים עיקריים:</strong> {exercise.muscleGroup}
                    {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                      <div>
                        <strong>שרירים משניים:</strong> {exercise.secondaryMuscles.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* מתיחות */}
      <div className={styles.workoutSection}>
        <div 
          className={styles.sectionHeader} 
          onClick={() => setIsStretchOpen(!isStretchOpen)}
        >
          <h3>מתיחות ושחרור</h3>
          <button className={styles.toggleButton}>
            {isStretchOpen ? <FaAngleUp /> : <FaAngleDown />}
          </button>
        </div>
        
        {isStretchOpen && (
          <div className={styles.sectionContent}>
            <div className={styles.stretchExercises}>
              {stretchExercises.map((exercise, index) => (
                <div key={index} className={styles.stretchExercise}>
                  <div className={styles.stretchExerciseName}>
                    <span>{exercise.name}</span>
                    <span className={styles.stretchDuration}>{exercise.duration}</span>
                  </div>
                  <div className={styles.stretchExerciseDescription}>
                    {exercise.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );   }

export default WorkoutPlan;