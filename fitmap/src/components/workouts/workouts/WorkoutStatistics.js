// src/components/workouts/WorkoutStatistics.js
import React, { useMemo } from 'react';
import moment from 'moment';
import 'moment/locale/he'; // תמיכה בעברית
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FaChartBar, FaRunning, FaDumbbell, FaCalendarCheck } from 'react-icons/fa';
import styles from './styles/WorkoutStatistics.module.css';

moment.locale('he');

/**
 * קומפוננטה להצגת סטטיסטיקות אימונים
 */
const WorkoutStatistics = ({ workouts }) => {
  // חישוב סטטיסטיקות כלליות
  const generalStats = useMemo(() => {
    if (!workouts || workouts.length === 0) return {};
    
    const totalWorkouts = workouts.length;
    
    // סוגי אימונים
    const workoutTypes = workouts.reduce((acc, workout) => {
      const type = workout.workout_type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // חישוב ממוצע אימונים לשבוע
    const firstWorkoutDate = new Date(Math.min(...workouts.map(w => new Date(w.start).getTime())));
    const lastWorkoutDate = new Date(Math.max(...workouts.map(w => new Date(w.start).getTime())));
    const totalWeeks = Math.max(1, moment(lastWorkoutDate).diff(moment(firstWorkoutDate), 'weeks') + 1);
    const workoutsPerWeek = (totalWorkouts / totalWeeks).toFixed(1);
    
    // חישוב אימונים בחודש האחרון
    const thirtyDaysAgo = moment().subtract(30, 'days').startOf('day');
    const workoutsLast30Days = workouts.filter(w => 
      moment(w.start).isAfter(thirtyDaysAgo)
    ).length;
    
    // חישוב אורך אימון ממוצע (אם יש נתונים)
    let averageDuration = 0;
    const workoutsWithDuration = workouts.filter(w => w.workout && w.workout.duration);
    
    if (workoutsWithDuration.length > 0) {
      const totalMinutes = workoutsWithDuration.reduce((total, w) => {
        // מניחים שהמשך מאוחסן כמספר או כמחרוזת שאפשר להמיר למספר
        const duration = parseInt(w.workout.duration, 10) || 0;
        return total + duration;
      }, 0);
      
      averageDuration = Math.round(totalMinutes / workoutsWithDuration.length);
    }
    
    // היום עם הכי הרבה אימונים
    const workoutsByDay = workouts.reduce((acc, workout) => {
      const dayOfWeek = moment(workout.start).format('dddd');
      acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1;
      return acc;
    }, {});
    
    const mostActiveDay = Object.entries(workoutsByDay).sort((a, b) => b[1] - a[1])[0] || [];
    
    return {
      totalWorkouts,
      workoutTypes,
      workoutsPerWeek,
      workoutsLast30Days,
      averageDuration,
      mostActiveDay: mostActiveDay[0] || 'אין מידע'
    };
  }, [workouts]);
  
  // נתונים לתרשים עוגה - סוגי אימונים
  const pieChartData = useMemo(() => {
    if (!generalStats.workoutTypes) return [];
    
    const workoutTypeNames = {
      strength: 'חיזוק',
      cardio: 'סיבולת',
      flexibility: 'גמישות',
      mixed: 'משולב',
      other: 'אחר'
    };
    
    return Object.entries(generalStats.workoutTypes).map(([type, count]) => ({
      name: workoutTypeNames[type] || type,
      value: count
    }));
  }, [generalStats.workoutTypes]);
  
  // נתונים לגרף אימונים לפי חודשים
  const monthlyData = useMemo(() => {
    if (!workouts || workouts.length === 0) return [];
    
    // יצירת מילון של 6 חודשים אחרונים
    const last6Months = [];
    for (let i = 0; i < 6; i++) {
      const monthDate = moment().subtract(i, 'months');
      last6Months.push({
        month: monthDate.format('YYYY-MM'),
        name: monthDate.format('MMM'),
        count: 0
      });
    }
    
    // ספירת אימונים לפי חודש
    workouts.forEach(workout => {
      const workoutMonth = moment(workout.start).format('YYYY-MM');
      const monthEntry = last6Months.find(m => m.month === workoutMonth);
      if (monthEntry) {
        monthEntry.count += 1;
      }
    });
    
    // סידור לפי סדר כרונולוגי (מהישן לחדש)
    return [...last6Months].reverse();
  }, [workouts]);
  
  // צבעים לתרשים העוגה
  const COLORS = ['#9747FF', '#f97316', '#10b981', '#06b6d4', '#3b82f6'];
  
  // נתונים לגרף ימים בשבוע
  const weekdaysData = useMemo(() => {
    if (!workouts || workouts.length === 0) return [];
    
    // יצירת מילון של ימי השבוע
    const daysOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const weekdays = daysOrder.map(day => ({ name: day, count: 0 }));
    
    // ספירת אימונים לפי יום בשבוע
    workouts.forEach(workout => {
      const dayIndex = moment(workout.start).day();
      // התאמה לסדר הימים בישראל (ראשון = 0)
      weekdays[dayIndex].count += 1;
    });
    
    return weekdays;
  }, [workouts]);
  
  // בדיקה אם יש נתונים להצגה
  if (!workouts || workouts.length === 0) {
    return (
      <div className={styles.emptyStats}>
        <FaChartBar className={styles.emptyIcon} />
        <p>אין נתוני אימונים להצגת סטטיסטיקות</p>
      </div>
    );
  }
  
  return (
    <div className={styles.statisticsContainer}>
      <h3 className={styles.statisticsTitle}>סטטיסטיקות אימונים</h3>
      
      {/* כרטיסי סטטיסטיקה */}
      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaCalendarCheck />
          </div>
          <div className={styles.statInfo}>
            <h4>סה"כ אימונים</h4>
            <p className={styles.statValue}>{generalStats.totalWorkouts}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaRunning />
          </div>
          <div className={styles.statInfo}>
            <h4>ב-30 ימים אחרונים</h4>
            <p className={styles.statValue}>{generalStats.workoutsLast30Days}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaChartBar />
          </div>
          <div className={styles.statInfo}>
            <h4>ממוצע שבועי</h4>
            <p className={styles.statValue}>{generalStats.workoutsPerWeek}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaDumbbell />
          </div>
          <div className={styles.statInfo}>
            <h4>אורך אימון ממוצע</h4>
            <p className={styles.statValue}>
              {generalStats.averageDuration ? `${generalStats.averageDuration} דקות` : 'אין נתונים'}
            </p>
          </div>
        </div>
      </div>
      
      {/* תרשימים */}
      <div className={styles.chartsContainer}>
        {/* גרף עמודות - אימונים לפי חודש */}
        <div className={styles.chartBox}>
          <h4 className={styles.chartTitle}>אימונים ב-6 חודשים אחרונים</h4>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={monthlyData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 30,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} אימונים`, 'מספר אימונים']}
                  labelFormatter={(label) => `חודש ${label}`}
                />
                <Legend />
                <Bar dataKey="count" name="מספר אימונים" fill="#3b82f6" barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* תרשים עוגה - סוגי אימונים */}
        <div className={styles.chartBox}>
          <h4 className={styles.chartTitle}>התפלגות סוגי אימונים</h4>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} אימונים`, 'מספר אימונים']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* גרף עמודות - אימונים לפי ימים בשבוע */}
        <div className={`${styles.chartBox} ${styles.fullWidth}`}>
          <h4 className={styles.chartTitle}>אימונים לפי ימים בשבוע</h4>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={weekdaysData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 30,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} אימונים`, 'מספר אימונים']}
                  labelFormatter={(label) => `יום ${label}`}
                />
                <Legend />
                <Bar dataKey="count" name="מספר אימונים" fill="#10b981" barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* מידע נוסף */}
      <div className={styles.additionalInfo}>
        <p><strong>היום הפעיל ביותר:</strong> יום {generalStats.mostActiveDay}</p>
        <p><strong>טיפ:</strong> התמדה באימונים קבועים 3-4 פעמים בשבוע תביא לתוצאות הטובות ביותר לאורך זמן.</p>
      </div>
    </div>
  );
};

export default WorkoutStatistics;