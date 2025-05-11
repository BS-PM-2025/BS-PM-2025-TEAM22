// src/components/workouts/WorkoutTracker.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from 'C:/Users/Alon/BS-PM-2025-TEAM22-2/fitmap/src/utils/supabaseClient.js';
import { useAuth } from 'C:/Users/Alon/BS-PM-2025-TEAM22-2/fitmap/src/hooks/useAuth.js';
import StatCard from './StatCard';
import ProgressCharts from './ProgressCharts';
import WorkoutHistoryItem from './WorkoutHistoryItem';
import AddWorkoutForm from './AddWorkoutForm';
import WorkoutCalendar from './WorkoutCalendar';
import { 
  FaPlus, FaChartBar, FaHistory, FaExclamationTriangle, 
  FaLightbulb, FaCalendarAlt, FaDumbbell, FaStopwatch, 
  FaClock, FaHeartbeat, FaFire, FaTrophy, FaFilter,
   FaSortAmountDown, FaSortAmountUp, FaSearch,
  FaRegSadTear, FaShare, 
} from 'react-icons/fa';
import moment from 'moment';
import 'moment/locale/he'; // תמיכה בעברית
import styles from './styles/WorkoutTracker.module.css';

moment.locale('he');


function WorkoutTracker() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalMinutes: 0,
    averageDuration: 0,
    favoriteType: '',
    currentStreak: 0,
    longestStreak: 0,
    caloriesBurned: 0,
    lastWorkout: null
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null);
  const [, setShowWorkoutDetails] = useState(false);
  const [expandedStats, setExpandedStats] = useState(false);
  
  // מסננים והתאמות אישיות
  const [filterType, setFilterType] = useState('all');
  const [sortDirection, setSortDirection] = useState('desc'); // desc = מהחדש לישן
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // לוגיקה של שמירת הכרטיסייה הפעילה ב-localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem('workoutTrackerActiveTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  // שמירת הכרטיסייה הפעילה בכל שינוי
  useEffect(() => {
    localStorage.setItem('workoutTrackerActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    fetchWorkoutHistory();
  }, [user]);

  // טעינת היסטוריית אימונים
  const fetchWorkoutHistory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // הוספת שדות נוספים לאימונים אם הם חסרים
        const enhancedData = data.map(workout => ({
          ...workout,
          calories_burned: workout.calories_burned || calculateEstimatedCalories(workout),
          difficulty_rating: workout.difficulty_rating || null
        }));
        
        setWorkoutHistory(enhancedData);
        calculateStats(enhancedData);
      } else {
        // אם אין נתונים, נשלח מערך ריק
        setWorkoutHistory([]);
        calculateStats([]);
      }
      
    } catch (error) {
      console.error('שגיאה בטעינת היסטוריית אימונים:', error.message);
      setError('לא ניתן היה לטעון את היסטוריית האימונים');
    } finally {
      setLoading(false);
    }
  };

  // חישוב סטטיסטיקות אימון עם נתונים מורחבים
  const calculateStats = (workouts) => {
    if (!workouts || workouts.length === 0) {
      setStats({
        totalWorkouts: 0,
        totalMinutes: 0,
        averageDuration: 0,
        favoriteType: '',
        currentStreak: 0,
        longestStreak: 0,
        caloriesBurned: 0,
        lastWorkout: null
      });
      return;
    }
    
    // סך הכל אימונים
    const totalWorkouts = workouts.length;
    
    // סך זמן אימון בדקות
    const totalMinutes = workouts.reduce((total, workout) => 
      total + (workout.duration_minutes || 0), 0);
      
    // ממוצע זמן אימון
    const averageDuration = Math.round(totalMinutes / totalWorkouts);
    
    // סך קלוריות שנשרפו
    const caloriesBurned = workouts.reduce((total, workout) => 
      total + (workout.calories_burned || calculateEstimatedCalories(workout)), 0);
    
    // סוג אימון מועדף
    const workoutTypes = workouts.reduce((acc, workout) => {
      const type = workout.workout_type;
      if (type) {
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    }, {});
    
    let favoriteType = '';
    if (Object.keys(workoutTypes).length > 0) {
      favoriteType = Object.entries(workoutTypes)
        .sort((a, b) => b[1] - a[1])[0][0];
    }
      
    // חישוב סטריק נוכחי וסטריק ארוך ביותר
    let currentStreak = 0;
    let longestStreak = 0;
    
    // סידור לפי תאריך, מהחדש לישן
    const sortedDates = [...workouts]
      .map(w => new Date(w.workout_date))
      .sort((a, b) => b - a);
      
    if (sortedDates.length > 0) {
      let streak = 1;
      const today = new Date();
      
      // בדיקה אם התאמנו היום
      const lastWorkoutDate = sortedDates[0];
      const isToday = 
        lastWorkoutDate.getDate() === today.getDate() &&
        lastWorkoutDate.getMonth() === today.getMonth() &&
        lastWorkoutDate.getFullYear() === today.getFullYear();
      
      if (isToday || isYesterday(lastWorkoutDate, today)) {
        currentStreak += 1;
        
        // בדוק רציפות
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = sortedDates[i-1];
          const currDate = sortedDates[i];
          
          // האם התאריכים עוקבים?
          if (isConsecutiveDay(currDate, prevDate)) {
            streak++;
            currentStreak = isToday ? streak : (isYesterday(lastWorkoutDate, today) ? streak : 0);
          } else {
            if (streak > longestStreak) {
              longestStreak = streak;
            }
            streak ++;
          }
        }
        
        if (streak > longestStreak) {
          longestStreak = streak;
        }
      }
    }
    
    // אימון אחרון
    const lastWorkout = workouts[0];
    
    setStats({
      totalWorkouts,
      totalMinutes,
      averageDuration,
      favoriteType: favoriteType ? translateWorkoutType(favoriteType) : '',
      currentStreak,
      longestStreak,
      caloriesBurned,
      lastWorkout
    });
  };

  // הערכת קלוריות שנשרפו לפי סוג האימון ומשכו
  const calculateEstimatedCalories = (workout) => {
    if (!workout || !workout.duration_minutes) return 0;
    
    const caloriesPerMinute = {
      'strength': 6,
      'cardio': 10,
      'flexibility': 4,
      'mixed': 8
    };
    
    const rate = caloriesPerMinute[workout.workout_type] || 5;
    return Math.round(rate * workout.duration_minutes);
  };

  // הוספת אימון חדש
  const addWorkout = async (newWorkout) => {
    try {
      // הוספה לסטייט המקומי
      const updatedHistory = [newWorkout, ...workoutHistory];
      setWorkoutHistory(updatedHistory);
      
      // עדכון סטטיסטיקות
      calculateStats(updatedHistory);
      
      // סגירת הטופס
      setShowAddForm(false);
      
      // הצגת הודעת הצלחה
      setSuccess(`האימון "${newWorkout.workout_name}" נוסף בהצלחה!`);
      
      // סגירת הודעת ההצלחה אחרי 3 שניות
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (error) {
      console.error('שגיאה בעדכון היסטוריית אימונים:', error.message);
      setError('לא ניתן היה לעדכן את היסטוריית האימונים');
    }
  };

  // מחיקת אימון
  const deleteWorkout = async (workoutId) => {
    try {
      // מציאת שם האימון לפני המחיקה
      const workoutToDelete = workoutHistory.find(w => w.id === workoutId);
      const workoutName = workoutToDelete ? workoutToDelete.workout_name : '';
      
      // מחיקה מ-Supabase
      const { error } = await supabase
        .from('user_workouts')
        .delete()
        .eq('id', workoutId);
        
      if (error) {
        throw error;
      }
      
      // עדכון הסטייט המקומי
      const updatedHistory = workoutHistory.filter(workout => workout.id !== workoutId);
      setWorkoutHistory(updatedHistory);
      
      // עדכון סטטיסטיקות
      calculateStats(updatedHistory);
      
      // אם היה אימון נבחר שנמחק, בטל את הבחירה
      if (selectedWorkoutId === workoutId) {
        setSelectedWorkoutId(null);
        setShowWorkoutDetails(false);
      }
      
      // הצגת הודעת הצלחה
      setSuccess(`האימון "${workoutName}" נמחק בהצלחה!`);
      
      // סגירת הודעת ההצלחה אחרי 3 שניות
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (error) {
      console.error('שגיאה במחיקת אימון:', error.message);
      setError('לא ניתן היה למחוק את האימון');
    }
  };

  // עריכת אימון קיים
  const editWorkout = (workout) => {
    // ביישום מלא, כאן תיפתח טופס העריכה
    console.log('עריכת אימון:', workout);
  };

  // שכפול אימון (יצירת עותק חדש עם תאריך היום)
  const duplicateWorkout = async (workout) => {
    try {
      // יצירת אובייקט אימון חדש עם התכונות של האימון הקיים
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      
      const newWorkout = {
        ...workout,
        id: undefined, // Supabase יצור מזהה חדש
        workout_date: formattedDate,
        workout_name: `עותק של: ${workout.workout_name}`,
        created_at: new Date().toISOString()
      };
      
      // הוספה לסופאבייס
      const { data, error } = await supabase
        .from('user_workouts')
        .insert([newWorkout])
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // הוספה לסטייט המקומי
      const updatedHistory = [data, ...workoutHistory];
      setWorkoutHistory(updatedHistory);
      
      // עדכון סטטיסטיקות
      calculateStats(updatedHistory);
      
      // הצגת הודעת הצלחה
      setSuccess(`האימון "${workout.workout_name}" שוכפל בהצלחה!`);
      
      // סגירת הודעת ההצלחה אחרי 3 שניות
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
    } catch (error) {
      console.error('שגיאה בשכפול אימון:', error.message);
      setError('לא ניתן היה לשכפל את האימון');
    }
  };

  // פונקציית עזר לבדיקה אם תאריך הוא אתמול
  const isYesterday = (date, referenceDate) => {
    const yesterday = new Date(referenceDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    );
  };

  // פונקציית עזר לבדיקה אם יומיים עוקבים
  const isConsecutiveDay = (earlier, later) => {
    const oneDayLater = new Date(earlier);
    oneDayLater.setDate(oneDayLater.getDate() + 1);
    
    return (
      oneDayLater.getDate() === later.getDate() &&
      oneDayLater.getMonth() === later.getMonth() &&
      oneDayLater.getFullYear() === later.getFullYear()
    );
  };

  // תרגום סוג אימון לעברית
  const translateWorkoutType = (type) => {
    const translations = {
      'strength': 'חיזוק',
      'cardio': 'סיבולת',
      'flexibility': 'גמישות',
      'mixed': 'משולב'
    };
    
    return translations[type] || type;
  };

  // מחשב עצות מותאמות אישית בהתאם לנתוני האימונים
  const getPersonalizedTips = () => {
    if (!workoutHistory || workoutHistory.length === 0) {
      return [
        'התחל עם אימון קל של 20-30 דקות בפעמים הראשונות',
        'תכנן מראש את זמני האימון שלך בלוח השנה',
        'הצב לעצמך יעדים קטנים להשגה כדי לשמור על מוטיבציה'
      ];
    }
    
    const tips = [];
    
    // אימון אחרון היה לפני יותר מ-3 ימים
    if (stats.lastWorkout) {
      const lastWorkoutDate = new Date(stats.lastWorkout.workout_date);
      const today = new Date();
      const daysSinceLastWorkout = Math.floor((today - lastWorkoutDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastWorkout > 3) {
        tips.push(`עברו ${daysSinceLastWorkout} ימים מאז האימון האחרון. נסה להתאמן לפחות 3 פעמים בשבוע לתוצאות מיטביות.`);
      }
    }
    
    // אימונים חד-גוניים
    if (stats.favoriteType && stats.totalWorkouts > 3) {
      const favoriteTypeCount = workoutHistory.filter(w => translateWorkoutType(w.workout_type) === stats.favoriteType).length;
      const favoritePercentage = Math.round((favoriteTypeCount / stats.totalWorkouts) * 100);
      
      if (favoritePercentage > 70) {
        tips.push(`${favoritePercentage}% מהאימונים שלך הם מסוג ${stats.favoriteType}. שקול לגוון עם סוגי אימונים אחרים לפיתוח מאוזן יותר.`);
      }
    }
    
    // אימונים קצרים מדי
    if (stats.averageDuration < 20 && stats.totalWorkouts > 2) {
      tips.push('האימונים שלך קצרים יחסית. נסה להאריך את משך האימון בהדרגה ל-30-45 דקות לפחות.');
    }
    
    // סטריק נמוך
    if (stats.currentStreak < 2 && stats.totalWorkouts > 3) {
      tips.push('נסה ליצור רצף אימונים עקבי על-ידי תכנון מראש של זמני אימון קבועים.');
    }
    
    // הוסף טיפים כלליים אם אין מספיק טיפים ספציפיים
    if (tips.length < 2) {
      tips.push('שתה מספיק מים לפני, במהלך ואחרי האימון.');
      tips.push('שקול להוסיף אימוני גמישות לשגרת האימונים שלך.');
    }
    
    return tips;
  };

  // סינון ומיון אימונים לפי המסננים שנבחרו
  const filteredAndSortedWorkouts = useMemo(() => {
    // סינון לפי סוג
    let filtered = [...workoutHistory];
    
    if (filterType !== 'all') {
      filtered = filtered.filter(workout => workout.workout_type === filterType);
    }
    
    // סינון לפי טקסט חיפוש
    if (searchTerm.trim()) {
      const searchLower = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(workout => 
        workout.workout_name.toLowerCase().includes(searchLower) ||
        (workout.notes && workout.notes.toLowerCase().includes(searchLower)) ||
        (workout.facility_name && workout.facility_name.toLowerCase().includes(searchLower))
      );
    }
    
    // מיון
    if (sortDirection === 'asc') {
      // מהישן לחדש
      filtered.sort((a, b) => new Date(a.workout_date) - new Date(b.workout_date));
    } else {
      // מהחדש לישן (ברירת מחדל)
      filtered.sort((a, b) => new Date(b.workout_date) - new Date(a.workout_date));
    }
    
    return filtered;
  }, [workoutHistory, filterType, sortDirection, searchTerm]);

  // אינדיקטור בעיות - מציג בעיות פוטנציאליות בנתוני האימונים
  const getPotentialIssues = () => {
    if (!workoutHistory || workoutHistory.length < 3) return [];
    
    const issues = [];
    
    // בדיקת פער גדול בין אימונים
    const sortedDates = [...workoutHistory]
      .map(w => ({ date: new Date(w.workout_date), name: w.workout_name }))
      .sort((a, b) => b.date - a.date);
      
    for (let i = 1; i < sortedDates.length; i++) {
      const daysBetween = Math.floor((sortedDates[i-1].date - sortedDates[i].date) / (1000 * 60 * 60 * 24));
      if (daysBetween > 10) {
        issues.push(`פער של ${daysBetween} ימים בין האימונים ${sortedDates[i-1].name} ו-${sortedDates[i].name}`);
        break; // מציג רק בעיה אחת מסוג זה
      }
    }
    
    // בדיקת חוסר גיוון
    const typeCounts = {};
    let totalWorkouts = workoutHistory.length;
    
    workoutHistory.forEach(workout => {
      typeCounts[workout.workout_type] = (typeCounts[workout.workout_type] || 0) + 1;
    });
    
    const typePercentages = Object.entries(typeCounts).map(([type, count]) => {
      return { 
        type: translateWorkoutType(type), 
        percentage: Math.round((count / totalWorkouts) * 100) 
      };
    });
    
    const dominantType = typePercentages.find(t => t.percentage > 80);
    if (dominantType) {
      issues.push(`${dominantType.percentage}% מהאימונים שלך הם מסוג ${dominantType.type}. מומלץ לגוון יותר.`);
    }
    
    return issues;
  };

  // טיפול בשינוי כרטיסייה
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    // איפוס בחירות
    setSelectedWorkoutId(null);
    setShowWorkoutDetails(false);
  }, []);

  // ייצוא נתוני אימונים לקובץ CSV
  const exportToCSV = useCallback(() => {
    try {
      // הכנת נתונים לייצוא
      const exportData = workoutHistory.map(workout => ({
        שם_אימון: workout.workout_name,
        תאריך: moment(workout.workout_date).format('DD/MM/YYYY'),
        משך: workout.duration_minutes || '',
        סוג_אימון: translateWorkoutType(workout.workout_type),
        מיקום: workout.facility_name || '',
        הערות: workout.notes || ''
      }));

      // יצירת תוכן ה-CSV
      const headers = Object.keys(exportData[0]).join(',');
      const csvContent = [
        headers,
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n');

      // יצירת קובץ להורדה
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `אימונים_${moment().format('DD-MM-YYYY')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // הצגת הודעת הצלחה
      setSuccess('נתוני האימונים יוצאו בהצלחה!');
      
      // סגירת הודעת ההצלחה אחרי 3 שניות
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (error) {
      console.error('שגיאה בייצוא נתוני אימונים:', error.message);
      setError('לא ניתן היה לייצא את נתוני האימונים');
    }
  }, [workoutHistory]);

  // חלק הטעינה
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>טוען נתוני אימונים...</p>
        </div>
      </div>
    );
  }

  // חלק המשתמש לא מחובר
  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.notLoggedIn}>
          <FaExclamationTriangle className={styles.warningIcon} />
          <h2>יש להתחבר כדי לעקוב אחר אימונים</h2>
          <p>אנא התחבר או הירשם כדי להשתמש במעקב אימונים</p>
          <button 
            onClick={() => navigate('/auth')}
            className={styles.loginButton}
          >
            התחברות / הרשמה
          </button>
        </div>
      </div>
    );
  }

  // הטיפים המותאמים אישית
  const personalizedTips = getPersonalizedTips();
  
  // בעיות פוטנציאליות
  const potentialIssues = getPotentialIssues();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>מעקב אימונים</h1>
          <p>עקוב אחר התקדמות האימונים שלך וצפה בסטטיסטיקות</p>
        </div>
        <div className={styles.headerActions}>
          {workoutHistory.length > 0 && (
            <button 
              className={styles.exportButton}
              onClick={exportToCSV}
              aria-label="ייצא נתוני אימונים"
            >
              <FaShare /> ייצוא נתונים
            </button>
          )}
          
          <button 
            className={styles.addButton}
            onClick={() => setShowAddForm(true)}
          >
            <FaPlus className={styles.buttonIcon} />
            הוסף אימון חדש
          </button>
        </div>
      </div>
      
      {success && (
        <div className={styles.successMessage} role="alert">
          <p>{success}</p>
        </div>
      )}
      
      {error && (
        <div className={styles.errorMessage} role="alert">
          <FaExclamationTriangle />
          <p>{error}</p>
          <button 
            onClick={() => setError(null)} 
            className={styles.errorCloseButton}
            aria-label="סגור הודעת שגיאה"
          >
            סגור
          </button>
        </div>
      )}
      
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('overview')}
          aria-label="סקירה כללית"
          aria-pressed={activeTab === 'overview'}
        >
          <FaChartBar className={styles.tabIcon} />
          <span className={styles.tabLabel}>סקירה כללית</span>
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'history' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('history')}
          aria-label="היסטוריית אימונים"
          aria-pressed={activeTab === 'history'}
        >
          <FaHistory className={styles.tabIcon} />
          <span className={styles.tabLabel}>היסטוריית אימונים</span>
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'calendar' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('calendar')}
          aria-label="לוח שנה"
          aria-pressed={activeTab === 'calendar'}
        >
          <FaCalendarAlt className={styles.tabIcon} />
          <span className={styles.tabLabel}>לוח שנה</span>
        </button>
      </div>
      
      {showAddForm && (
        <div className={styles.formOverlay}>
          <AddWorkoutForm 
            onSubmit={addWorkout}
            onCancel={() => setShowAddForm(false)}
            userProfile={userProfile}
          />
        </div>
      )}
      
      {activeTab === 'overview' && (
        <div className={styles.statsSection}>
          {/* מידע סטטיסטי מורחב */}
          <div className={styles.statsGrid}>
            <StatCard 
              title="סך הכל אימונים"
              value={stats.totalWorkouts}
              icon={<FaDumbbell />}
              color="var(--primary)"
            />
            <StatCard 
              title="זמן אימון כולל"
              value={`${stats.totalMinutes} דקות`}
              icon={<FaStopwatch />}
              color="var(--accent)"
            />
            <StatCard 
              title="ממוצע זמן אימון"
              value={`${stats.averageDuration} דקות`}
              icon={<FaClock />}
              color="var(--secondary)"
            />
            <StatCard 
              title="סוג אימון מועדף"
              value={stats.favoriteType || 'אין מספיק נתונים'}
              icon={<FaHeartbeat />}
              color="var(--energy)"
            />
            <StatCard 
              title="רצף אימונים נוכחי"
              value={`${stats.currentStreak} ימים`}
              icon={<FaFire />}
              color="var(--power)"
            />
            <StatCard 
              title="רצף אימונים הארוך ביותר"
              value={`${stats.longestStreak} ימים`}
              icon={<FaTrophy />}
              color="var(--warning)"
            />
            
            {expandedStats && (
              <>
                <StatCard 
                  title="קלוריות שנשרפו"
                  value={`${stats.caloriesBurned} קק"ל`}
                  icon={<FaFire />}
                  color="#f59e0b"
                />
                <StatCard 
                  title="אימונים בחודש"
                  value={workoutHistory.filter(w => 
                    moment(w.workout_date).isAfter(moment().subtract(30, 'days'))
                  ).length}
                  icon={<FaCalendarAlt />}
                  color="#10b981"
                />
              </>
            )}
          </div>
          
          <button 
            className={styles.expandStatsButton}
            onClick={() => setExpandedStats(!expandedStats)}
            aria-expanded={expandedStats}
          >
            {expandedStats ? 'הצג פחות סטטיסטיקות' : 'הצג עוד סטטיסטיקות'}
          </button>
          
          <div className={styles.chartsContainer}>
            <ProgressCharts workoutHistory={workoutHistory} />
          </div>
          
          {personalizedTips.length > 0 && stats.totalWorkouts > 0 && (
            <div className={styles.tipsContainer}>
              <h3 className={styles.tipsTitle}>
                <FaLightbulb className={styles.tipsIcon} />
                המלצות מותאמות אישית
              </h3>
              <ul className={styles.tipsList}>
                {personalizedTips.map((tip, index) => (
                  <li key={index} className={styles.tipItem}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
          
          {potentialIssues.length > 0 && (
            <div className={styles.issuesContainer}>
              <h3 className={styles.issuesTitle}>
                <FaExclamationTriangle className={styles.issuesIcon} />
                נקודות לשיפור
              </h3>
              <ul className={styles.issuesList}>
                {potentialIssues.map((issue, index) => (
                  <li key={index} className={styles.issueItem}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          
          {stats.totalWorkouts === 0 && (
            <div className={styles.noDataMessage}>
              <FaLightbulb className={styles.lightbulbIcon} />
              <h3>טרם הוספת אימונים</h3>
              <p>הוסף את האימון הראשון שלך כדי להתחיל לעקוב אחר ההתקדמות</p>
              <button 
                className={styles.startButton}
                onClick={() => setShowAddForm(true)}
              >
                <FaPlus />
                הוסף אימון ראשון
              </button>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'history' && (
        <div className={styles.historySection}>
          <div className={styles.historyHeader}>
            <h2>היסטוריית אימונים</h2>
            
            <button 
              className={styles.filterToggleButton}
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
            >
              <FaFilter /> סינון והתאמה
            </button>
          </div>
          
          {showFilters && (
            <div className={styles.filtersContainer}>
              <div className={styles.searchBox}>
                <FaSearch className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="חיפוש אימונים..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                  aria-label="חיפוש אימונים"
                />
                {searchTerm && (
                  <button 
                    className={styles.clearSearchButton}
                    onClick={() => setSearchTerm('')}
                    aria-label="נקה חיפוש"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <div className={styles.filterOptions}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>סוג אימון:</label>
                  <div className={styles.filterButtons}>
                    <button 
                      className={`${styles.filterButton} ${filterType === 'all' ? styles.activeFilter : ''}`}
                      onClick={() => setFilterType('all')}
                    >
                      הכל
                    </button>
                    <button 
                      className={`${styles.filterButton} ${filterType === 'strength' ? styles.activeFilter : ''}`}
                      onClick={() => setFilterType('strength')}
                    >
                      חיזוק
                    </button>
                    <button 
                      className={`${styles.filterButton} ${filterType === 'cardio' ? styles.activeFilter : ''}`}
                      onClick={() => setFilterType('cardio')}
                    >
                      סיבולת
                    </button>
                    <button 
                      className={`${styles.filterButton} ${filterType === 'flexibility' ? styles.activeFilter : ''}`}
                      onClick={() => setFilterType('flexibility')}
                    >
                      גמישות
                    </button>
                    <button 
                      className={`${styles.filterButton} ${filterType === 'mixed' ? styles.activeFilter : ''}`}
                      onClick={() => setFilterType('mixed')}
                    >
                      משולב
                    </button>
                  </div>
                </div>
                
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>מיון:</label>
                  <div className={styles.filterButtons}>
                    <button 
                      className={`${styles.filterButton} ${sortDirection === 'desc' ? styles.activeFilter : ''}`}
                      onClick={() => setSortDirection('desc')}
                    >
                      <FaSortAmountDown /> מהחדש לישן
                    </button>
                    <button 
                      className={`${styles.filterButton} ${sortDirection === 'asc' ? styles.activeFilter : ''}`}
                      onClick={() => setSortDirection('asc')}
                    >
                      <FaSortAmountUp /> מהישן לחדש
                    </button>
                  </div>
                </div>
              </div>
              
              {/* מידע על הסינון הפעיל */}
              {(filterType !== 'all' || searchTerm) && (
                <div className={styles.activeFilters}>
                  <span>מסננים פעילים:</span>
                  
                  {filterType !== 'all' && (
                    <span className={styles.activeFilterBadge}>
                      סוג: {translateWorkoutType(filterType)}
                      <button 
                        className={styles.removeFilterButton}
                        onClick={() => setFilterType('all')}
                        aria-label="הסר סינון סוג"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  
                  {searchTerm && (
                    <span className={styles.activeFilterBadge}>
                      חיפוש: {searchTerm}
                      <button 
                        className={styles.removeFilterButton}
                        onClick={() => setSearchTerm('')}
                        aria-label="הסר סינון חיפוש"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  
                  <button 
                    className={styles.clearAllFiltersButton}
                    onClick={() => {
                      setFilterType('all');
                      setSearchTerm('');
                    }}
                  >
                    נקה הכל
                  </button>
                </div>
              )}
            </div>
          )}
          
          {filteredAndSortedWorkouts.length === 0 && workoutHistory.length === 0 ? (
            <div className={styles.noHistory}>
              <FaRegSadTear className={styles.noHistoryIcon} />
              <p>אין היסטוריית אימונים להצגה</p>
              <button 
                className={styles.addFirstButton}
                onClick={() => setShowAddForm(true)}
              >
                הוסף את האימון הראשון שלך
              </button>
            </div>
          ) : filteredAndSortedWorkouts.length === 0 ? (
            <div className={styles.noFilterResults}>
              <FaRegSadTear className={styles.noResultsIcon} />
              <p>לא נמצאו אימונים התואמים את הסינון</p>
              <button 
                className={styles.clearFiltersButton}
                onClick={() => {
                  setFilterType('all');
                  setSearchTerm('');
                }}
              >
                נקה סינון ומיון
              </button>
            </div>
          ) : (
            <div className={styles.historyList}>
              {filteredAndSortedWorkouts.map(workout => (
                <WorkoutHistoryItem
                  key={workout.id}
                  workout={workout}
                  onDelete={() => deleteWorkout(workout.id)}
                  onEdit={() => editWorkout(workout)}
                  onDuplicate={() => duplicateWorkout(workout)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'calendar' && (
        <div className={styles.calendarSection}>
          <WorkoutCalendar />
        </div>
      )}
    </div>
  );
}



export default WorkoutTracker;