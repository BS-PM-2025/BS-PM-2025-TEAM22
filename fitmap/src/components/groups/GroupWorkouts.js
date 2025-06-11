import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaFilter, FaSearch, FaUsers, FaUser, FaPlus, FaDumbbell } from 'react-icons/fa';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import CreateWorkoutModal from './CreateWorkoutModal';
import GroupWorkoutCard from './GroupWorkoutCard';
import styles from './styles/GroupWorkouts.module.css';

function GroupWorkouts() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [participantCounts, setParticipantCounts] = useState({});
  const [sortBy, setSortBy] = useState('time_asc');

  // פונקציה משודרגת לטעינת האימונים
  const fetchWorkouts = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      console.log('מתחיל טעינת אימונים קבוצתיים...');
      let allWorkouts = [];

      // שליפת האימונים לפי הפילטר
      if (filter === 'created') {
        console.log('טוען אימונים שנוצרו על ידי המשתמש:', userProfile?.user_id);
        const { data, error } = await supabase
          .from('group_workouts')
          .select('*')
          .eq('creator_id', userProfile?.user_id);
          
        if (error) throw error;
        allWorkouts = data || [];
      } 
      else if (filter === 'joined') {
        console.log('טוען אימונים שהמשתמש הצטרף אליהם');
        const { data: participantData, error: participantError } = await supabase
          .from('group_participants')
          .select('workout_id')
          .eq('user_id', userProfile?.user_id);
          
        if (participantError) throw participantError;

        if (participantData?.length > 0) {
          const workoutIds = participantData.map(p => p.workout_id);
          console.log('נמצאו', workoutIds.length, 'אימונים שהמשתמש הצטרף אליהם');
          
          const { data, error } = await supabase
            .from('group_workouts')
            .select('*')
            .in('id', workoutIds);
            
          if (error) throw error;
          allWorkouts = data || [];
        }
      } 
      else {
        console.log('טוען את כל האימונים');
        const { data, error } = await supabase
          .from('group_workouts')
          .select('*');
          
        if (error) throw error;
        allWorkouts = data || [];
      }

      console.log('נטענו', allWorkouts.length, 'אימונים');
      
      // מיון האימונים
      allWorkouts = sortWorkouts(allWorkouts, sortBy);

      // פילטור האימונים
      const filtered = allWorkouts.filter((w) => {
        const matchesSearch = w.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !typeFilter || w.workout_type === typeFilter;
        const matchesDifficulty = !difficultyFilter || w.difficulty === difficultyFilter;
        return matchesSearch && matchesType && matchesDifficulty;
      });

      console.log('לאחר פילטור נשארו', filtered.length, 'אימונים');
      setWorkouts(filtered);

      // טעינת מספר המשתתפים עבור כל אימון
      await fetchParticipantCounts(filtered.map(w => w.id));

    } catch (err) {
      console.error('שגיאה בטעינת האימונים:', err.message);
      setError('שגיאה בטעינת האימונים: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, typeFilter, difficultyFilter, userProfile?.user_id, sortBy, user]);

  // פונקציה למיון האימונים
  const sortWorkouts = (workouts, sortMethod) => {
    const now = new Date();
    
    return [...workouts].sort((a, b) => {
      const aTime = new Date(a.start_time || 0);
      const bTime = new Date(b.start_time || 0);
      const aIsPast = aTime < now;
      const bIsPast = bTime < now;
      
      switch (sortMethod) {
        case 'time_asc':
          return aTime - bTime;
        case 'time_desc':
          return bTime - aTime;
        case 'upcoming_first':
          // אימונים עתידיים לפני אימונים שעברו
          if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;
          return aTime - bTime; // מיון לפי זמן אם שניהם עתידיים או שניהם עברו
        case 'title_asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'title_desc':
          return (b.title || '').localeCompare(a.title || '');
        default:
          return aTime - bTime;
      }
    });
  };

  // טעינת מספר המשתתפים לכל אימון
  const fetchParticipantCounts = async (workoutIds) => {
    if (!workoutIds || workoutIds.length === 0) return;
    
    try {
      console.log('טוען מספר משתתפים עבור', workoutIds.length, 'אימונים');
      const { data, error } = await supabase
        .from('group_participants')
        .select('workout_id')
        .in('workout_id', workoutIds);
        
      if (error) throw error;
      
      // ספירת מספר המשתתפים לכל אימון
      const counts = {};
      (data || []).forEach(participant => {
        counts[participant.workout_id] = (counts[participant.workout_id] || 0) + 1;
      });
      
      console.log('נטענו נתוני משתתפים:', Object.keys(counts).length, 'אימונים');
      setParticipantCounts(counts);
    } catch (err) {
      console.error('שגיאה בטעינת מספר משתתפים:', err);
    }
  };

  // טעינה ראשונית של האימונים
  useEffect(() => {
    if (user) {
      fetchWorkouts();
    }
  }, [fetchWorkouts, user]);

  // ניתוב לעמוד האימון
  const handleWorkoutClick = (id) => {
    navigate(`/group-workouts/${id}`);
  };

  // איפוס כל הפילטרים
  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setDifficultyFilter('');
    setFilter('all');
    setSortBy('time_asc');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>
          <FaUsers className={styles.headerIcon} />
          אימונים קבוצתיים
        </h1>
        {userProfile && (
          <button 
            className={styles.addButton} 
            onClick={() => setShowCreateModal(true)}
            aria-label="צור אימון חדש"
          >
            <FaPlus /> צור אימון חדש
          </button>
        )}
      </div>

      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="חפש לפי שם..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button 
            className={styles.filterToggle}
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-label={showFilters ? "הסתר פילטרים" : "הצג פילטרים"}
          >
            <FaFilter /> {showFilters ? 'הסתר פילטרים' : 'הצג פילטרים'}
          </button>
        </div>

        {showFilters && (
          <div className={styles.advancedFilters}>
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label htmlFor="typeFilter">סוג אימון:</label>
                <select 
                  id="typeFilter"
                  value={typeFilter} 
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">כל הסוגים</option>
                  <option value="strength">חיזוק</option>
                  <option value="cardio">סיבולת</option>
                  <option value="flexibility">גמישות</option>
                  <option value="mixed">משולב</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="difficultyFilter">רמת קושי:</label>
                <select 
                  id="difficultyFilter"
                  value={difficultyFilter} 
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                >
                  <option value="">כל הרמות</option>
                  <option value="beginner">מתחיל</option>
                  <option value="intermediate">בינוני</option>
                  <option value="advanced">מתקדם</option>
                  <option value="all">לכולם</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="sortBy">מיון לפי:</label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="time_asc">תאריך (מהקרוב לרחוק)</option>
                  <option value="time_desc">תאריך (מהרחוק לקרוב)</option>
                  <option value="upcoming_first">אימונים קרובים תחילה</option>
                  <option value="title_asc">שם (א-ת)</option>
                  <option value="title_desc">שם (ת-א)</option>
                </select>
              </div>
            </div>

            <div className={styles.filterButtons}>
              <button 
                className={filter === 'all' ? styles.active : ''} 
                onClick={() => setFilter('all')}
              >
                <FaDumbbell /> כל האימונים
              </button>
              <button 
                className={filter === 'created' ? styles.active : ''} 
                onClick={() => setFilter('created')}
              >
                <FaUser /> האימונים שלי
              </button>
              <button 
                className={filter === 'joined' ? styles.active : ''} 
                onClick={() => setFilter('joined')}
              >
                <FaCalendarAlt /> אימונים שנרשמתי
              </button>
              <button 
                className={styles.resetButton} 
                onClick={resetFilters}
              >
                נקה פילטרים
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>טוען אימונים...</p>
        </div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={fetchWorkouts} className={styles.retryButton}>
            נסה שוב
          </button>
        </div>
      ) : workouts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <FaCalendarAlt />
          </div>
          <h3>לא נמצאו אימונים</h3>
          <p>
            {filter === 'all' 
              ? 'לא נמצאו אימונים קבוצתיים זמינים.' 
              : filter === 'created' 
                ? 'עדיין לא יצרת אימונים קבוצתיים.' 
                : 'עדיין לא נרשמת לאימונים קבוצתיים.'}
          </p>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className={styles.viewAllButton}>
              צפה בכל האימונים הזמינים
            </button>
          )}
          {filter !== 'created' && (
            <button onClick={() => setShowCreateModal(true)} className={styles.createButton}>
              <FaPlus /> צור אימון חדש
            </button>
          )}
        </div>
      ) : (
        <div className={styles.workoutsGrid}>
          {workouts.map((workout) => (
            <GroupWorkoutCard 
              key={workout.id} 
              workout={workout} 
              participantCount={participantCounts[workout.id] || 0}
              onClick={() => handleWorkoutClick(workout.id)} 
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateWorkoutModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false);
            fetchWorkouts();
          }}
        />
      )}
    </div>
  );
}

export default GroupWorkouts;