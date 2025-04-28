import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import {
  FaEdit,
  FaSignOutAlt,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaRunning,
  FaDumbbell,
  FaHeartbeat,
  FaChartLine,
  FaSave,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import styles from "../../styles/Profile.module.css";
import Favorites from "./Favorites";

function Profile() {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("beginner");
  const [preferredWorkouts, setPreferredWorkouts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const workoutTypes = [
    {
      id: "calisthenics",
      label: "כושר גופני (מתח, מקבילים)",
      icon: <FaRunning />,
    },
    { id: "cardio", label: "אירובי", icon: <FaHeartbeat /> },
    { id: "strength", label: "כוח", icon: <FaDumbbell /> },
    { id: "flexibility", label: "גמישות", icon: <FaRunning /> },
    { id: "seniorFitness", label: "כושר לגיל השלישי", icon: <FaRunning /> },
  ];

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth");
    }

    if (userProfile) {
      setName(userProfile.name || "");
      setPhone(userProfile.phone || "");
      setFitnessLevel(userProfile.fitness_level || "beginner");
      setPreferredWorkouts(userProfile.preferred_workouts || []);
    }
  }, [user, userProfile, loading, navigate]);

  const handleWorkoutTypeChange = (e) => {
    const { value, checked } = e.target;
    setPreferredWorkouts((prev) =>
      checked ? [...prev, value] : prev.filter((type) => type !== value)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          phone,
          fitness_level: fitnessLevel,
          preferred_workouts: preferredWorkouts,
        })
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setIsEditing(false);

      // נשתמש בהודעת הצלחה מעוצבת במקום אלרט רגיל
      const successMessage = document.createElement("div");
      successMessage.className = styles.successMessage;
      successMessage.textContent = "הפרופיל עודכן בהצלחה";
      document.querySelector(`.${styles.profileCard}`).prepend(successMessage);

      // נסיר את ההודעה אחרי 3 שניות
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("אירעה שגיאה בעדכון הפרופיל");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // המרה של רמת הכושר לעברית
  const getFitnessLevelDisplay = (level) => {
    const levels = {
      beginner: "מתחיל",
      intermediate: "בינוני",
      advanced: "מתקדם",
    };
    return levels[level] || "לא מוגדר";
  };

  // המרה של רמת הכושר לצבע
  const getFitnessLevelColor = (level) => {
    const colors = {
      beginner: "#4CAF50",
      intermediate: "#2196F3",
      advanced: "#FF5722",
    };
    return colors[level] || "#9E9E9E";
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>טוען נתוני פרופיל...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userInitials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <div className={styles.container}>
      <div className={styles.profileHeader}>
        <div className={styles.userAvatarLarge}>{userInitials}</div>
        <h1 className={styles.profileTitle}>
          {name || user.email.split("@")[0]}
          <span
            className={styles.fitnessLevelBadge}
            style={{ backgroundColor: getFitnessLevelColor(fitnessLevel) }}
          >
            {getFitnessLevelDisplay(fitnessLevel)}
          </span>
        </h1>
      </div>

      <div className={styles.profileCard}>
        <div className={styles.cardHeader}>
          <h2>פרטים אישיים</h2>
          {!isEditing && (
            <button
              className={styles.editButton}
              onClick={() => setIsEditing(true)}
              aria-label="ערוך פרופיל"
            >
              <FaEdit /> <span>ערוך</span>
            </button>
          )}
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="name">
                  <FaUser className={styles.formIcon} />
                  שם מלא
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.input}
                  placeholder="שם מלא"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">
                  <FaEnvelope className={styles.formIcon} />
                  אימייל
                </label>
                <input
                  id="email"
                  type="email"
                  value={user.email}
                  className={`${styles.input} ${styles.disabled}`}
                  disabled
                />
                <small className={styles.helperText}>
                  לא ניתן לשנות אימייל
                </small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone">
                  <FaPhone className={styles.formIcon} />
                  טלפון
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={styles.input}
                  placeholder="טלפון"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="fitnessLevel">
                  <FaChartLine className={styles.formIcon} />
                  רמת כושר
                </label>
                <select
                  id="fitnessLevel"
                  value={fitnessLevel}
                  onChange={(e) => setFitnessLevel(e.target.value)}
                  className={styles.select}
                >
                  <option value="beginner">מתחיל</option>
                  <option value="intermediate">בינוני</option>
                  <option value="advanced">מתקדם</option>
                </select>
              </div>
            </div>

            <div className={styles.workoutPreferences}>
              <h3>סוגי אימון מועדפים</h3>
              <div className={styles.checkboxGroup}>
                {workoutTypes.map((type) => (
                  <div key={type.id} className={styles.checkboxWithIcon}>
                    <input
                      type="checkbox"
                      id={type.id}
                      value={type.id}
                      checked={preferredWorkouts.includes(type.id)}
                      onChange={handleWorkoutTypeChange}
                    />
                    <label htmlFor={type.id}>
                      <span className={styles.checkboxIcon}>{type.icon}</span>
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.buttonContainer}>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className={styles.buttonSpinner}></div>
                    שומר...
                  </>
                ) : (
                  <>
                    <FaSave /> שמור שינויים
                  </>
                )}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setIsEditing(false)}
                disabled={submitting}
              >
                <FaTimes /> ביטול
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.profileContent}>
            <div className={styles.profileInfoGrid}>
              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>
                  <FaUser />
                </div>
                <div className={styles.infoContent}>
                  <h4>שם</h4>
                  <p>{name || "לא מוגדר"}</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>
                  <FaEnvelope />
                </div>
                <div className={styles.infoContent}>
                  <h4>אימייל</h4>
                  <p>{user.email}</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>
                  <FaPhone />
                </div>
                <div className={styles.infoContent}>
                  <h4>טלפון</h4>
                  <p>{phone || "לא מוגדר"}</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.infoIcon}>
                  <FaChartLine />
                </div>
                <div className={styles.infoContent}>
                  <h4>רמת כושר</h4>
                  <p className={styles.fitnessLevel}>
                    <span
                      className={styles.levelIndicator}
                      style={{
                        backgroundColor: getFitnessLevelColor(fitnessLevel),
                      }}
                    ></span>
                    {getFitnessLevelDisplay(fitnessLevel)}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.workoutPreferencesView}>
              <h3>אימונים מועדפים</h3>
              {preferredWorkouts.length > 0 ? (
                <div className={styles.workoutTagsList}>
                  {preferredWorkouts.map((workout) => {
                    const workoutType = workoutTypes.find(
                      (t) => t.id === workout
                    );
                    return (
                      <div key={workout} className={styles.workoutTag}>
                        <span className={styles.workoutTagIcon}>
                          {workoutType?.icon}
                        </span>
                        <span>{workoutType?.label || workout}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.noPreferences}>
                  <p>לא נבחרו אימונים מועדפים</p>
                  <button
                    className={styles.addPreferencesButton}
                    onClick={() => setIsEditing(true)}
                  >
                    <FaEdit /> הוסף העדפות
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.actionRow}>
          <button className={styles.logoutButton} onClick={handleSignOut}>
            <FaSignOutAlt /> התנתק
          </button>
        </div>
      </div>

      {/* כרטיסיות פעילות אחרונה */}
      <div className={styles.activityCards}>
        <div className={styles.activityCard}>
          <h3>פעילות אחרונה</h3>
          <div className={styles.activityList}>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>
                <FaRunning />
              </div>
              <div className={styles.activityDetails}>
                <h4>ביקרת במתקן כושר בפארק הירקון</h4>
                <span className={styles.activityTime}>לפני 3 ימים</span>
              </div>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityIcon}>
                <FaHeartbeat />
              </div>
              <div className={styles.activityDetails}>
                <h4>הצטרפת לאימון קבוצתי</h4>
                <span className={styles.activityTime}>לפני שבוע</span>
              </div>
            </div>
          </div>
        </div>

        <section className={styles.activityCard}>
          <h3>מתקני כושר מועדפים</h3>
          <div className={styles.facilityList}>
            <Favorites />
          </div>
        </section>
      </div>
      <div className={styles.facilityItem}>
        <div className={styles.facilityMeta}></div>
      </div>
    </div>
  );
}

export default Profile;
