// src/components/map/FitnessFilters.js - גרסה משודרגת
import React, { useState, useEffect } from "react";
import styles from "./styles/FitnessFilters.module.css";

// סוגי מתקנים מורחבים לכולל Google Places
const FACILITY_TYPES = [
  // מתקני כושר מסורתיים
  { id: "gym", label: "🏋️ חדרי כושר", icon: "🏋️" },

  { id: "spa", label: "🧖 ספא ועיסוי", icon: "🧖" },

  // מתקני ספורט חוצות
  { id: "park", label: "🌳 פארקי כושר", icon: "🌳" },
];

// ציוד מורחב
const EQUIPMENT_TYPES = [
  // ציוד כוח גופני
  { id: "pullup_bars", label: "מתח", category: "strength" },
  { id: "parallel_bars", label: "מקבילים", category: "strength" },
  { id: "horizontal_ladder", label: "סולם אופקי", category: "strength" },

  // ציוד אירובי
  { id: "cardio_machines", label: "מכשירי אירובי", category: "cardio" },

  // ציוד כוח
  { id: "weight_machines", label: "מכשירי משקל", category: "weights" },
  { id: "free_weights", label: "משקולות חופשיות", category: "weights" },

  // ציוד גמישות ויציבה

  { id: "stretching_area", label: "אזור מתיחות", category: "flexibility" },
];

// מאפיינים מורחבים
const FEATURES = [
  // מאפיינים סביבתיים
  { id: "indoor", label: "🏢 מקורה", category: "environment" },
  { id: "outdoor", label: "🌤️ חיצוני", category: "environment" },
  { id: "shaded", label: "🌳 מוצל", category: "environment" },

  // נגישות ונוחות
  { id: "accessible", label: "♿ נגיש לנכים", category: "accessibility" },
  { id: "parking", label: "🚗 חניה", category: "accessibility" },

  // שירותים
  { id: "restrooms", label: "🚽 שירותים", category: "amenities" },
  { id: "changing_rooms", label: "👕 חדרי הלבשה", category: "amenities" },
  { id: "showers", label: "🚿 מקלחות", category: "amenities" },
  { id: "lockers", label: "🗃️ ארונות", category: "amenities" },
  { id: "water_fountain", label: "🚰 ברזיית מים", category: "amenities" },

  // מאפיינים חברתיים
  { id: "benches", label: "🪑 ספסלים", category: "social" },
];

// קטגוריות לארגון הצגה
const EQUIPMENT_CATEGORIES = {
  strength: { label: "כוח גופני", icon: "💪" },
  cardio: { label: "אירובי", icon: "❤️" },
  weights: { label: "משקולות", icon: "🏋️" },
  flexibility: { label: "גמישות", icon: "🤸" },
  sports: { label: "ספורט", icon: "⚽" },
};

const FEATURE_CATEGORIES = {
  environment: { label: "סביבה", icon: "🌍" },
  accessibility: { label: "נגישות", icon: "♿" },
  amenities: { label: "שירותים", icon: "🛠️" },
  social: { label: "חברתי", icon: "👥" },
};

