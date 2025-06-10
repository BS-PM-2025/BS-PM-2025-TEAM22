import React from "react";
import {
  FaEdit,
  FaMapMarkerAlt,
  FaCalendarAlt,

} from "react-icons/fa";
import styles from "./Profile.module.css";

function ProfileHeader({
  profileData,
  user,
  userProfile,
  onEditProfile,

  formatDateHebrew,
}) {
  const { name, avatarUrl, city, fitnessLevel } = profileData;

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

  const profileImage = avatarUrl || user?.user_metadata?.avatar_url || null;
  const userInitials = name
    ? name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <header className={styles.profileHeader}>
      <div className={styles.profileImageContainer}>
        {profileImage ? (
          <img
            src={profileImage}
            alt="תמונת פרופיל"
            className={styles.profileImage}
          />
        ) : (
          <div className={styles.profileImagePlaceholder}>{userInitials}</div>
        )}
      </div>

      <div className={styles.profileInfo}>
        <h1 className={styles.profileName}>
          {name || user.email.split("@")[0]}
        </h1>
        {fitnessLevel && (
          <span
            className={styles.fitnessLevelBadge}
            style={{ backgroundColor: getFitnessLevelColor(fitnessLevel) }}
          >
            {getFitnessLevelDisplay(fitnessLevel)}
          </span>
        )}
        <p className={styles.profileDetails}>
          {city && (
            <span className={styles.profileCity}>
              <FaMapMarkerAlt /> {city}
            </span>
          )}
          <span className={styles.profileJoined}>
            <FaCalendarAlt /> הצטרף ב-
            {formatDateHebrew(
              userProfile?.created_at || new Date().toISOString()
            )}
          </span>
        </p>

        <div className={styles.profileActions}>
          <button className={styles.editProfileButton} onClick={onEditProfile}>
            <FaEdit /> ערוך פרופיל
          </button>


        </div>
      </div>
    </header>
  );
}

export default ProfileHeader;
