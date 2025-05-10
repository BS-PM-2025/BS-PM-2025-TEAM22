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
import styles from "./Profile.module.css";

function EditProfileModal({
  profileData,
  user,
  submitting,
  workoutTypes,
  onWorkoutTypeChange,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState({ ...profileData });

  useEffect(() => {
    setFormData({ ...profileData });
  }, [profileData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // המרה לפורמט המתאים לשרת
    const serverData = {
      name: formData.name,
      phone: formData.phone,
      fitness_level: formData.fitnessLevel,
      preferred_workouts: formData.preferredWorkouts,
      birth_date: formData.birthDate,
      gender: formData.gender,
      id_number: formData.idNumber,
      city: formData.city,
      avatar_url: formData.avatarUrl,
      email: user.email,
    };

    onSubmit(serverData);
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
                {workoutTypes.map((type) => (
                  <label key={type.id} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      value={type.id}
                      checked={formData.preferredWorkouts.includes(type.id)}
                      onChange={(e) => {
                        const { value, checked } = e.target;
                        if (checked) {
                          setFormData((prev) => ({
                            ...prev,
                            preferredWorkouts: [
                              ...prev.preferredWorkouts,
                              value,
                            ],
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            preferredWorkouts: prev.preferredWorkouts.filter(
                              (t) => t !== value
                            ),
                          }));
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
