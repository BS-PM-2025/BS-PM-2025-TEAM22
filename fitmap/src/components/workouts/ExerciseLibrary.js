// src/components/workouts/ExerciseLibrary.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ExerciseCard from './ExerciseCard';
import { FaSearch, FaDumbbell, FaFilter, FaTimes, FaHeart, FaUser, FaUserCheck } from 'react-icons/fa';
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
  const [showOnlySeniorFriendly, setShowOnlySeniorFriendly] = useState(false);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    muscleGroup: 'all',
    difficulty: 'all',
    equipment: 'all',
    ageGroup: 'all' // הוספת פילטר גיל חדש
  });

  const muscleGroups = ['all', 'חזה', 'גב', 'כתפיים', 'זרועות', 'רגליים', 'בטן'];
  const difficultyLevels = ['all', 'beginner', 'intermediate', 'advanced'];
  const equipmentTypes = ['all', 'ללא ציוד', 'מתח', 'מקבילים', 'ספסל', 'משקולות'];
  const ageGroups = [
    { value: 'all', label: 'כל הגילאים' },
    { value: 'senior', label: 'מתאים לגיל השלישי' },
    { value: 'adult', label: 'מבוגרים' },
    { value: 'youth', label: 'צעירים' }
  ];

  // תרגילים המומלצים לגיל השלישי - נתונים שיכולים להגיע גם מהמסד נתונים
  const seniorFriendlyExercises = [
    'הליכה במקום',
    'מתיחות ישיבה',
    'הרמת ידיים לצדדים',
    'כיפופי ברכיים קלים',
    'סיבובי כתפיים',
    'מתיחת צוואר',
    'הליכה על עקבים ובהונות',
    'תרגילי נשימה',
    'מתיחות עמידה',
    'תרגילי איזון',
    'כיפופי זרועות קלים',
    'הרמת רגליים בישיבה',
    'מתיחת גב',
    'תרגילי קואורדינציה'
  ];

  useEffect(() => {
    fetchExercises();
    if (user) fetchFavorites();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, exercises, favorites, showOnlyFavorites, showOnlySeniorFriendly]);

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

  // בדיקה אם תרגיל מתאים לגיל השלישי
  const isSeniorFriendly = (exercise) => {
    // בדיקה לפי שם התרגיל
    const isNameMatch = seniorFriendlyExercises.some(seniorEx => 
      exercise.name.includes(seniorEx) || seniorEx.includes(exercise.name)
    );

    // בדיקה לפי רמת קושי (מתחילים בלבד)
    const isDifficultyAppropriate = exercise.difficulty === 'beginner';

    // בדיקה לפי תיאור (אם מכיל מילות מפתח)
    const seniorKeywords = ['קל', 'עדין', 'איזון', 'מתיחה', 'גמישות', 'ישיבה', 'נשימה'];
    const hasKeywords = seniorKeywords.some(keyword => 
      exercise.description?.includes(keyword) || exercise.name.includes(keyword)
    );

    // בדיקה לפי ציוד (ללא ציוד או ציוד קל)
    const equipmentAppropriate = !exercise.equipment || 
      exercise.equipment.length === 0 || 
      exercise.equipment.includes('chair') || 
      exercise.equipment.includes('light_weights');

    // אם יש שדה ייעודי במסד נתונים
    if (exercise.senior_friendly !== undefined) {
      return exercise.senior_friendly;
    }

    // אחרת, נבדוק לפי הקריטריונים שלנו
    return isNameMatch || (isDifficultyAppropriate && (hasKeywords || equipmentAppropriate));
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

    // פילטר גיל חדש
    if (filters.ageGroup !== 'all') {
      if (filters.ageGroup === 'senior') {
        results = results.filter(ex => isSeniorFriendly(ex));
      } else if (filters.ageGroup === 'adult') {
        results = results.filter(ex => 
          ex.difficulty === 'intermediate' || ex.difficulty === 'advanced'
        );
      } else if (filters.ageGroup === 'youth') {
        results = results.filter(ex => 
          ex.difficulty === 'intermediate' || ex.difficulty === 'advanced'
        );
      }
    }

    if (showOnlyFavorites) {
      results = results.filter(ex => favorites.includes(ex.id));
    }

    // פילטר מהיר לגיל השלישי
    if (showOnlySeniorFriendly) {
      results = results.filter(ex => isSeniorFriendly(ex));
    }

    setFilteredExercises(results);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const resetFilters = () => {
    setFilters({ 
      muscleGroup: 'all', 
      difficulty: 'all', 
      equipment: 'all',
      ageGroup: 'all'
    });
    setSearchTerm('');
    setShowOnlyFavorites(false);
    setShowOnlySeniorFriendly(false);
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
        <p>מצא תרגילים לכל סוגי המתקנים, רמות הכושר וגילאים</p>
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

        <div className={styles.quickFilters}>
          <button className={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
            <FaFilter /> {showFilters ? 'הסתר פילטרים' : 'סנן תרגילים'}
          </button>

          <button 
            className={`${styles.filterToggle} ${showOnlyFavorites ? styles.activeFilter : ''}`} 
            onClick={() => setShowOnlyFavorites(prev => !prev)}
          >
            <FaHeart /> {showOnlyFavorites ? 'הצג הכל' : 'רק מועדפים'}
          </button>

          <button 
            className={`${styles.filterToggle} ${styles.seniorFilter} ${showOnlySeniorFriendly ? styles.activeFilter : ''}`} 
            onClick={() => setShowOnlySeniorFriendly(prev => !prev)}
          >
            <FaUserCheck /> {showOnlySeniorFriendly ? 'הצג הכל' : 'מתאים לגיל השלישי'}
          </button>
        </div>
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

            <div className={styles.filterGroup}>
              <label>
                <FaUser className={styles.filterIcon} />
                קבוצת גיל
              </label>
              <select
                value={filters.ageGroup}
                onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
                className={styles.ageGroupSelect}
              >
                {ageGroups.map(group => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* הסבר על פילטר הגיל השלישי */}
          {(filters.ageGroup === 'senior' || showOnlySeniorFriendly) && (
            <div className={styles.seniorInfo}>
              <div className={styles.seniorInfoHeader}>
                <FaUserCheck className={styles.seniorInfoIcon} />
                <h4>תרגילים מותאמים לגיל השלישי</h4>
              </div>
              <p>
                תרגילים אלו נבחרו במיוחד עבור אנשים בגיל השלישי ומתמקדים ב:
              </p>
              <ul className={styles.seniorBenefits}>
                <li>שיפור איזון וקואורדינציה</li>
                <li>חיזוק שרירים בעדינות</li>
                <li>שמירה על גמישות המפרקים</li>
                <li>תרגילים בטוחים ללא עומס יתר</li>
                <li>התאמה לאנשים עם מגבלות תנועה</li>
              </ul>
            </div>
          )}
        </div>
      )}

      <div className={styles.exerciseResults}>
        <div className={styles.resultsHeader}>
          <h3>תוצאות חיפוש</h3>
          <div className={styles.resultInfo}>
            <span className={styles.resultCount}>{filteredExercises.length} תרגילים</span>
            {(showOnlySeniorFriendly || filters.ageGroup === 'senior') && (
              <span className={styles.seniorBadge}>
                <FaUserCheck /> מותאם לגיל השלישי
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>טוען תרגילים...</p>
          </div> 
        ) : filteredExercises.length === 0 ? (
          <div className={styles.noResults}>
            <FaDumbbell className={styles.noResultsIcon} />
            <h3>
              {showOnlyFavorites 
                ? 'אין תרגילים שמורים' 
                : showOnlySeniorFriendly || filters.ageGroup === 'senior'
                ? 'לא נמצאו תרגילים מתאימים לגיל השלישי'
                : 'לא נמצאו תרגילים'
              }
            </h3>
            <p>
              {showOnlyFavorites
                ? 'לא הוספת תרגילים למועדפים עדיין'
                : showOnlySeniorFriendly || filters.ageGroup === 'senior'
                ? 'נסה לשנות את הפילטרים או לחפש תרגילים אחרים'
                : 'נסה לשנות את הפילטרים או לחפש מונח אחר'}
            </p>
            <button onClick={resetFilters} className={styles.resetButton}>
              איפוס פילטרים
            </button>
          </div>
        ) : (
          <div className={styles.exerciseGrid}>
            {filteredExercises.map(exercise => (
              <div key={exercise.id} className={styles.exerciseCardWrapper}>
                <ExerciseCard
                  exercise={{
                    id: exercise.id,
                    name: exercise.name,
                    description: exercise.description,
                    muscleGroup: exercise.muscle_group,
                    secondaryMuscles: exercise.secondary_muscles,
                    difficulty: exercise.difficulty,
                    equipment: exercise.equipment,
                    image: exercise.image,
                    videoUrl: exercise.video_url
                  }}
                  onClick={() => handleExerciseClick(exercise.id)}
                  isFavorite={isFavorite(exercise.id)}
                  onToggleFavorite={() => toggleFavorite(exercise.id)}
                />
                
                {/* תווית מיוחדת לתרגילים מתאימים לגיל השלישי */}
                {isSeniorFriendly(exercise) && (
                  <div className={styles.seniorFriendlyBadge}>
                    <FaUserCheck />
                    <span>מתאים לגיל השלישי</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ExerciseLibrary;