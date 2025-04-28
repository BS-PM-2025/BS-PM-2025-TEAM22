// src/components/map/FitnessFilters.js
import React, { useState } from 'react';
import styles from '../../styles/FitnessFilters.module.css';

// סוגי מתקני כושר לפילטור
const FACILITY_TYPES = [
  { id: 'calisthenics', label: 'מתקני כושר גופני (מתח, מקבילים)' },
  { id: 'cardio', label: 'מתקני אירובי' },
  { id: 'strength', label: 'מתקני כוח' },
  { id: 'flexibility', label: 'מתקני גמישות' },
  { id: 'seniorFitness', label: 'מתקנים לגיל השלישי' }
];

const EQUIPMENT_TYPES = [
  { id: 'pullup_bars', label: 'מתח' },
  { id: 'parallel_bars', label: 'מקבילים' },
  { id: 'horizontal_ladder', label: 'סולם אופקי' },
  { id: 'ab_bench', label: 'ספסל בטן' },
  { id: 'leg_press', label: 'מכשיר רגליים' },
  { id: 'cardio_machines', label: 'מכשירי אירובי' },
  { id: 'elliptical', label: 'אליפטיקל' }
];

const FEATURES = [
  { id: 'shaded', label: 'מוצל' },
  { id: 'accessible', label: 'נגיש לנכים' },
  { id: 'lit', label: 'מואר בלילה' },
  { id: 'water_fountain', label: 'ברזיית מים' },
  { id: 'benches', label: 'ספסלים' },
  { id: 'restrooms', label: 'שירותים' }
];

function FitnessFilters({ onFiltersChange }) {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [distance, setDistance] = useState(10); // ברירת מחדל - 10 ק"מ

  // טיפול בשינוי בחירת סוג מתקן
  const handleTypeChange = (typeId) => {
    setSelectedTypes(prevSelectedTypes => {
      let newSelectedTypes;
      
      if (prevSelectedTypes.includes(typeId)) {
        // הסרת הסוג אם הוא כבר נבחר
        newSelectedTypes = prevSelectedTypes.filter(id => id !== typeId);
      } else {
        // הוספת הסוג אם הוא לא נבחר
        newSelectedTypes = [...prevSelectedTypes, typeId];
      }
      
      updateFilters(newSelectedTypes, selectedEquipment, selectedFeatures, distance);
      return newSelectedTypes;
    });
  };

  // טיפול בשינוי בחירת ציוד
  const handleEquipmentChange = (equipmentId) => {
    setSelectedEquipment(prevSelected => {
      let newSelected;
      
      if (prevSelected.includes(equipmentId)) {
        newSelected = prevSelected.filter(id => id !== equipmentId);
      } else {
        newSelected = [...prevSelected, equipmentId];
      }
      
      updateFilters(selectedTypes, newSelected, selectedFeatures, distance);
      return newSelected;
    });
  };

  // טיפול בשינוי בחירת מאפיינים
  const handleFeatureChange = (featureId) => {
    setSelectedFeatures(prevSelected => {
      let newSelected;
      
      if (prevSelected.includes(featureId)) {
        newSelected = prevSelected.filter(id => id !== featureId);
      } else {
        newSelected = [...prevSelected, featureId];
      }
      
      updateFilters(selectedTypes, selectedEquipment, newSelected, distance);
      return newSelected;
    });
  };

  // טיפול בשינוי מרחק
  const handleDistanceChange = (e) => {
    const newDistance = parseInt(e.target.value, 10);
    setDistance(newDistance);
    updateFilters(selectedTypes, selectedEquipment, selectedFeatures, newDistance);
  };

  // עדכון הפילטרים בקומפוננטת האב
  const updateFilters = (types, equipment, features, dist) => {
    if (onFiltersChange) {
      onFiltersChange({
        types,
        equipment,
        features,
        distance: dist
      });
    }
  };

  return (
    <div className={styles.filterPanel}>
      <div className={styles.filterTitle}>סינון מתקני כושר</div>
      
      <div className={styles.filterSection}>
        <div className={styles.filterSubtitle}>סוג מתקן</div>
        {FACILITY_TYPES.map(type => (
          <div key={type.id} className={styles.filterItem}>
            <label>
              <input
                type="checkbox"
                checked={selectedTypes.includes(type.id)}
                onChange={() => handleTypeChange(type.id)}
              />
              {type.label}
            </label>
          </div>
        ))}
      </div>
      
      <div className={styles.filterSection}>
        <div className={styles.filterSubtitle}>ציוד</div>
        {EQUIPMENT_TYPES.map(equipment => (
          <div key={equipment.id} className={styles.filterItem}>
            <label>
              <input
                type="checkbox"
                checked={selectedEquipment.includes(equipment.id)}
                onChange={() => handleEquipmentChange(equipment.id)}
              />
              {equipment.label}
            </label>
          </div>
        ))}
      </div>
      
      <div className={styles.filterSection}>
        <div className={styles.filterSubtitle}>מאפיינים</div>
        {FEATURES.map(feature => (
          <div key={feature.id} className={styles.filterItem}>
            <label>
              <input
                type="checkbox"
                checked={selectedFeatures.includes(feature.id)}
                onChange={() => handleFeatureChange(feature.id)}
              />
              {feature.label}
            </label>
          </div>
        ))}
      </div>
      
      <div className={styles.filterSection}>
        <div className={styles.filterSubtitle}>מרחק מהמיקום הנוכחי (ק"מ)</div>
        <div className={styles.filterItem}>
          <input
            type="range"
            min="1"
            max="50"
            value={distance}
            onChange={handleDistanceChange}
          />
          <span>{distance} ק"מ</span>
        </div>
      </div>
    </div>
  );
}

export default FitnessFilters;