// 1. קובץ EditProfileModal.js - הרכיב עצמו

import React, { useState, useEffect } from "react";
import {
  FaSave,
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaVenusMars,
  FaIdCard,
  FaCity,
} from "react-icons/fa";
import styles from "./EditProfileForm.module.css";

function EditProfileModal({
  profileData,
  user,
  submitting,
  workoutTypes,
  onWorkoutTypeChange,
  onSubmit,
  onCancel,
}) {
  // אתחול מידע הטופס עם ערכי ברירת מחדל במקרה הצורך
  const [formData, setFormData] = useState({
    name: profileData?.name || "",
    phone: profileData?.phone || "",
    fitnessLevel:
      profileData?.fitnessLevel || profileData?.fitness_level || "beginner",
    preferredWorkouts:
      profileData?.preferredWorkouts || profileData?.preferred_workouts || [],
    birthDate: profileData?.birthDate || profileData?.birth_date || "",
    gender: profileData?.gender || "",
    idNumber: profileData?.idNumber || profileData?.id_number || "",
    city: profileData?.city || "",
    avatarUrl: profileData?.avatarUrl || profileData?.avatar_url || "",
  });

  // עדכון בעת שינוי ב-profileData
  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || "",
        phone: profileData.phone || "",
        fitnessLevel:
          profileData.fitnessLevel || profileData.fitness_level || "beginner",
        preferredWorkouts:
          profileData.preferredWorkouts || profileData.preferred_workouts || [],
        birthDate: profileData.birthDate || profileData.birth_date || "",
        gender: profileData.gender || "",
        idNumber: profileData.idNumber || profileData.id_number || "",
        city: profileData.city || "",
        avatarUrl: profileData.avatarUrl || profileData.avatar_url || "",
      });
      console.log("Form data updated from props:", profileData);
    }
  }, [profileData]);

  // טיפול בשינויים בשדות הטופס
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // הכנת הנתונים לשליחה לשרת
  const handleFormSubmit = (e) => {
    e.preventDefault();

    // המרה לפורמט הנכון לשרת
    const serverData = {
      name: formData.name,
      phone: formData.phone,
      fitness_level: formData.fitnessLevel,
      preferred_workouts: Array.isArray(formData.preferredWorkouts)
        ? formData.preferredWorkouts.map((id) => String(id))
        : [],
      birth_date: formData.birthDate,
      gender: formData.gender,
      id_number: formData.idNumber,
      city: formData.city,
      avatar_url: formData.avatarUrl,
      email: user?.email || "",
    };

    console.log("Submitting data to server:", serverData);
    onSubmit(serverData);
  };

  // בדיקה אם סוג אימון נבחר
  const isWorkoutSelected = (typeId) => {
    if (!Array.isArray(formData.preferredWorkouts)) {
      return false;
    }

    const typeIdString = String(typeId);
    return formData.preferredWorkouts.some((id) => String(id) === typeIdString);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.editProfileModal}>
        <div className={styles.modalHeader}>
          <h2>עריכת פרופיל</h2>
          <button className={styles.closeButton} onClick={onCancel}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          <form className={styles.editProfileForm} onSubmit={handleFormSubmit}>
            <h3 className={styles.sectionTitle}>פרטים אישיים</h3>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>
                  <FaUser /> שם מלא
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="הכנס שם מלא"
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  <FaEnvelope /> אימייל
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  <FaPhone /> טלפון
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="הכנס מספר טלפון"
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  <FaCalendarAlt /> תאריך לידה
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  <FaVenusMars /> מין
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">בחר</option>
                  <option value="male">זכר</option>
                  <option value="female">נקבה</option>
                  <option value="other">אחר</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>
                  <FaIdCard /> תעודת זהות
                </label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  placeholder="מספר תעודת זהות"
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  <FaCity /> עיר מגורים
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="הכנס שם עיר"
                />
              </div>
            </div>

            <h3 className={styles.sectionTitle}>העדפות כושר</h3>

            <div className={styles.formGroup}>
              <label>רמת כושר</label>
              <select
                name="fitnessLevel"
                value={formData.fitnessLevel}
                onChange={handleChange}
              >
                <option value="beginner">מתחיל</option>
                <option value="intermediate">בינוני</option>
                <option value="advanced">מתקדם</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>אימונים מועדפים</label>
              <div className={styles.workoutOptions}>
                {workoutTypes &&
                  workoutTypes.map((type) => (
                    <label key={type.id} className={styles.checkboxItem}>
                      <input
                        type="checkbox"
                        value={type.id}
                        checked={isWorkoutSelected(type.id)}
                        onChange={() => {
                          // קביעת המצב החדש של הבחירה
                          const newState = !isWorkoutSelected(type.id);
                          const typeIdString = String(type.id);

                          // עדכון מצב הטופס המקומי
                          setFormData((prev) => {
                            const currentWorkouts = Array.isArray(
                              prev.preferredWorkouts
                            )
                              ? [...prev.preferredWorkouts]
                              : [];

                            if (newState) {
                              // הוספת סוג האימון אם הוא לא קיים כבר
                              if (!currentWorkouts.includes(typeIdString)) {
                                return {
                                  ...prev,
                                  preferredWorkouts: [
                                    ...currentWorkouts,
                                    typeIdString,
                                  ],
                                };
                              }
                            } else {
                              // הסרת סוג האימון
                              return {
                                ...prev,
                                preferredWorkouts: currentWorkouts.filter(
                                  (id) => String(id) !== typeIdString
                                ),
                              };
                            }

                            return prev; // אם לא נדרש שינוי
                          });

                          // קריאה לפונקציה ההורית
                          if (typeof onWorkoutTypeChange === "function") {
                            onWorkoutTypeChange(type.id, newState);
                          }
                        }}
                      />
                      {type.label}
                    </label>
                  ))}
              </div>
            </div>

            <div className={styles.buttonsRow}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onCancel}
                disabled={submitting}
              >
                <FaArrowLeft /> ביטול
              </button>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className={styles.loadingSpinner}></span> שומר...
                  </>
                ) : (
                  <>
                    <FaSave /> שמור שינויים
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;
