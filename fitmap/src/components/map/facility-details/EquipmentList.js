// src/components/facility-details/EquipmentList.js
import React from 'react';
import styles from './EquipmentList.module.css'; // עדכן את הנתיב בהתאם למבנה התיקיות שלך
function EquipmentList({ equipment }) {
  // פונקציה לתרגום סוגי ציוד לעברית
  const translateEquipmentType = (type) => {
    const translations = {
      'pullup_bars': 'מתח',
      'parallel_bars': 'מקבילים',
      'horizontal_ladder': 'סולם אופקי',
      'ab_bench': 'ספסל בטן',
      'leg_press': 'מכשיר רגליים',
      'cardio_machines': 'מכשירי אירובי',
      'weight_machines': 'מכשירי משקולות',
      'elliptical': 'אליפטיקל',
    };
    
    return translations[type] || type;
  };

  const renderEquipment = () => {
    if (!equipment || equipment.length === 0) {
      return <p>אין מידע על ציוד במתקן זה</p>;
    }
    
    let equipmentArray;
    try {
      // המרת מחרוזת JSON למערך אם צריך
      if (typeof equipment === 'string') {
        equipmentArray = JSON.parse(equipment);
      } else {
        equipmentArray = equipment;
      }
      
      // אם אין מערך תקין, החזר הודעת שגיאה
      if (!Array.isArray(equipmentArray)) {
        console.error("נתוני ציוד אינם במבנה מערך:", equipment);
        return <p>פורמט ציוד לא תקין</p>;
      }
    } catch (error) {
      console.error("שגיאה בפענוח נתוני הציוד:", error);
      return <p>פורמט ציוד לא תקין</p>;
    }
    
    console.log("מבנה נתוני הציוד:", equipmentArray);
    
    return (
      <ul className={styles.equipmentList}>
        {equipmentArray.map((item, i) => {
          // טיפול ישיר במחרוזות
          if (typeof item === 'string') {
            return (
              <li key={i} className={styles.equipmentItem}>
                <i className="fas fa-dumbbell"></i> {translateEquipmentType(item)}
              </li>
            );
          }
          
          // טיפול באובייקטים
          if (item && typeof item === 'object') {
            // אם יש שדה 'type'
            if (item.type) {
              return (
                <li key={i} className={styles.equipmentItem}>
                  <i className="fas fa-dumbbell"></i> {translateEquipmentType(item.type)}
                  {item.count && <span className={styles.equipmentCount}> (כמות: {item.count})</span>}
                </li>
              );
            }
            
            // אם יש שדה 'name'
            if (item.name) {
              return (
                <li key={i} className={styles.equipmentItem}>
                  <i className="fas fa-dumbbell"></i> {translateEquipmentType(item.name)}
                  {item.quantity && <span className={styles.equipmentCount}> (כמות: {item.quantity})</span>}
                </li>
              );
            }
            
            // אם יש שדות אחרים - מציג את כל המידע
            return (
              <li key={i} className={styles.equipmentItem}>
                {Object.entries(item).map(([key, value]) => (
                  <span key={key}>
                    {translateEquipmentType(key)}: {value} 
                  </span>
                ))}
              </li>
            );
          }
          
          // אם הגענו לכאן, כנראה משהו לא תקין עם הפריט
          return (
            <li key={i} className={styles.equipmentItem}>
              פריט ציוד לא מזוהה
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className={styles.section}>
      <h4>ציוד זמין</h4>
      {renderEquipment()}
    </div>
  );
}

export default EquipmentList;