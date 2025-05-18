// src/components/auth/RoleSelection.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUser,
  FaBuilding,
  FaSignOutAlt,
  FaMapMarkedAlt,
  FaStar,
  FaUserCog,
  FaDumbbell,
  FaCalendarAlt,
  FaBrain,
  FaTrophy,
  FaUsers,
} from "react-icons/fa";
import { supabase } from "../../utils/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import styles from "../../styles/RoleSelection.module.css";

function RoleSelection() {
  const { user, userProfile } = useAuth();

  const [signingOut, setSigningOut] = useState(false);
  const [animateIn] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    setTimeout(async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error) {
        console.error("שגיאה בהתנתקות:", error.message);
      } finally {
        setSigningOut(false);
      }
    }, 800);
  };

  const quickLinks = [
    {
      icon: <FaMapMarkedAlt />,
      title: "מפת מתקנים",
      description: "חפש מתקני כושר בקרבתך",
      path: "/fitness-map",
      color: "var(--primary)",
    },
    {
      icon: <FaStar />,
      title: "המועדפים שלי",
      description: "צפה במתקנים ששמרת",
      path: "/favorites",
      color: "var(--warning)",
    },
    {
      icon: <FaUserCog />,
      title: "פרופיל משתמש",
      description: "עדכן פרטים והגדרות",
      path: "/profile",
      color: "var(--accent)",
    },
    {
      icon: <FaDumbbell />,
      title: "ספריית תרגילים",
      description: "גלה תרגילים חדשים",
      path: "/exercises",
      color: "var(--info)",
    },
    {
      icon: <FaCalendarAlt />,
      title: "מעקב אימונים",
      description: "נהל את האימונים שלך",
      path: "/workout-tracker",
      color: "var(--success)",
    },
    {
      icon: <FaBrain />,
      title: "מאמן אישי",
      description: "קבל תוכנית אימון מותאמת",
      path: "/personal-trainer",
      color: "var(--purple)",
    },
    {
      icon: <FaTrophy />,
      title: "אתגרים קהילתיים",
      description: "הצטרף לאתגרים וסיים מטרות",
      path: "/challenges",
      color: "var(--gold)",
    },
    {
      icon: <FaUsers />,
      title: "אימונים קבוצתיים",
      description: "הצטרף לאימונים עם אחרים",
      path: "/group-workouts",
      color: "var(--teal)",
    },
  ];

  if (userProfile?.role === "facility_manager") {
    quickLinks.push({
      icon: <FaBuilding />,
      title: "ניהול מתקן",
      description: "נהל את המתקן שלך",
      path: "/facility/dashboard",
      color: "var(--secondary)",
    });
  }

  return (
    <div className={`${styles.container} ${animateIn ? styles.animateIn : ""}`}>
      {signingOut && (
        <div className={styles.alertOverlay}>
          <div className={styles.alert}>
            <FaSignOutAlt className={styles.alertIcon} />
            <div className={styles.alertText}>מתנתק...</div>
          </div>
        </div>
      )}

      {user ? (
        <>
          <section className={styles.welcomeSection}>
            <div className={styles.welcomeHeader}>
              <div className={styles.userAvatarLarge}>
                {userProfile?.name?.charAt(0) || user.email?.charAt(0)}
              </div>
              <div className={styles.welcomeText}>
                <h1>
                  שלום,{" "}
                  <span className={styles.userName}>
                    {userProfile?.name || user.email?.split("@")[0]}
                  </span>
                </h1>
                <p className={styles.userRole}>
                  {userProfile?.role === "facility_manager" && (
                    <>
                      <FaBuilding /> מנהל מתקן
                    </>
                  )}
                  {userProfile?.role === "admin" && (
                    <>
                      <FaUserCog /> מנהל מערכת
                    </>
                  )}
                  {(!userProfile?.role || userProfile?.role === "user") && (
                    <>
                      <FaUser /> משתמש רגיל
                    </>
                  )}
                </p>
              </div>
            </div>

            <button className={styles.logoutButton} onClick={handleSignOut}>
              <FaSignOutAlt /> התנתק
            </button>
          </section>

          <section className={styles.dashboardSection}>
            <h2 className={styles.sectionTitle}>ניווט מהיר</h2>
            <div className={styles.quickLinks}>
              {quickLinks.map((link, idx) => (
                <Link
                  to={link.path}
                  className={styles.dashboardCard}
                  key={idx}
                  style={{ "--card-color": link.color }}
                >
                  <div
                    className={styles.dashboardIcon}
                    style={{ "--icon-color": link.color }}
                  >
                    {link.icon}
                  </div>
                  <h3>{link.title}</h3>
                  <p>{link.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className={styles.guestSection}>
          <div className={styles.hero}>
            <img
              src="/Fmap.png"
              alt="Urban Fitness"
              className={styles.heroImage}
            />
            <div className={styles.heroContent}>
              <h1>מתקני כושר עירוניים</h1>
              <p>מצא מתקנים ציבוריים, תכנן אימונים, והצטרף לקהילה בריאה.</p>
            </div>
          </div>

          <h2 className={styles.roleTitle}>הצטרף אלינו</h2>

          <div className={styles.roleCards}>
            <div className={styles.roleCard}>
              <div className={styles.cardIcon}>
                <FaUser />
              </div>
              <h3>משתמש רגיל</h3>
              <p>מצא מתקנים קרובים והצטרף לאימונים קבוצתיים</p>
              <Link to="/signup/user" className={styles.cardButton}>
                הרשם כמשתמש
              </Link>
            </div>

            <div className={styles.roleCard}>
              <div className={styles.cardIcon}>
                <FaBuilding />
              </div>
              <h3>מנהל מתקן</h3>
              <p>נהל מתקני ספורט ופרסם עדכונים</p>
              <Link to="/signup/facility_manager" className={styles.cardButton}>
                הרשם כמנהל
              </Link>
            </div>
          </div>

          <p className={styles.loginLink}>
            כבר רשום?{" "}
            <Link to="/auth" className={styles.inlineLink}>
              התחבר כאן
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}

export default RoleSelection;
