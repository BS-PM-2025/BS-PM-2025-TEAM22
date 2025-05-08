// src/components/workouts/AddWorkoutForm.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { FaTimes, FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import styles from './styles/AddWorkoutForm.module.css';

/**
 * טופס להוספת רישום אימון חדש
 * @param {Function} onSubmit - פונקציה שתופעל עם שליחת הטופס
 * @param {Function} onCancel - פונקציה שתופעל בעת ביטול
 * @param {Object} userProfile - פרופיל משתמש
 */
function AddWorkoutForm({ onSubmit, onCancel, userProfile }) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exercises, setExercises] = useState([
    { id: 1, name: '', sets: '', reps: '', duration: '' }
  ]);
  
  // פרטי האימון
  const [workout, setWorkout] = useState({
    workout_name: '',
    workout_date: new Date().toISOString().split('T')[0], // היום בפורמט YYYY-MM-DD
    duration_minutes: 30,
    workout_type: 'strength',
    facility_id: '',
    facility_name: '',
    notes: ''
  });

  // טעינת רשימת מתקנים
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        // טעינת רשימת מתקנים מ-Supabase
        const { data, error } = await supabase
          .from('facilities')
          .select('id, name')
          .order('name');
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setFacilities(data);
        } else {
          // אם אין נתונים, נשתמש בדוגמה
          const sampleFacilities = [
            { id: 1, name: 'פארק העירוני' },
            { id: 2, name: 'פארק הירקון' },
            { id: 3, name: 'מתחם ספורט בשכונה' },
            { id: 4, name: 'מתחם כושר בגן סאקר' },
            { id: 5, name: 'פארק החורשות' }
          ];
          
          setFacilities(sampleFacilities);
        }
        
      } catch (error) {
        console.error('שגיאה בטעינת מתקנים:', error.message);
        setError('לא ניתן היה לטעון את רשימת המתקנים');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFacilities();
  }, []);

  // עדכון פרטי האימון
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setWorkout(prev => ({
      ...prev,
      [name]: value
    }));
    
    // אם יש שינוי במתקן, עדכן גם את שם המתקן
    if (name === 'facility_id') {
      const selectedFacility = facilities.find(f => f.id === parseInt(value));
      if (selectedFacility) {
        setWorkout(prev => ({
          ...prev,
          facility_name: selectedFacility.name
        }));
      }
    }
  };

  // עדכון פרטי תרגיל
  const handleExerciseChange = (id, field, value) => {
    setExercises(prevExercises => 
      prevExercises.map(ex => 
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
  };

  // הוספת תרגיל חדש
  const addExercise = () => {
    const newId = Math.max(...exercises.map(e => e.id), 0) + 1;
    setExercises([...exercises, { id: newId, name: '', sets: '', reps: '', duration: '' }]);
  };

  // הסרת תרגיל
  const removeExercise = (id) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter(ex => ex.id !== id));
    }
  };

  // שליחת הטופס
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // בדיקת תקינות
    if (!workout.workout_name) {
      setError('יש להזין שם לאימון');
      return;
    }
    
    if (!workout.workout_date) {
      setError('יש לבחור תאריך לאימון');
      return;
    }
    
    // בדיקת תרגילים
    const validExercises = exercises.filter(ex => ex.name.trim() !== '');
    if (validExercises.length === 0) {
      setError('יש להזין לפחות תרגיל אחד');
      return;
    }
    
    try {
      setLoading(true);
      
      // סידור המידע לפורמט הרצוי לשמירה ב-Supabase
      const newWorkout = {
        user_id: userProfile?.user_id,
        workout_name: workout.workout_name,
        workout_date: workout.workout_date,
        duration_minutes: workout.duration_minutes,
        workout_type: workout.workout_type,
        facility_id: workout.facility_id ? parseInt(workout.facility_id) : null,
        facility_name: workout.facility_name,
        exercises_performed: validExercises,
        notes: workout.notes,
        is_public: false,
        created_at: new Date().toISOString()
      };
      
      // שמירת האימון ב-Supabase
      const { data, error } = await supabase
        .from('user_workouts')
        .insert([newWorkout])
        .select();
      
      if (error) {
        throw error;
      }
      
      // קריאה לפונקציית onSubmit עם האימון שנשמר
      if (data && data.length > 0) {
        onSubmit(data[0]);
      } else {
        // אם אין נתונים שחזרו מהשרת, השתמש באובייקט המקומי
        onSubmit({
          id: Date.now(), // מזהה זמני
          ...newWorkout
        });
      }
      
    } catch (error) {
      console.error('שגיאה בשמירת אימון:', error.message);
      setError('לא ניתן היה לשמור את האימון. אנא נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2>הוספת אימון חדש</h2>
        <button 
          className={styles.closeButton}
          onClick={onCancel}
          aria-label="סגור"
        >
          <FaTimes />
        </button>
      </div>
      
      {error && (
        <div className={styles.errorMessage}>
          <FaExclamationTriangle />
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.workoutForm}>
        <div className={styles.formGridRow}>
          <div className={styles.formGroup}>
            <label htmlFor="workout_name">שם האימון</label>
            <input
              type="text"
              id="workout_name"
              name="workout_name"
              value={workout.workout_name}
              onChange={handleInputChange}
              placeholder="לדוגמה: אימון כוח בפארק"
              disabled={loading}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="workout_date">תאריך</label>
            <input
              type="date"
              id="workout_date"
              name="workout_date"
              value={workout.workout_date}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
          </div>
        </div>
        
        <div className={styles.formGridRow}>
          <div className={styles.formGroup}>
            <label htmlFor="duration_minutes">משך האימון (דקות)</label>
            <input
              type="number"
              id="duration_minutes"
              name="duration_minutes"
              value={workout.duration_minutes}
              onChange={handleInputChange}
              min="5"
              max="240"
              disabled={loading}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="workout_type">סוג אימון</label>
            <select
              id="workout_type"
              name="workout_type"
              value={workout.workout_type}
              onChange={handleInputChange}
              disabled={loading}
              required
            >
              <option value="strength">חיזוק</option>
              <option value="cardio">סיבולת</option>
              <option value="flexibility">גמישות</option>
              <option value="mixed">משולב</option>
            </select>
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="facility_id">מתקן</label>
          <select
            id="facility_id"
            name="facility_id"
            value={workout.facility_id}
            onChange={handleInputChange}
            disabled={loading}
          >
            <option value="">בחר מתקן</option>
            {facilities.map(facility => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="notes">הערות</label>
          <textarea
            id="notes"
            name="notes"
            value={workout.notes}
            onChange={handleInputChange}
            placeholder="הערות נוספות לגבי האימון"
            rows="3"
            disabled={loading}
          />
        </div>
        
        <div className={styles.exercisesSection}>
          <div className={styles.sectionHeader}>
            <h3>תרגילים</h3>
            <button 
              type="button" 
              className={styles.addExerciseButton}
              onClick={addExercise}
              disabled={loading}
            >
              <FaPlus /> הוסף תרגיל
            </button>
          </div>
          
          {exercises.map((exercise) => (
            <div key={exercise.id} className={styles.exerciseItem}>
              <div className={styles.exerciseFormGroup}>
                <label htmlFor={`exercise-name-${exercise.id}`}>שם התרגיל</label>
                <input
                  type="text"
                  id={`exercise-name-${exercise.id}`}
                  value={exercise.name}
                  onChange={(e) => handleExerciseChange(exercise.id, 'name', e.target.value)}
                  placeholder="לדוגמה: מתח עליון, שכיבות סמיכה"
                  disabled={loading}
                />
              </div>
              
              <div className={styles.exerciseDetails}>
                <div className={styles.exerciseFormGroup}>
                  <label htmlFor={`exercise-sets-${exercise.id}`}>סטים</label>
                  <input
                    type="number"
                    id={`exercise-sets-${exercise.id}`}
                    value={exercise.sets}
                    onChange={(e) => handleExerciseChange(exercise.id, 'sets', e.target.value)}
                    placeholder="3"
                    min="1"
                    max="20"
                    disabled={loading}
                  />
                </div>
                
                <div className={styles.exerciseFormGroup}>
                  <label htmlFor={`exercise-reps-${exercise.id}`}>חזרות / משך</label>
                  <input
                    type="text"
                    id={`exercise-reps-${exercise.id}`}
                    value={exercise.reps}
                    onChange={(e) => handleExerciseChange(exercise.id, 'reps', e.target.value)}
                    placeholder="8-12 או 30 שניות"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <button 
                type="button" 
                className={styles.removeExerciseButton}
                onClick={() => removeExercise(exercise.id)}
                disabled={exercises.length === 1 || loading}
                aria-label="הסר תרגיל"
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>
        
        <div className={styles.formActions}>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'שומר...' : 'שמור אימון'}
          </button>
          <button 
            type="button" 
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={loading}
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddWorkoutForm;