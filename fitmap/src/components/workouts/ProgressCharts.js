// src/components/workouts/ProgressCharts.js
import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip,  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import styles from './styles/ProgressCharts.module.css';

/**
 * רכיב גרפים להצגת התקדמות אימונים
 * @param {Array} workoutHistory - היסטוריית אימונים
 */
function ProgressCharts({ workoutHistory }) {
  const [timeData, setTimeData] = useState([]);
  const [typeData, setTypeData] = useState([]);
  const [frequencyData, setFrequencyData] = useState([]);
  const [activeChart, setActiveChart] = useState('time');
  
  // נוסיף מצב לרזולוציית הנתונים
  const [dataResolution, setDataResolution] = useState('optimized');

  useEffect(() => {
    if (!workoutHistory || workoutHistory.length === 0) {
      return;
    }

    // עיבוד הנתונים לגרף משך אימון
    processTimeData();

    // עיבוד הנתונים לגרף סוגי אימון
    processTypeData();

    // עיבוד הנתונים לגרף תדירות אימונים
    processFrequencyData();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutHistory, dataResolution]);

  // עיבוד נתוני זמן אימון - עם אופטימיזציה לקריאות
  const processTimeData = () => {
    // עובד עם העתק של המערך כדי לא לשנות את המקור
    let sortedWorkouts = [...workoutHistory].sort(
      (a, b) => new Date(a.workout_date) - new Date(b.workout_date)
    );

    // אם יש יותר מדי נתונים ובחרנו באופטימיזציה, נדלל את הנתונים
    if (dataResolution === 'optimized' && sortedWorkouts.length > 7) {
      // נדלל את הנתונים לפי מספר סביר להצגה
      const sampleRate = Math.ceil(sortedWorkouts.length / 7);
      sortedWorkouts = sortedWorkouts.filter((_, index) => index % sampleRate === 0);
      
      // נוסיף בהכרח את האימון האחרון אם הוא לא נכלל בדגימה
      if (workoutHistory.length > 0 && sortedWorkouts[sortedWorkouts.length - 1] !== workoutHistory[workoutHistory.length - 1]) {
        sortedWorkouts.push(workoutHistory[workoutHistory.length - 1]);
      }
    }

    // זיהוי ערכי מקסימום ומינימום לסימון מיוחד
    const allMinutes = sortedWorkouts.map(workout => workout.duration_minutes);
    const maxMinutes = Math.max(...allMinutes);
    const minMinutes = Math.min(...allMinutes);

    const data = sortedWorkouts.map(workout => ({
      date: formatDate(workout.workout_date),
      minutes: workout.duration_minutes,
      name: workout.workout_name,
      isMax: workout.duration_minutes === maxMinutes,
      isMin: workout.duration_minutes === minMinutes
    }));

    setTimeData(data);
  };

  // עיבוד נתוני סוגי אימון
  const processTypeData = () => {
    const typeCount = workoutHistory.reduce((acc, workout) => {
      const type = workout.workout_type || 'לא מוגדר';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // מיון הסוגים לפי מספר האימונים (מהגבוה לנמוך)
    const sortedTypes = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        type: translateWorkoutType(type),
        count,
        // הוספת אחוז
        percentage: ((count / workoutHistory.length) * 100).toFixed(1)
      }));

    setTypeData(sortedTypes);
  };

  // עיבוד נתוני תדירות אימונים
  const processFrequencyData = () => {
    // יצירת אובייקט המכיל את מספר האימונים לפי חודש
    const monthCounts = workoutHistory.reduce((acc, workout) => {
      if (!workout.workout_date) return acc;

      const date = new Date(workout.workout_date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {});

    // המרה למערך נתונים לגרף
    const data = Object.entries(monthCounts).map(([monthKey, count]) => {
      const [year, month] = monthKey.split('-');
      return {
        month: getMonthName(parseInt(month) - 1),
        year: year,
        count,
        // שימוש במפתח מלא לצורך מיון
        fullMonthKey: monthKey
      };
    });

    // מיון לפי סדר כרונולוגי של הזמן
    const sortedData = data.sort((a, b) => {
      return a.fullMonthKey.localeCompare(b.fullMonthKey);
    });

    // אופטימיזציה: אם יש יותר מדי חודשים, נציג רק את האחרונים
    const optimizedData = dataResolution === 'optimized' && sortedData.length > 8 
      ? sortedData.slice(-8) 
      : sortedData;

    setFrequencyData(optimizedData);
  };

  // פונקציית עזר לפורמט תאריך
  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  // פונקציית עזר לקבלת שם חודש בעברית
  const getMonthName = (monthIndex) => {
    const months = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    return months[monthIndex] || '';
  };

  // פונקציית עזר לתרגום סוג אימון לעברית
  const translateWorkoutType = (type) => {
    const translations = {
      'strength': 'חיזוק',
      'cardio': 'סיבולת',
      'flexibility': 'גמישות',
      'mixed': 'משולב'
    };

    return translations[type] || type;
  };

  // פונקציית עזר לצבעים מותאמים לסוג אימון
  const getTypeColor = (type) => {
    const colors = {
      'חיזוק': '#9747FF',
      'סיבולת': '#f97316',
      'גמישות': '#10b981',
      'משולב': '#06b6d4'
    };
    return colors[type] || '#3b82f6';
  };

  // יצירת טולטיפ מותאם לגרף זמן אימון
  const CustomTimeTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipDate}>{`תאריך: ${label}`}</p>
          <p className={styles.tooltipValue}>{`${payload[0].value} דקות`}</p>
          {data.name && (
            <p className={styles.tooltipName}>{data.name}</p>
          )}
          {data.isMax && <p className={styles.tooltipBadge}>זמן שיא! 🎉</p>}
          {data.isMin && <p className={styles.tooltipBadge}>זמן מינימלי</p>}
        </div>
      );
    }
    return null;
  };

  // יצירת טולטיפ מותאם לגרף סוגי אימון
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className={styles.pieTooltip}>
          <div className={styles.pieTooltipTitle}>
            <span 
              className={styles.pieTooltipColor} 
              style={{ backgroundColor: data.payload.fill || data.color }}
            ></span>
            <span>{data.name}</span>
          </div>
          <div className={styles.pieTooltipValue}>
            {data.value} אימונים
          </div>
          <div className={styles.pieTooltipPercentage}>
            {(data.percent * 100).toFixed(1)}%
          </div>
        </div>
      );
    }
    return null;
  };

  // יצירת טולטיפ מותאם לגרף תדירות אימונים
  const CustomFrequencyTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipTitle}>{`${label} ${data.year}`}</p>
          <p className={styles.tooltipValue}>{`${payload[0].value} אימונים`}</p>
        </div>
      );
    }
    return null;
  };

  // רנדור כותרת מותאמת של גרף עם אפשרות לשנות רזולוציה
  const renderChartTitle = (title) => (
    <div className={styles.chartHeader}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <div className={styles.chartControls}>
        <button 
          className={`${styles.dataResolutionButton} ${dataResolution === 'optimized' ? styles.activeResolution : ''}`}
          onClick={() => setDataResolution('optimized')}
          title="תצוגה מיטבית - פחות נקודות נתונים לקריאות טובה"
        >
          תצוגה מיטבית
        </button>
        <button 
          className={`${styles.dataResolutionButton} ${dataResolution === 'full' ? styles.activeResolution : ''}`}
          onClick={() => setDataResolution('full')}
          title="תצוגה מלאה - כל נקודות הנתונים"
        >
          תצוגה מלאה
        </button>
      </div>
    </div>
  );

  // מתן ערך ל-dot בהתאם אם זה מקס, מין או רגיל
  const renderDot = (props) => {
    const { cx, cy, payload } = props;
    
    if (payload.isMax) {
      return (
        <circle 
          cx={cx} 
          cy={cy} 
          r={6} 
          fill="#9747FF" 
          stroke="#fff" 
          strokeWidth={2}
          className={styles.maxDot}
        />
      );
    }
    
    if (payload.isMin) {
      return (
        <circle 
          cx={cx} 
          cy={cy} 
          r={5} 
          fill="#f97316" 
          stroke="#fff" 
          strokeWidth={2}
          className={styles.minDot}
        />
      );
    }
    
    // נקודות רגילות יוצגו רק בריחוף או במצב תצוגה מלאה
    if (dataResolution === 'full') {
      return (
        <circle 
          cx={cx} 
          cy={cy} 
          r={4} 
          fill="#3b82f6" 
          stroke="#85412f" 
          strokeWidth={6}
        />
      );
    }
    
    return null;
  };

  // בדיקה אם יש נתונים להצגה
  if (!workoutHistory || workoutHistory.length < 2) {
    return (
      <div className={styles.noDataContainer}>
        <p>אין מספיק נתונים להצגת גרפים</p>
        <p>יש צורך בלפחות 2 אימונים להצגת התקדמות</p>
      </div>
    );
  }

  return (
    <div className={styles.chartsContainer}>
      <div className={styles.chartTypeTabs}>
        <button 
          className={`${styles.chartTab} ${activeChart === 'time' ? styles.activeTab : ''}`}
          onClick={() => setActiveChart('time')}
        >
          <span className={styles.chartTabIcon}>⏱️</span>
          משך אימון
        </button>
        <button 
          className={`${styles.chartTab} ${activeChart === 'type' ? styles.activeTab : ''}`}
          onClick={() => setActiveChart('type')}
        >
          <span className={styles.chartTabIcon}>📊</span>
          סוגי אימון
        </button>
        <button 
          className={`${styles.chartTab} ${activeChart === 'frequency' ? styles.activeTab : ''}`}
          onClick={() => setActiveChart('frequency')}
        >
          <span className={styles.chartTabIcon}>📅</span>
          תדירות
        </button>
      </div>

      <div className={styles.chartContainer}>
        {activeChart === 'time' && (
          <div className={`${styles.timeChart} ${styles.streamlinedChart}`}>
            {renderChartTitle('התקדמות זמן אימון')}
            
            <div className={styles.chartLegend}>
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.maxDot}`}></span>
                <span>זמן שיא</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.minDot}`}></span>
                <span>זמן מינימלי</span>
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.regularDot}`}></span>
                <span>אימון רגיל</span>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={timeData}
                margin={{ top: 15, right: 25, left: 2, bottom: 25}}
                className={styles.improvedLineChart}
              >
                <defs>
                  <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9747FF" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#9747FF" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 50, fill: '#6b7280' }}
                  height={50}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis 
                  label={{ 
                    value: 'דקות', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#6b7280', fontSize: 12, fontWeight: 500 } 
                  }} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  width={45}
                />
                <Tooltip content={<CustomTimeTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="minutes" 
                  name="משך האימון (דקות)" 
                  stroke="#9747FF" 
                  strokeWidth={5}
                  dot={renderDot}
                  activeDot={{ r: 8, stroke: '#fff', strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeChart === 'type' && (
          <div className={styles.typeChart}>
            {renderChartTitle('התפלגות סוגי אימון')}
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={110}
                  innerRadius={dataResolution === 'optimized' ? 30 : 0} // דונאט אופציונלי
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="type"
                  paddingAngle={5} // רווח בין החלקים
                  label={({ type, percent, index }) => {
                    // מציג תווית רק אם האחוז גדול מסף מסוים
                    if (percent < 0.08) return null;
                    return `${type}`;
                  }}
                >
                  {typeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getTypeColor(entry.type)} 
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className={styles.typeLegend}>
              {typeData.map((item, index) => (
                <div key={index} className={styles.typeLegendItem}>
                  <div className={styles.typeLegendType}>
                    <span 
                      className={styles.typeLegendColor} 
                      style={{ backgroundColor: getTypeColor(item.type) }}
                    ></span>
                    <span className={styles.typeLegendLabel}>{item.type}</span>
                  </div>
                  <span className={styles.typeLegendValue}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeChart === 'frequency' && (
          <div className={styles.frequencyChart}>
            {renderChartTitle('תדירות אימונים לפי חודש')}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={frequencyData}
                margin={{ top: 10, right: 2, left: 1, bottom: 1 }}
                barCategoryGap="50%"
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  height={50}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 15, fill: '#6b7280' }}
                  width={30}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomFrequencyTooltip />} />
                <Bar 
                  dataKey="count" 
                  name="מספר אימונים" 
                  fill="url(#barGradient)" 
                  radius={[4, 4, 0, 0]}
                  barSize={dataResolution === 'optimized' ? 35 : 25}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* הוראות והסברים */}
      <div className={styles.chartInstructions}>
        <div className={styles.instructionIcon}>💡</div>
        <div className={styles.instructionText}>
          <p><strong>טיפ:</strong> בחר בין "תצוגה מיטבית" ל"תצוגה מלאה" כדי לשלוט בכמות הנתונים המוצגת. תצוגה מיטבית תציג פחות נקודות לקריאות טובה יותר.</p>
        </div>
      </div>
    </div>
  );
}

export default ProgressCharts;