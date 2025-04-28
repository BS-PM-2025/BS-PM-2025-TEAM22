import React, { useState, useEffect } from 'react';
import styles from './FacilityTraffic.module.css';

const FacilityTraffic = ({ facilityId }) => {
  const [trafficData, setTrafficData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());

  // נתונים לדוגמה - במערכת אמיתית היה נטען מהשרת לפי facilityId
  useEffect(() => {
    // דמה טעינת נתונים מהשרת
    setTimeout(() => {
      const demoData = generateDemoTrafficData();
      setTrafficData(demoData);
      setLoading(false);
    }, 800);
  }, [facilityId]);

  // פונקציה ליצירת נתוני תנועה לדוגמה
  const generateDemoTrafficData = () => {
    const days = [0, 1, 2, 3, 4, 5, 6]; // ימים 0=ראשון, 6=שבת
    const data = {};
    
    days.forEach(day => {
      data[day] = {};
      // יצירת נתונים לכל שעה בין 6:00 ל-23:00
      for (let hour = 6; hour <= 23; hour++) {
        // יצירת עומס רנדומלי עם דפוס הגיוני - יותר עמוס בשעות השיא
        let trafficLevel;
        if (hour >= 6 && hour <= 8) {
          // בוקר - עמוס בינוני
          trafficLevel = Math.floor(Math.random() * 50) + 30;
        } else if (hour >= 17 && hour <= 20) {
          // ערב - הכי עמוס
          trafficLevel = Math.floor(Math.random() * 50) + 50;
        } else if ([5, 6].includes(day) && hour >= 10 && hour <= 18) {
          // סופ"ש - עמוס בשעות היום
          trafficLevel = Math.floor(Math.random() * 60) + 40;
        } else {
          // שעות אחרות - פחות עמוס
          trafficLevel = Math.floor(Math.random() * 40);
        }
        
        data[day][hour] = trafficLevel;
      }
    });
    
    return data;
  };

  const getDayName = (dayIndex) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[dayIndex];
  };

  const getTrafficColor = (level) => {
    if (level < 30) return 'var(--success)'; // ירוק - לא עמוס
    if (level < 60) return 'var(--warning)'; // צהוב - עמוס בינוני
    return 'var(--error)'; // אדום - עמוס מאוד
  };

  const getTrafficLabel = (level) => {
    if (level < 30) return 'לא עמוס';
    if (level < 60) return 'עמוס בינוני';
    return 'עמוס מאוד';
  };

  if (loading) {
    return (
      <div className={styles.section}>
        <h4>עומס מבקרים</h4>
        <div className={styles.loadingIndicator}>
          <i className="fas fa-spinner fa-spin"></i> טוען נתוני עומס...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.trafficSection}>
      <h4>עומס מבקרים צפוי</h4>
      
      <div className={styles.daysSelector}>
        {[0, 1, 2, 3, 4, 5, 6].map(day => (
          <button
            key={day}
            className={`${styles.dayButton} ${day === selectedDay ? styles.selectedDay : ''}`}
            onClick={() => setSelectedDay(day)}
          >
            {getDayName(day)}
          </button>
        ))}
      </div>
      
      <div className={styles.trafficContainer}>
        {trafficData && Object.entries(trafficData[selectedDay] || {}).map(([hour, level]) => (
          <div key={hour} className={styles.trafficHour}>
            <div className={styles.hourLabel}>{hour}:00</div>
            <div className={styles.trafficBarContainer}>
              <div 
                className={styles.trafficBar} 
                style={{ 
                  width: `${level}%`,
                  backgroundColor: getTrafficColor(level)
                }}
              />
            </div>
            <div className={styles.trafficLevel}>
              {getTrafficLabel(level)}
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.trafficNote}>
        <i className="fas fa-info-circle"></i>
        <span>הנתונים מבוססים על ביקורים קודמים ועשויים להשתנות</span>
      </div>
    </div>
  );
};

export default FacilityTraffic;