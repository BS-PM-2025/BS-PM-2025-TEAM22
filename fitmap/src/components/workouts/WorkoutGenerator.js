// src/components/workouts/WorkoutGenerator.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import WorkoutPlan from './WorkoutPlan';
import { FaDumbbell, FaHeartbeat, FaRunning, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import styles from './styles/WorkoutGenerator.module.css';

function WorkoutGenerator() {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState(null);
  const [generatedWorkout, setGeneratedWorkout] = useState(null);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  // פרמטרים לתוכנית האימון
  const [workoutParams, setWorkoutParams] = useState({
    goal: 'strength',
    duration: 30,
    intensity: 'medium',
    experience: userProfile?.fitness_level || 'beginner'
  });

  useEffect(() => {
    const fetchFacilityData = async () => {
      try {
        setLoading(true);
        
        // בדיקה שהמשתמש מחובר
        if (!user) {
          navigate('/auth', { state: { returnTo: `/facilities/${facilityId}/workout-generator` } });
          return;
        }
        
        // טעינת פרטי המתקן
        const { data: facilityData, error: facilityError } = await supabase
          .from('facilities')
          .select('*')
          .eq('id', facilityId)
          .single();

        if (facilityError) {
          throw facilityError;
        }
        
        if (!facilityData) {
          throw new Error('לא נמצא מתקן עם המזהה שסופק');
        }
        
        setFacility(facilityData);

        // טעינת תרגילים זמינים מטבלת exercises
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*');
        
        if (exercisesError) {
          throw exercisesError;
        }
        
        if (exercisesData && exercisesData.length > 0) {
          setExercises(exercisesData);
        } else {
          // אם אין תרגילים בטבלה, נשתמש בתרגילים לדוגמה
          setExercises(generateSampleExercises(facilityData));
        }

      } catch (err) {
        console.error('שגיאה בטעינת נתוני מתקן:', err.message);
        setError('לא ניתן היה לטעון את נתוני המתקן. אנא נסה שוב מאוחר יותר.');
      } finally {
        setLoading(false);
      }
    };

    fetchFacilityData();
  }, [facilityId, user, navigate]);

  // עדכון פרמטרים של תוכנית האימון
  const handleParamChange = (param, value) => {
    setWorkoutParams(prev => ({ ...prev, [param]: value }));
  };

  // יצירת תוכנית אימון
  const generateWorkout = () => {
    try {
      // בחירת תרגילים מתאימים לפי הפרמטרים
      const selectedExercises = selectExercisesForWorkout(
        exercises, 
        workoutParams.goal, 
        workoutParams.duration, 
        workoutParams.experience
      );

      // יצירת תוכנית עם זמנים וסטים
      const workout = {
        name: `אימון ${getWorkoutGoalInHebrew(workoutParams.goal)} במתקן ${facility.name}`,
        goal: workoutParams.goal,
        duration: workoutParams.duration,
        intensity: workoutParams.intensity,
        facility: facility,
        exercises: selectedExercises,
        createdAt: new Date().toISOString(),
        totalTime: workoutParams.duration
      };

      setGeneratedWorkout(workout);

    } catch (err) {
      console.error('שגיאה ביצירת תוכנית אימון:', err);
      setError('לא ניתן היה ליצור תוכנית אימון. אנא נסה שוב.');
    }
  };

  // שמירת תוכנית האימון
  const saveWorkout = async () => {
    if (!generatedWorkout || !user) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_workouts')
        .insert([
          {
            user_id: user.id,
            workout_name: generatedWorkout.name,
            workout_date: new Date().toISOString().split('T')[0],
            facility_id: parseInt(facilityId),
            facility_name: facility.name,
            exercises_performed: generatedWorkout.exercises,
            duration_minutes: generatedWorkout.duration,
            workout_type: generatedWorkout.goal,
            is_public: false,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        throw error;
      }
      
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 3000);
      
    } catch (err) {
      console.error('שגיאה בשמירת תוכנית האימון:', err.message);
      setError('לא ניתן היה לשמור את תוכנית האימון. אנא נסה שוב מאוחר יותר.');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>טוען נתוני מתקן...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <FaExclamationTriangle />
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className={styles.backButton}>חזרה</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>יצירת תוכנית אימון</h1>
        <h2>מתקן: {facility.name}</h2>
      </div>

      {generatedWorkout ? (
        <div className={styles.workoutResult}>
          {showSavedMessage && (
            <div className={styles.savedMessage}>
              <i className="fas fa-check-circle"></i>
              תוכנית האימון נשמרה בהצלחה!
            </div>
          )}
          
          <WorkoutPlan 
            workout={generatedWorkout} 
            facilityId={facilityId}
          />
          
          <div className={styles.actionButtons}>
            <button onClick={saveWorkout} className={styles.saveButton}>
              <i className="fas fa-save"></i> שמור תוכנית
            </button>
            <button onClick={() => setGeneratedWorkout(null)} className={styles.backButton}>
              <i className="fas fa-redo"></i> יצירת תוכנית חדשה
            </button>
            <button onClick={() => navigate('/workout-tracker')} className={styles.trackerButton}>
              <i className="fas fa-chart-line"></i> למעקב אימונים
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.generatorForm}>
          <div className={styles.formSection}>
            <h3>מטרת האימון</h3>
            <div className={styles.goalOptions}>
              <button 
                className={`${styles.goalOption} ${workoutParams.goal === 'strength' ? styles.selected : ''}`}
                onClick={() => handleParamChange('goal', 'strength')}
              >
                <FaDumbbell className={styles.goalIcon} />
                <span>חיזוק</span>
              </button>
              <button 
                className={`${styles.goalOption} ${workoutParams.goal === 'cardio' ? styles.selected : ''}`}
                onClick={() => handleParamChange('goal', 'cardio')}
              >
                <FaHeartbeat className={styles.goalIcon} />
                <span>סיבולת</span>
              </button>
              <button 
                className={`${styles.goalOption} ${workoutParams.goal === 'flexibility' ? styles.selected : ''}`}
                onClick={() => handleParamChange('goal', 'flexibility')}
              >
                <FaRunning className={styles.goalIcon} />
                <span>גמישות</span>
              </button>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>משך האימון</h3>
            <div className={styles.durationSlider}>
              <input
                type="range"
                min="15"
                max="90"
                step="5"
                value={workoutParams.duration}
                onChange={(e) => handleParamChange('duration', parseInt(e.target.value))}
              />
              <div className={styles.durationValue}>
                <FaClock />
                <span>{workoutParams.duration} דקות</span>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>רמת עצימות</h3>
            <div className={styles.intensityOptions}>
              <button 
                className={`${styles.intensityButton} ${workoutParams.intensity === 'low' ? styles.selected : ''}`}
                onClick={() => handleParamChange('intensity', 'low')}
              >
                קלה
              </button>
              <button 
                className={`${styles.intensityButton} ${workoutParams.intensity === 'medium' ? styles.selected : ''}`}
                onClick={() => handleParamChange('intensity', 'medium')}
              >
                בינונית
              </button>
              <button 
                className={`${styles.intensityButton} ${workoutParams.intensity === 'high' ? styles.selected : ''}`}
                onClick={() => handleParamChange('intensity', 'high')}
              >
                גבוהה
              </button>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>רמת ניסיון</h3>
            <div className={styles.experienceOptions}>
              <button 
                className={`${styles.experienceButton} ${workoutParams.experience === 'beginner' ? styles.selected : ''}`}
                onClick={() => handleParamChange('experience', 'beginner')}
              >
                מתחיל
              </button>
              <button 
                className={`${styles.experienceButton} ${workoutParams.experience === 'intermediate' ? styles.selected : ''}`}
                onClick={() => handleParamChange('experience', 'intermediate')}
              >
                בינוני
              </button>
              <button 
                className={`${styles.experienceButton} ${workoutParams.experience === 'advanced' ? styles.selected : ''}`}
                onClick={() => handleParamChange('experience', 'advanced')}
              >
                מתקדם
              </button>
            </div>
          </div>

          <button onClick={generateWorkout} className={styles.generateButton}>
            <FaDumbbell /> יצירת תוכנית אימון
          </button>
        </div>
      )}
    </div>
  );
}

// פונקציות עזר

// יצירת תרגילים לדוגמה בהתאם לציוד המתקן
function generateSampleExercises(facility) {
  const hasEquipment = (name) => {
    if (!facility.equipment) {
      return false;
    }
    let equipment = [];
    try {
      equipment = typeof facility.equipment === 'string' ? JSON.parse(facility.equipment) : facility.equipment;
    } catch (e) {
      console.warn('שגיאה בפענוח ציוד:', e);
      return false;
    }
    return Array.isArray(equipment) && equipment.includes(name);
  };

  return [
      // תרגילי כוח - מתח
      {
        id: 1,
        name: 'מתח עליון',
        description: 'משיכת הגוף כלפי מעלה באחיזה עליונה',
        muscle_group: 'גב',
        secondary_muscles: ['זרועות', 'כתפיים'],
        difficulty: hasEquipment('pullup_bars') ? 'intermediate' : 'advanced',
        equipment: ['pullup_bars'],
        image: '/exercises/pullup.jpg',
        instructions: 'תפוס במוט באחיזה עליונה, משוך את גופך למעלה עד שהסנטר מעל המוט, הורד באיטיות',
        sets: 3,
        reps: '6-10',
        video_url: 'https://www.youtube.com/embed/eGo4IYlbE5g'
      },
      {
        id: 2,
        name: 'משיכה תחתונה',
        description: 'משיכת הגוף כלפי מעלה באחיזה תחתונה',
        muscle_group: 'גב',
        secondary_muscles: ['זרועות', 'כתפיים'],
        difficulty: hasEquipment('pullup_bars') ? 'beginner' : 'intermediate',
        equipment: ['pullup_bars'],
        image: '/exercises/chinup.jpg',
        instructions: 'תפוס במוט באחיזה תחתונה, משוך את גופך למעלה עד שהסנטר מעל המוט, הורד באיטיות',
        sets: 3,
        reps: '8-12',
        video_url: 'https://www.youtube.com/embed/2yOxXG14dCo'
      },
      // תרגילי כוח - מקבילים
      {
        id: 3,
        name: 'שכיבות סמיכה על מקבילים',
        description: 'חיזוק פלג גוף עליון באמצעות מקבילים',
        muscle_group: 'חזה',
        secondary_muscles: ['טרייספס', 'כתפיים'],
        difficulty: hasEquipment('parallel_bars') ? 'intermediate' : 'advanced',
        equipment: ['parallel_bars'],
        image: '/exercises/dips.jpg',
        instructions: 'אחוז במקבילים, הנמך את הגוף עד שהמרפקים בזווית 90 מעלות, דחוף את גופך בחזרה למעלה',
        sets: 3,
        reps: '8-12',
        video_url: 'https://www.youtube.com/embed/sM6XUdt1rm4'
      },
      // תרגילי גוף
      {
        id: 4,
        name: 'כפיפות בטן',
        description: 'חיזוק שרירי הבטן',
        muscle_group: 'בטן',
        secondary_muscles: [],
        difficulty: 'beginner',
        equipment: [],
        image: '/exercises/situps.jpg',
        instructions: 'שכב על הגב עם רגליים כפופות, הרם את הפלג העליון מהרצפה לכיוון הברכיים, רד בחזרה באיטיות',
        sets: 3,
        reps: '15-20',
        video_url: 'https://www.youtube.com/embed/jDwoBqPH0jk'
      },
      {
        id: 5,
        name: 'שכיבות סמיכה',
        description: 'תרגיל לחיזוק פלג גוף עליון',
        muscle_group: 'חזה',
        secondary_muscles: ['טרייספס', 'כתפיים', 'בטן'],
        difficulty: 'beginner',
        equipment: [],
        image: '/exercises/pushups.jpg',
        instructions: 'התחל במנח שכיבת סמיכה, הורד את הגוף למטה עד שהחזה כמעט נוגע ברצפה, דחוף חזרה למעלה',
        sets: 3,
        reps: '10-15',
        video_url: 'https://www.youtube.com/embed/IODxDxX7oi4'
      },
      // תרגילי סיבולת
      {
        id: 6,
        name: 'ריצה במקום',
        description: 'אימון אירובי לשיפור סיבולת לב-ריאה',
        muscle_group: 'רגליים',
        secondary_muscles: ['לב'],
        difficulty: 'beginner',
        equipment: [],
        image: '/exercises/running.jpg',
        instructions: 'רוץ במקום בקצב מהיר, הרם את הברכיים לגובה המותן',
        sets: 1,
        reps: '60 שניות',
        video_url: 'https://www.youtube.com/embed/0GAmUOBaE-Y'
      },
      {
        id: 7,
        name: 'ג׳אמפינג ג׳ק',
        description: 'תרגיל אירובי מלא לכל הגוף',
        muscle_group: 'רגליים',
        secondary_muscles: ['לב', 'כתפיים'],
        difficulty: 'beginner',
        equipment: [],
        image: '/exercises/jumpingjacks.jpg',
        instructions: 'עמוד זקוף עם רגליים צמודות וידיים לצדדים, קפוץ תוך כדי פישוק רגליים והרמת ידיים מעל הראש, קפוץ חזרה למצב התחלתי',
        sets: 1,
        reps: '45 שניות',
        video_url: 'https://www.youtube.com/embed/c4DAnQ6DtF8'
      },
      // תרגילי גמישות
      {
        id: 8,
        name: 'מתיחת ארבע ראשי',
        description: 'מתיחה לשריר הארבע ראשי בירך',
        muscle_group: 'רגליים',
        secondary_muscles: [],
        difficulty: 'beginner',
        equipment: [],
        image: '/exercises/quadstretch.jpg',
        instructions: 'עמוד על רגל אחת, אחוז בקרסול של הרגל השנייה, משוך את העקב אל עבר הישבן',
        sets: 1,
        reps: '30 שניות לכל צד',
        video_url: 'https://www.youtube.com/embed/AS6Wz_JGd4o'
      }
    ];
}

// בחירת תרגילים לאימון בהתאם לפרמטרים
function selectExercisesForWorkout(exercises, goal, duration, experience) {
  let filteredExercises = [...exercises];
  
  // סינון לפי סוג אימון
  if (goal === 'strength') {
    filteredExercises = filteredExercises.filter(ex => 
      ex.muscle_group === 'חזה' || ex.muscle_group === 'גב' || ex.muscle_group === 'בטן'
    );
  } else if (goal === 'cardio') {
    filteredExercises = filteredExercises.filter(ex => 
      ex.muscle_group === 'רגליים' || 
      (ex.secondary_muscles && 
       (Array.isArray(ex.secondary_muscles) ? 
         ex.secondary_muscles.includes('לב') : 
         ex.secondary_muscles.indexOf('לב') !== -1)
      )
    );
  } else if (goal === 'flexibility') {
    filteredExercises = filteredExercises.filter(ex => 
      ex.name.includes('מתיחת') || ex.difficulty === 'beginner'
    );
  }
  
  // סינון לפי רמת קושי
  if (experience === 'beginner') {
    filteredExercises = filteredExercises.filter(ex => ex.difficulty === 'beginner');
  } else if (experience === 'intermediate') {
    filteredExercises = filteredExercises.filter(ex => 
      ex.difficulty === 'beginner' || ex.difficulty === 'intermediate'
    );
  }
  
  // אם אין מספיק תרגילים מתאימים, נוסיף עוד תרגילים מהרשימה המלאה
  if (filteredExercises.length < 3) {
    const additionalExercises = exercises.filter(ex => !filteredExercises.includes(ex))
      .sort((a, b) => {
        const difficultyRank = { 'beginner': 0, 'intermediate': 1, 'advanced': 2 };
        return difficultyRank[a.difficulty] - difficultyRank[b.difficulty];
      });
    
    filteredExercises = [...filteredExercises, ...additionalExercises];
  }
  
  // קביעת מספר התרגילים לפי משך האימון
  let exerciseCount;
  if (duration <= 20) {
    exerciseCount = 3;
  } else if (duration <= 40) {
    exerciseCount = 5;
  } else {
    exerciseCount = Math.min(8, filteredExercises.length);
  }
  
  // בחירת תרגילים באופן אקראי
  const selectedExercises = [];
  while (selectedExercises.length < exerciseCount && filteredExercises.length > 0) {
    const randomIndex = Math.floor(Math.random() * filteredExercises.length);
    const exercise = filteredExercises[randomIndex];
    
    // נוסיף רק תרגילים שעוד לא נבחרו
    if (!selectedExercises.some(ex => ex.id === exercise.id)) {
      // התאמת מספר הסטים לפי רמת הניסיון
      let sets = exercise.sets || 3;
      if (experience === 'beginner') {
        sets = Math.max(2, sets - 1);
      } else if (experience === 'advanced') {
        sets += 1;
      }
      
      selectedExercises.push({
        ...exercise,
        sets,
        restSeconds: goal === 'cardio' ? 15 : (goal === 'strength' ? 60 : 30)
      });
      
      filteredExercises.splice(randomIndex, 1);
    }
  }
  
  return selectedExercises;
}

// תרגום מטרת אימון לעברית
function getWorkoutGoalInHebrew(goal) {
  switch(goal) {
    case 'strength': return 'חיזוק';
    case 'cardio': return 'סיבולת';
    case 'flexibility': return 'גמישות';
    default: return goal;
  }
}

export default WorkoutGenerator;