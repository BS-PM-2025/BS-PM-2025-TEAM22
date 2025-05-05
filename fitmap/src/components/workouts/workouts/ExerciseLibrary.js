// src/components/workouts/ExerciseLibrary.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ExerciseCard from './ExerciseCard';
import { FaSearch, FaDumbbell, FaFilter, FaTimes, FaHeart } from 'react-icons/fa';
import styles from './styles/ExerciseLibrary.module.css';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

function ExerciseLibrary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    muscleGroup: 'all',
    difficulty: 'all',
    equipment: 'all'
  });

  const muscleGroups = ['all', 'חזה', 'גב', 'כתפיים', 'זרועות', 'רגליים', 'בטן'];
  const difficultyLevels = ['all', 'beginner', 'intermediate', 'advanced'];
  const equipmentTypes = ['all', 'ללא ציוד', 'מתח', 'מקבילים', 'ספסל', 'משקולות'];

  useEffect(() => {
    fetchExercises();
    if (user) fetchFavorites();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, exercises, favorites, showOnlyFavorites]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      // שליפת התרגילים מ-Supabase
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('id');

      if (error) throw error;

      setExercises(data);
      setFilteredExercises(data);
    } catch (error) {
      console.error('שגיאה בטעינת תרגילים:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('exercise_favorites')
        .select('exercise_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setFavorites(data.map(item => item.exercise_id));
    } catch (error) {
      console.error('שגיאה בטעינת מועדפים:', error.message);
    }
  };

  const toggleFavorite = async (exerciseId) => {
    if (!user) return;
    
    const isFav = favorites.includes(exerciseId);
    let updated;

    try {
      if (isFav) {
        // מחיקת מועדף
        const { error } = await supabase
          .from('exercise_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('exercise_id', exerciseId);
          
        if (error) throw error;
        
        updated = favorites.filter(id => id !== exerciseId);
      } else {
        // הוספת מועדף
        const { error } = await supabase
          .from('exercise_favorites')
          .insert([{ user_id: user.id, exercise_id: exerciseId }]);
          
        if (error) throw error;
        
        updated = [...favorites, exerciseId];
      }
      
      setFavorites(updated);
    } catch (error) {
      console.error('שגיאה בעדכון מועדפים:', error.message);
    }
  };

  const isFavorite = (id) => favorites.includes(id);

  const handleExerciseClick = (exerciseId) => {
    navigate(`/exercises/${exerciseId}`);
  };

  const applyFilters = () => {
    if (!exercises.length) return;
    
    let results = [...exercises];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(ex =>
        ex.name.toLowerCase().includes(term) ||
        ex.description.toLowerCase().includes(term) ||
        ex.muscle_group.toLowerCase().includes(term)
      );
    }

    if (filters.muscleGroup !== 'all') {
      results = results.filter(ex =>
        ex.muscle_group === filters.muscleGroup ||
        (ex.secondary_muscles && ex.secondary_muscles.includes(filters.muscleGroup))
      );
    }

    if (filters.difficulty !== 'all') {
      results = results.filter(ex => ex.difficulty === filters.difficulty);
    }

    if (filters.equipment !== 'all') {
      if (filters.equipment === 'ללא ציוד') {
        results = results.filter(ex => !ex.equipment || ex.equipment.length === 0);
      } else {
        const mapping = {
          'מתח': 'pullup_bars',
          'מקבילים': 'parallel_bars',
          'ספסל': 'bench',
          'משקולות': 'weights'
        };
        const equipmentCode = mapping[filters.equipment] || filters.equipment;
        results = results.filter(ex => ex.equipment && ex.equipment.includes(equipmentCode));
      }
    }

    if (showOnlyFavorites) {
      results = results.filter(ex => favorites.includes(ex.id));
    }

    setFilteredExercises(results);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const resetFilters = () => {
    setFilters({ muscleGroup: 'all', difficulty: 'all', equipment: 'all' });
    setSearchTerm('');
    setShowOnlyFavorites(false);
  };

  const translateDifficulty = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'מתחיל';
      case 'intermediate': return 'בינוני';
      case 'advanced': return 'מתקדם';
      case 'all': return 'הכל';
      default: return difficulty;
    }
  };

  return (
    <div className={styles.libraryContainer}>
      <div className={styles.libraryHeader}>
        <h1>ספריית תרגילים</h1>
        <p>מצא תרגילים לכל סוגי המתקנים ורמות הכושר</p>
      </div>

      <div className={styles.searchAndFilters}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="חפש תרגילים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <FaSearch className={styles.searchIcon} />
          {searchTerm && (
            <button className={styles.clearSearch} onClick={() => setSearchTerm('')}>
              <FaTimes />
            </button>
          )}
        </div>

        <button className={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
          <FaFilter /> {showFilters ? 'הסתר פילטרים' : 'סנן תרגילים'}
        </button>

        <button 
          className={`${styles.filterToggle} ${showOnlyFavorites ? styles.activeFilter : ''}`} 
          onClick={() => setShowOnlyFavorites(prev => !prev)}
        >
          <FaHeart /> {showOnlyFavorites ? 'הצג הכל' : 'הצג רק מועדפים'}
        </button>
      </div>

      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filtersHeader}>
            <h3>סינון תרגילים</h3>
            <button onClick={resetFilters} className={styles.resetButton}>איפוס פילטרים</button>
          </div>

          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label>קבוצת שרירים</label>
              <select
                value={filters.muscleGroup}
                onChange={(e) => handleFilterChange('muscleGroup', e.target.value)}
              >
                {muscleGroups.map(group => (
                  <option key={group} value={group}>
                    {group === 'all' ? 'כל קבוצות השרירים' : group}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>רמת קושי</label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              >
                {difficultyLevels.map(level => (
                  <option key={level} value={level}>
                    {level === 'all' ? 'כל הרמות' : translateDifficulty(level)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>ציוד נדרש</label>
              <select
                value={filters.equipment}
                onChange={(e) => handleFilterChange('equipment', e.target.value)}
              >
                {equipmentTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'כל סוגי הציוד' : type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className={styles.exerciseResults}>
        <div className={styles.resultsHeader}>
          <h3>תוצאות חיפוש</h3>
          <span className={styles.resultCount}>{filteredExercises.length} תרגילים</span>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>טוען תרגילים...</p>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className={styles.noResults}>
            <FaDumbbell className={styles.noResultsIcon} />
            <h3>{showOnlyFavorites ? 'אין תרגילים שמורים' : 'לא נמצאו תרגילים'}</h3>
            <p>
              {showOnlyFavorites
                ? 'לא הוספת תרגילים למועדפים עדיין'
                : 'נסה לשנות את הפילטרים או לחפש מונח אחר'}
            </p>
            <button onClick={resetFilters} className={styles.resetButton}>
              איפוס פילטרים
            </button>
          </div>
        ) : (
          <div className={styles.exerciseGrid}>
            {filteredExercises.map(exercise => (
              <ExerciseCard
                key={exercise.id}
                exercise={{
                  id: exercise.id,
                  name: exercise.name,
                  description: exercise.description,
                  muscleGroup: exercise.muscle_group,
                  secondaryMuscles: exercise.secondary_muscles,
                  difficulty: exercise.difficulty,
                  equipment: exercise.equipment,
                  image: exercise.image,
                  videoUrl: exercise.video_url // הוספת שדה ה-videoUrl
                }}
                onClick={() => handleExerciseClick(exercise.id)}
                isFavorite={isFavorite(exercise.id)}
                onToggleFavorite={() => toggleFavorite(exercise.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ExerciseLibrary;