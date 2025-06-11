import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  FaCog,
  FaQuestionCircle,
  FaArrowRight,
} from "react-icons/fa";
import { supabase } from "../../utils/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import styles from "./styles/RoleSelection.module.css";

function RoleSelection() {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  const [signingOut, setSigningOut] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [, setNotifications] = useState([]);

  // אנימציית כניסה
  useEffect(() => {
    setTimeout(() => {
      setAnimateIn(true);
    }, 100);
  }, []);

  // טעינת התראות
  useEffect(() => {
    if (user) {
      const loadNotifications = async () => {
        try {
          const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5);

          if (error) throw error;
          setNotifications(data || []);
        } catch (error) {
          console.error("שגיאה בטעינת התראות:", error.message);
        }
      };

      loadNotifications();
      // loadUserStats();
    }
  }, [user]);
  /*
  const loadUserStats = async () => {
    if (!user) return;

    try {
      // קבלת מידע על פעילות אחרונה
      const { data: activityData, error: activityError } = await supabase
        .from("user_activities")
        .select("activity_date")
        .eq("user_id", user.id)
        .order("activity_date", { ascending: false })
        .limit(10);

      if (activityError) throw activityError;

      if (activityData && activityData.length > 0) {
        // חישוב רצף ימים
        const lastDate = new Date(activityData[0].activity_date);
        setLastActivityDate(lastDate);

        let streak = 1;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // אם הפעילות האחרונה הייתה היום, נחשב רצף
        if (
          lastDate.toDateString() === today.toDateString() ||
          (today - lastDate) / (1000 * 60 * 60 * 24) <= 1
        ) {
          // נבדוק רצף ימים קודמים
          const dateMap = new Map();

          activityData.forEach((item) => {
            const date = new Date(item.activity_date);
            date.setHours(0, 0, 0, 0);
            dateMap.set(date.toDateString(), true);
          });

          let checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - 1);

          while (dateMap.has(checkDate.toDateString())) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          }
        } else {
          streak = 0;
        }

        setDailyStreak(streak);
      }

      const { data: statsData, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (statsError && statsError.code !== "PGRST116") {
        throw statsError;
      }

      setUserStats(
        statsData || {
          workout_count: 0,
          total_workout_minutes: 0,
          favorite_workout_type: null,
          streak_days: 0,
        }
      );
    } catch (error) {
      console.error("שגיאה בטעינת סטטיסטיקות:", error.message);
    }
  };
*/
  const handleSignOut = async () => {
    setSigningOut(true);
    setTimeout(async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        navigate("/");
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
      color: "var(--accent)",
    },
    {
      icon: <FaUserCog />,
      title: "פרופיל משתמש",
      description: "עדכן פרטים והגדרות",
      path: "/profile",
      color: "var(--power)",
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
      color: "var(--royal)",
    },
    {
      icon: <FaTrophy />,
      title: "אתגרים קהילתיים",
      description: "הצטרף לאתגרים וסיים מטרות",
      path: "/challenges",
      color: "var(--energy)",
    },
    {
      icon: <FaUsers />,
      title: "אימונים קבוצתיים",
      description: "הצטרף לאימונים עם אחרים",
      path: "/group-workouts",
      color: "var(--nature)",
    },
  ];

  if (userProfile?.role === "facility_manager") {
    quickLinks.unshift({
      icon: <FaBuilding />,
      title: "ניהול מתקן",
      description: "נהל את המתקן שלך",
      path: "/facility/dashboard",
      color: "var(--secondary)",
    });
  }

  if (userProfile?.role === "admin") {
    quickLinks.unshift({
      icon: <FaCog />,
      title: "ניהול מערכת",
      description: "גישה לממשק ניהול",
      path: "/admin/dashboard",
      color: "var(--royal-dark)",
    });
  }

  // דף מצב טעינה
  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner}></div>
        <h3>טוען...</h3>
      </div>
    );
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

            <div className={styles.headerActions}>
              <button className={styles.logoutButton} onClick={handleSignOut}>
                <FaSignOutAlt /> התנתק
              </button>
            </div>
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
                  <div className={styles.cardAction}>
                    כניסה <FaArrowRight />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* אזור עזרה ותמיכה */}
          <section className={styles.helpSection}>
            <div className={styles.helpCard}>
              <div className={styles.helpIcon}>
                <FaQuestionCircle />
              </div>
              <div className={styles.helpContent}>
                <h3>צריך עזרה?</h3>
                <p>
                  יש לך שאלות או בעיות? צוות התמיכה שלנו זמין כדי לעזור לך בכל
                  נושא.
                </p>
                <Link to="/support" className={styles.helpButton}>
                  צור קשר
                </Link>
              </div>
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
              <p>
                מצא מתקנים קרובים, עקוב אחר ההתקדמות שלך והצטרף לאימונים
                קבוצתיים
              </p>
              <Link to="/signup/user" className={styles.cardButton}>
                הרשם כמשתמש
              </Link>
            </div>

            <div className={styles.roleCard}>
              <div className={styles.cardIcon}>
                <FaBuilding />
              </div>
              <h3>מנהל מתקן</h3>
              <p>נהל מתקני ספורט, פרסם עדכונים וארגן אירועים קהילתיים</p>
              <Link to="/signup/facility_manager" className={styles.cardButton}>
                הרשם כמנהל
              </Link>
            </div>
          </div>

          <div className={styles.featuresSection}>
            <h2 className={styles.featuresTitle}>למה להצטרף?</h2>
            <div className={styles.featuresList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <FaMapMarkedAlt />
                </div>
                <h3>מצא מתקנים קרובים</h3>
                <p>איתור מתקני כושר ציבוריים בקרבת מקום בקלות</p>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <FaCalendarAlt />
                </div>
                <h3>מעקב אימונים</h3>
                <p>תיעוד ומעקב אחר ההתקדמות האישית שלך</p>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <FaUsers />
                </div>
                <h3>קהילה פעילה</h3>
                <p>הצטרף לאימונים קבוצתיים ומפגשים ספורטיביים</p>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <FaTrophy />
                </div>
                <h3>אתגרים והישגים</h3>
                <p>השג מטרות, צבור נקודות וקבל תגמולים</p>
              </div>
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