function FitnessFilters({ onFiltersChange, initialFilters }) {
  const [selectedTypes, setSelectedTypes] = useState(
    initialFilters?.types || []
  );
  const [selectedEquipment, setSelectedEquipment] = useState(
    initialFilters?.equipment || []
  );
  const [selectedFeatures, setSelectedFeatures] = useState(
    initialFilters?.features || []
  );
  const [distance, setDistance] = useState(initialFilters?.distance || 10);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({
    equipment: {},
    features: {},
  });

  // עדכון מדדי הסטטיסטיקה
  const [stats, setStats] = useState({
    totalSelected: 0,
    typesSelected: 0,
    equipmentSelected: 0,
    featuresSelected: 0,
  });

  // עדכון סטטיסטיקות
  useEffect(() => {
    const total =
      selectedTypes.length + selectedEquipment.length + selectedFeatures.length;
    setStats({
      totalSelected: total,
      typesSelected: selectedTypes.length,
      equipmentSelected: selectedEquipment.length,
      featuresSelected: selectedFeatures.length,
    });
  }, [selectedTypes, selectedEquipment, selectedFeatures]);

  // פונקציה כללית לעדכון פילטרים
  const updateFilters = (types, equipment, features, dist) => {
    if (onFiltersChange) {
      onFiltersChange({
        types,
        equipment,
        features,
        distance: dist,
      });
    }
  };

  // טיפול בשינוי סוג מתקן
  const handleTypeChange = (typeId) => {
    setSelectedTypes((prev) => {
      const newSelected = prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId];
      updateFilters(newSelected, selectedEquipment, selectedFeatures, distance);
      return newSelected;
    });
  };

  // טיפול בשינוי ציוד
  const handleEquipmentChange = (equipmentId) => {
    setSelectedEquipment((prev) => {
      const newSelected = prev.includes(equipmentId)
        ? prev.filter((id) => id !== equipmentId)
        : [...prev, equipmentId];
      updateFilters(selectedTypes, newSelected, selectedFeatures, distance);
      return newSelected;
    });
  };

  // טיפול בשינוי מאפיינים
  const handleFeatureChange = (featureId) => {
    setSelectedFeatures((prev) => {
      const newSelected = prev.includes(featureId)
        ? prev.filter((id) => id !== featureId)
        : [...prev, featureId];
      updateFilters(selectedTypes, selectedEquipment, newSelected, distance);
      return newSelected;
    });
  };

  // טיפול בשינוי מרחק
  const handleDistanceChange = (e) => {
    const newDistance = parseInt(e.target.value, 10);
    setDistance(newDistance);
    updateFilters(
      selectedTypes,
      selectedEquipment,
      selectedFeatures,
      newDistance
    );
  };

  // איפוס כל הפילטרים
  const resetAllFilters = () => {
    setSelectedTypes([]);
    setSelectedEquipment([]);
    setSelectedFeatures([]);
    setDistance(10);
    setSearchQuery("");
    updateFilters([], [], [], 10);
  };

  // פונקציה לבחירה מהירה של קטגוריה שלמה
  const selectAllInCategory = (category, items) => {
    const categoryItems = items
      .filter((item) => item.category === category)
      .map((item) => item.id);

    if (category in EQUIPMENT_CATEGORIES) {
      const newSelected = [
        ...new Set([...selectedEquipment, ...categoryItems]),
      ];
      setSelectedEquipment(newSelected);
      updateFilters(selectedTypes, newSelected, selectedFeatures, distance);
    } else if (category in FEATURE_CATEGORIES) {
      const newSelected = [...new Set([...selectedFeatures, ...categoryItems])];
      setSelectedFeatures(newSelected);
      updateFilters(selectedTypes, selectedEquipment, newSelected, distance);
    }
  };

  // פילטרים מהירים מוגדרים מראש

  // סינון על פי חיפוש טקסט
  const filteredTypes = FACILITY_TYPES.filter((type) =>
    type.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.filterPanel}>
      <div className={styles.filterTitle}>
        סינון מתקני כושר
        {stats.totalSelected > 0 && (
          <span className={styles.filterCount}>({stats.totalSelected})</span>
        )}
      </div>

      {/* שורת חיפוש */}
      <div className={styles.filterSection}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="🔍 חפש סוג מתקן..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* פילטרים מהירים */}
      <div className={styles.filterSection}></div>

      {/* מרחק */}
      <div className={styles.filterSection}>
        <div className={styles.filterSubtitle}>מרחק מהמיקום הנוכחי</div>
        <div className={styles.filterItem}>
          <input
            type="range"
            min="1"
            max="50"
            value={distance}
            onChange={handleDistanceChange}
            className={styles.distanceSlider}
          />
          <div className={styles.distanceLabels}>
            <span>1 ק"מ</span>
            <span className={styles.currentDistance}>{distance} ק"מ</span>
            <span>50 ק"מ</span>
          </div>
        </div>
      </div>

      {/* סוגי מתקנים */}
      <div className={styles.filterSection}>
        <div className={styles.filterSubtitle}>
          סוג מתקן
          {stats.typesSelected > 0 && (
            <span className={styles.sectionCount}>({stats.typesSelected})</span>
          )}
        </div>
        <div className={styles.facilityGrid}>
          {filteredTypes.map((type) => (
            <div key={type.id} className={styles.facilityCard}>
              <label
                className={`${styles.facilityLabel} ${
                  selectedTypes.includes(type.id) ? styles.selected : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type.id)}
                  onChange={() => handleTypeChange(type.id)}
                  className={styles.hiddenCheckbox}
                />
                <span className={styles.facilityIcon}>{type.icon}</span>
                <span className={styles.facilityText}>{type.label}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* ציוד לפי קטגוריות */}
      <div className={styles.filterSection}>
        <div className={styles.filterSubtitle}>
          ציוד
          {stats.equipmentSelected > 0 && (
            <span className={styles.sectionCount}>
              ({stats.equipmentSelected})
            </span>
          )}
        </div>
        {Object.entries(EQUIPMENT_CATEGORIES).map(([categoryId, category]) => {
          const categoryEquipment = EQUIPMENT_TYPES.filter(
            (eq) => eq.category === categoryId
          );
          const selectedInCategory = categoryEquipment.filter((eq) =>
            selectedEquipment.includes(eq.id)
          ).length;

          return (
            <div key={categoryId} className={styles.categorySection}>
              <div
                className={styles.categoryHeader}
                onClick={() =>
                  setExpandedCategories((prev) => ({
                    ...prev,
                    equipment: {
                      ...prev.equipment,
                      [categoryId]: !prev.equipment[categoryId],
                    },
                  }))
                }
              >
                <span className={styles.categoryIcon}>{category.icon}</span>
                <span className={styles.categoryLabel}>{category.label}</span>
                {selectedInCategory > 0 && (
                  <span className={styles.categoryCount}>
                    ({selectedInCategory})
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectAllInCategory(categoryId, EQUIPMENT_TYPES);
                  }}
                  className={styles.selectAllButton}
                >
                  בחר הכל
                </button>
                <span
                  className={`${styles.expandIcon} ${
                    expandedCategories.equipment[categoryId]
                      ? styles.expanded
                      : ""
                  }`}
                >
                  ▼
                </span>
              </div>
              {expandedCategories.equipment[categoryId] && (
                <div className={styles.categoryItems}>
                  {categoryEquipment.map((equipment) => (
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
              )}
            </div>
          );
        })}
      </div>

      {/* מאפיינים לפי קטגוריות */}
      <div className={styles.filterSection}>
        <div className={styles.filterSubtitle}>
          מאפיינים
          {stats.featuresSelected > 0 && (
            <span className={styles.sectionCount}>
              ({stats.featuresSelected})
            </span>
          )}
        </div>
        {Object.entries(FEATURE_CATEGORIES).map(([categoryId, category]) => {
          const categoryFeatures = FEATURES.filter(
            (f) => f.category === categoryId
          );
          const selectedInCategory = categoryFeatures.filter((f) =>
            selectedFeatures.includes(f.id)
          ).length;

          return (
            <div key={categoryId} className={styles.categorySection}>
              <div
                className={styles.categoryHeader}
                onClick={() =>
                  setExpandedCategories((prev) => ({
                    ...prev,
                    features: {
                      ...prev.features,
                      [categoryId]: !prev.features[categoryId],
                    },
                  }))
                }
              >
                <span className={styles.categoryIcon}>{category.icon}</span>
                <span className={styles.categoryLabel}>{category.label}</span>
                {selectedInCategory > 0 && (
                  <span className={styles.categoryCount}>
                    ({selectedInCategory})
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectAllInCategory(categoryId, FEATURES);
                  }}
                  className={styles.selectAllButton}
                >
                  בחר הכל
                </button>
                <span
                  className={`${styles.expandIcon} ${
                    expandedCategories.features[categoryId]
                      ? styles.expanded
                      : ""
                  }`}
                >
                  ▼
                </span>
              </div>
              {expandedCategories.features[categoryId] && (
                <div className={styles.categoryItems}>
                  {categoryFeatures.map((feature) => (
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
              )}
            </div>
          );
        })}
      </div>

      {/* כפתור איפוס */}
      {stats.totalSelected > 0 && (
        <button onClick={resetAllFilters} className={styles.resetButton}>
          🗑️ נקה את כל הפילטרים ({stats.totalSelected})
        </button>
      )}
    </div>
  );
}

export default FitnessFilters;
