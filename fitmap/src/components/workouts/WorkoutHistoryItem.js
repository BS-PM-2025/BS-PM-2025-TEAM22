// src/components/workouts/WorkoutHistoryItem.js
import React, { useState, useEffect } from 'react';
import { 
  FaDumbbell, 
  FaCalendarAlt, 
  FaClock, 
  FaChevronDown, 
  FaChevronUp, 
  FaMapMarkerAlt, 
  FaEdit, 
  FaTrashAlt, 
  FaFireAlt, 
  FaStar, 
  FaHeartbeat, 
  FaRunning,
  FaSyncAlt,
  FaWeight
} from 'react-icons/fa';
import moment from 'moment';
import 'moment/locale/he'; // תמיכה בעברית
import styles from './styles/WorkoutHistoryItem.module.css';

moment.locale('he');

/**
 * רכיב פריט היסטוריית אימון - מציג אימון בודד מההיסטוריה (גרסה משודרגת)
 * @param {Object} workout - אובייקט האימון
 * @param {Function} onDelete - פונקציה להפעלה בעת מחיקת אימון
 * @param {Function} onEdit - פונקציה להפעלה בעת עריכת אימון
 * @param {Function} onDuplicate - פונקציה להפעלה בעת שכפול אימון
 */
function WorkoutHistoryItem({ workout, onDelete, onEdit, onDuplicate }) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [animatedHeight, setAnimatedHeight] = useState('0px');
  const [detailsRef, setDetailsRef] = useState(null);
  const [fadeIn, setFadeIn] = useState(false);

  // התאמת גובה האנימציה בעת פתיחת/סגירת הפרטים
  useEffect(() => {
    if (detailsRef) {
      if (expanded) {
        setIsTransitioning(true);
        setAnimatedHeight(`${detailsRef.scrollHeight}px`);
        
        // אפקט הופעה הדרגתית של התוכן
        setTimeout(() => {
          setFadeIn(true);
        }, 100);
      } else {
        setIsTransitioning(true);
        setFadeIn(false);
        
        setTimeout(() => {
          setAnimatedHeight('0px');
        }, 100);
      }
    }
  }, [expanded, detailsRef]);

  // סיום אנימציה
  const handleTransitionEnd = () => {
    setIsTransitioning(false);
    if (!expanded) {
      setAnimatedHeight('0px');
    }
  };

  // הגדרת ref לשימוש באנימציה
  const setDetailsRefCallback = (node) => {
    if (node !== null) {
      setDetailsRef(node);
    }
  };

  if (!workout) {
    return null;
  }

  // פורמט תאריך לתצוגה
  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY');
  };

  // פורמט יום בשבוע
  const formatDayOfWeek = (dateString) => {
    return moment(dateString).format('dddd');
  };

  // תרגום סוגי אימון לעברית
  const translateWorkoutType = (type) => {
    const translations = {
      'strength': 'חיזוק',
      'cardio': 'סיבולת',
      'flexibility': 'גמישות',
      'mixed': 'משולב'
    };
    
    return translations[type] || type;
  };

  // בחירת אייקון לפי סוג אימון
  const getWorkoutTypeIcon = (type) => {
    switch (type) {
      case 'strength':
        return <FaDumbbell />;
      case 'cardio':
        return <FaHeartbeat />;
      case 'flexibility':
        return <FaRunning />;
      case 'mixed':
        return <FaSyncAlt />;
      default:
        return <FaDumbbell />;
    }
  };

  // צבע רקע לפי סוג אימון
  const getWorkoutTypeClass = (type) => {
    switch (type) {
      case 'strength':
        return styles.strengthType;
      case 'cardio':
        return styles.cardioType;
      case 'flexibility':
        return styles.flexibilityType;
      case 'mixed':
        return styles.mixedType;
      default:
        return '';
    }
  };

  // דירוג קושי האימון (אם קיים)
  const renderDifficultyRating = () => {
    if (!workout.difficulty_rating) return null;
    
    const rating = parseInt(workout.difficulty_rating);
    if (isNaN(rating) || rating < 1 || rating > 5) return null;
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar 
          key={i}
          className={i <= rating ? styles.filledStar : styles.emptyStar}
          aria-hidden="true"
        />
      );
    }
    
    return (
      <div className={styles.difficultyRating} aria-label={`דירוג קושי: ${rating} מתוך 5`}>
        <div className={styles.starsContainer}>
          {stars}
        </div>
      </div>
    );
  };

  // חישוב קלוריות לפי נתונים קיימים
  const calculateCalories = () => {
    if (workout.calories_burned) {
      return workout.calories_burned;
    }
    
    // אם אין נתון מוכן, ניתן לחשב לפי נוסחה פשוטה (לדוגמה בלבד)
    if (workout.duration_minutes) {
      const baseByType = {
        'strength': 5,
        'cardio': 8,
        'flexibility': 4,
        'mixed': 6
      };
      
      const baseRate = baseByType[workout.workout_type] || 5;
      return Math.round(baseRate * workout.duration_minutes);
    }
    
    return null;
  };

  // טיפול במחיקת אימון
  const handleDelete = () => {
    if (onDelete) {
      onDelete(workout.id);
      setShowDeleteConfirm(false);
    }
  };

  // טיפול בעריכת אימון
  const handleEdit = () => {
    if (onEdit) {
      onEdit(workout);
    }
  };

  // טיפול בשכפול אימון
  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(workout);
    }
  };

  // חישוב זמן שחלף מהאימון
  const getTimeAgo = (dateString) => {
    const workoutDate = moment(dateString);
    const now = moment();
    
    const diffDays = now.diff(workoutDate, 'days');
    
    if (diffDays === 0) {
      return 'היום';
    } else if (diffDays === 1) {
      return 'אתמול';
    } else if (diffDays < 7) {
      return `לפני ${diffDays} ימים`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `לפני ${weeks} ${weeks === 1 ? 'שבוע' : 'שבועות'}`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `לפני ${months} ${months === 1 ? 'חודש' : 'חודשים'}`;
    }
  };

  // עיבוד הערות עם תמיכה בקישורים
  const processNotes = (notesText) => {
    if (!notesText) return null;
    
    // מחליף URLs בטקסט לקישורים לחיצים
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = notesText.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.noteLink}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const caloriesBurned = calculateCalories();

  return (
    <div className={`${styles.workoutItem} ${getWorkoutTypeClass(workout.workout_type)}`}>
      <div 
        className={styles.workoutHeader}
        onClick={() => setExpanded(!expanded)}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setExpanded(!expanded);
          }
        }}
      >
        <div className={styles.workoutIconContainer}>
          {getWorkoutTypeIcon(workout.workout_type)}
        </div>
        
        <div className={styles.workoutInfo}>
          <div className={styles.workoutTitleRow}>
            <h3 className={styles.workoutTitle}>{workout.workout_name}</h3>
            <span className={styles.timeAgo}>{getTimeAgo(workout.workout_date)}</span>
          </div>
          
          <div className={styles.workoutMeta}>
            <div className={styles.metaItem}>
              <FaCalendarAlt className={styles.metaIcon} />
              <span>{formatDate(workout.workout_date)}</span>
              <span className={styles.dayOfWeek}>יום {formatDayOfWeek(workout.workout_date)}</span>
            </div>
            
            <div className={styles.metaItem}>
              <FaClock className={styles.metaIcon} />
              <span>{workout.duration_minutes} דקות</span>
            </div>
            
            <div className={`${styles.workoutType} ${getWorkoutTypeClass(workout.workout_type)}`}>
              {translateWorkoutType(workout.workout_type)}
            </div>
          </div>
        </div>
        
        <button 
          className={styles.expandButton}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          aria-label={expanded ? "הסתר פרטים" : "הצג פרטים"}
        >
          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </button>
      </div>
      
      <div 
        className={`${styles.workoutDetailsWrapper} ${isTransitioning ? styles.transitioning : ''}`}
        style={{ height: expanded || isTransitioning ? animatedHeight : '0px' }}
        onTransitionEnd={handleTransitionEnd}
      >
        <div 
          ref={setDetailsRefCallback} 
          className={`${styles.workoutDetails} ${fadeIn ? styles.fadeIn : ''}`}
        >
          <div className={styles.detailsGrid}>
            {workout.facility_name && (
              <div className={styles.facilityInfo}>
                <FaMapMarkerAlt className={styles.facilityIcon} />
                <span className={styles.facilityName}>{workout.facility_name}</span>
              </div>
            )}
            
            {caloriesBurned && (
              <div className={styles.caloriesInfo}>
                <FaFireAlt className={styles.caloriesIcon} />
                <span className={styles.caloriesValue}>{caloriesBurned}</span>
                <span className={styles.caloriesLabel}>קלוריות</span>
              </div>
            )}
            
            {workout.weight && (
              <div className={styles.weightInfo}>
                <FaWeight className={styles.weightIcon} />
                <span className={styles.weightValue}>{workout.weight}</span>
                <span className={styles.weightLabel}>ק"ג</span>
              </div>
            )}
            
            {renderDifficultyRating()}
          </div>
          
          {workout.notes && (
            <div className={styles.notes}>
              <h4 className={styles.sectionTitle}>הערות:</h4>
              <p className={styles.notesText}>{processNotes(workout.notes)}</p>
            </div>
          )}
          
          {workout.exercises_performed && (
            <div className={styles.exercisesList}>
              <h4 className={styles.sectionTitle}>תרגילים:</h4>
              <ul className={styles.exercisesGrid}>
                {Array.isArray(workout.exercises_performed) ? (
                  workout.exercises_performed.map((exercise, index) => (
                    <li key={index} className={styles.exerciseItem}>
                      <span className={styles.exerciseName}>{exercise.name}</span>
                      <span className={styles.exerciseDetails}>
                        {exercise.sets && exercise.reps && 
                          `${exercise.sets} סטים × ${exercise.reps} חזרות`
                        }
                        {exercise.sets && exercise.duration && 
                          `${exercise.sets} סטים × ${exercise.duration}`
                        }
                        {!exercise.sets && exercise.duration && 
                          `${exercise.duration}`
                        }
                        {exercise.weight && ` | ${exercise.weight} ק"ג`}
                      </span>
                    </li>
                  ))
                ) : typeof workout.exercises_performed === 'object' ? (
                  // במקרה שהנתונים מגיעים כאובייקט JSON מ-Supabase
                  Object.entries(workout.exercises_performed).map(([key, exercise], index) => (
                    <li key={index} className={styles.exerciseItem}>
                      <span className={styles.exerciseName}>{exercise.name || key}</span>
                      <span className={styles.exerciseDetails}>
                        {exercise.sets && exercise.reps && 
                          `${exercise.sets} סטים × ${exercise.reps} חזרות`
                        }
                        {exercise.sets && exercise.duration && 
                          `${exercise.sets} סטים × ${exercise.duration}`
                        }
                        {!exercise.sets && exercise.duration && 
                          `${exercise.duration}`
                        }
                        {exercise.weight && ` | ${exercise.weight} ק"ג`}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className={styles.exerciseItem}>
                    <span className={styles.exerciseName}>לא נמצאו פרטי תרגילים</span>
                  </li>
                )}
              </ul>
            </div>
          )}
          
          <div className={styles.actionButtons}>
            {onDuplicate && (
              <button 
                className={styles.duplicateButton}
                onClick={handleDuplicate}
                aria-label="שכפל אימון"
              >
                <FaSyncAlt /> שכפל
              </button>
            )}
            
            {onEdit && (
              <button 
                className={styles.editButton}
                onClick={handleEdit}
                aria-label="ערוך אימון"
              >
                <FaEdit /> ערוך
              </button>
            )}
            
            {onDelete && (
              <>
                {showDeleteConfirm ? (
                  <div className={styles.confirmDelete}>
                    <p>האם אתה בטוח שברצונך למחוק?</p>
                    <div className={styles.confirmButtons}>
                      <button 
                        className={styles.confirmButton}
                        onClick={handleDelete}
                        aria-label="אישור מחיקה"
                      >
                        כן, מחק
                      </button>
                      <button 
                        className={styles.cancelButton}
                        onClick={() => setShowDeleteConfirm(false)}
                        aria-label="ביטול מחיקה"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    aria-label="מחק אימון"
                  >
                    <FaTrashAlt /> מחק
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkoutHistoryItem;