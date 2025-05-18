// src/components/workouts/FavoriteExercises.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ExerciseCard from './ExerciseCard';
import styles from './styles/ExerciseLibrary.module.css';
import { FaDumbbell } from 'react-icons/fa';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

function FavoriteExercises() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      
      // שליפת המזהים של התרגילים המועדפים
      const { data: favData, error: favError } = await supabase
        .from('exercise_favorites')
        .select('exercise_id')
        .eq('user_id', user.id);

      if (favError) throw favError;

      const favoriteIds = favData.map(item => item.exercise_id);
      setFavorites(favoriteIds);

      if (favoriteIds.length === 0) {
        setExercises([]);
        setLoading(false);
        return;
      }

      // שליפת פרטי התרגילים המועדפים
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .in('id', favoriteIds);

      if (exercisesError) throw exercisesError;

      // המרה משמות עמודות במסד הנתונים לשמות שדות בקומפוננטה
      const formattedExercises = exercisesData.map(ex => ({
        id: ex.id,
        name: ex.name,
        description: ex.description,
        muscleGroup: ex.muscle_group,
        secondaryMuscles: ex.secondary_muscles,
        difficulty: ex.difficulty,
        equipment: ex.equipment,
        image: ex.image,
        videoUrl: ex.video_url // הוספת שדה videoUrl
      }));

      setExercises(formattedExercises);
    } catch (error) {
      console.error('שגיאה בטעינת מועדפים:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (exerciseId) => {
    if (!user) return;

    try {
      // מחיקת התרגיל מהמועדפים
      const { error } = await supabase
        .from('exercise_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId);

      if (error) throw error;

      // עדכון המצב המקומי
      setFavorites(favorites.filter(id => id !== exerciseId));
      setExercises(exercises.filter(ex => ex.id !== exerciseId));
    } catch (error) {
      console.error('שגיאה בהסרת מועדף:', error.message);
    }
  };

  const isFavorite = (id) => favorites.includes(id);

  const handleExerciseClick = (exerciseId) => {
    navigate(`/exercises/${exerciseId}`);
  };

  return (
    <div className={styles.libraryContainer}>
      <div className={styles.libraryHeader}>
        <h1>תרגילים שמורים</h1>
        <p>כאן תמצא את כל התרגילים שסימנת כמועדפים</p>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>טוען תרגילים מועדפים...</p>
        </div>
      ) : exercises.length === 0 ? (
        <div className={styles.noResults}>
          <FaDumbbell className={styles.noResultsIcon} />
          <h3>אין תרגילים שמורים</h3>
          <p>חזור לספריית התרגילים והוסף תרגילים מועדפים</p>
          <button 
            onClick={() => navigate('/exercises')} 
            className={styles.resetButton}
          >
            לספריית התרגילים
          </button>
        </div>
      ) : (
        <div className={styles.exerciseGrid}>
          {exercises.map(exercise => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onClick={() => handleExerciseClick(exercise.id)}
              isFavorite={isFavorite(exercise.id)}
              onToggleFavorite={() => toggleFavorite(exercise.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FavoriteExercises;