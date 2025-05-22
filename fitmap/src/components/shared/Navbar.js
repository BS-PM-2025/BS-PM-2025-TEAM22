// src/components/Navbar.js
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import {
  FaUser,
  FaStar,
  FaSignOutAlt,
  FaChevronDown,
  FaMap,
  FaUsers,
  FaCog,
  FaInfoCircle,
  FaBuilding,
  FaFileContract,
  FaMoon,
  FaDumbbell,
  FaChartLine,
  FaSun,
  FaTrophy,
  FaRunning,
  FaRobot,
  FaComments,
  FaBell,
  FaSearch,
  FaHome,
  FaUserPlus,
  FaHeart,
  FaComment,
  FaEnvelope,
  FaCheck,
  FaClock,
} from "react-icons/fa";
import styles from "./styles/Navbar.module.css";

const Navbar = ({ toggleTheme, theme }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [fitnessDropdownOpen, setFitnessDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // שימוש בהוק התראות מהמערכת
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef();
  const fitnessDropdownRef = useRef();
  const notificationsRef = useRef();
  const searchRef = useRef();

  // האזנה לשינויים במצב האימות
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
      }
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // סגירת התפריטים בעת שינוי מסלול
  useEffect(() => {
    setMenuOpen(false);
    setProfileDropdownOpen(false);
    setFitnessDropdownOpen(false);
    setNotificationsOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  // סגירת התפריטים הנפתחים בלחיצה מחוץ לאלמנט
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (
        fitnessDropdownRef.current &&
        !fitnessDropdownRef.current.contains(event.target)
      ) {
        setFitnessDropdownOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        !event.target.classList.contains(styles.searchToggle)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // שליפת פרופיל המשתמש מ-Supabase
  const fetchUserProfile = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  // טיפול בהתנתקות
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  // פתיחת/סגירת תפריט המשתמש
  const toggleProfileDropdown = (e) => {
    e.stopPropagation();
    setProfileDropdownOpen(!profileDropdownOpen);
    if (fitnessDropdownOpen) setFitnessDropdownOpen(false);
    if (notificationsOpen) setNotificationsOpen(false);
  };

  // פתיחת/סגירת תפריט הכושר
  const toggleFitnessDropdown = (e) => {
    e.stopPropagation();
    setFitnessDropdownOpen(!fitnessDropdownOpen);
    if (profileDropdownOpen) setProfileDropdownOpen(false);
    if (notificationsOpen) setNotificationsOpen(false);
  };

  // פתיחת/סגירת תפריט התראות
  const toggleNotifications = (e) => {
    e.stopPropagation();
    setNotificationsOpen(!notificationsOpen);
    if (profileDropdownOpen) setProfileDropdownOpen(false);
    if (fitnessDropdownOpen) setFitnessDropdownOpen(false);
  };

  // פונקציות עבור רכיב ההתראות המשופר
  const getNotificationIcon = (type) => {
    switch (type) {
      case "follow":
        return <FaUserPlus />;
      case "like":
        return <FaHeart />;
      case "comment":
        return <FaComment />;
      case "challenge_complete":
        return <FaTrophy />;
      case "new_message":
        return <FaEnvelope />;
      default:
        return <FaBell />;
    }
  };

  const getIconBackground = (type) => {
    switch (type) {
      case "follow":
        return "var(--primary)";
      case "like":
        return "#ff4757";
      case "comment":
        return "#3498db";
      case "challenge_complete":
        return "#f39c12";
      case "new_message":
        return "#1abc9c";
      default:
        return "var(--primary)";
    }
  };

  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case "follow":
        return notification.related_user_id
          ? `/profile/${notification.related_user_id}`
          : notification.sender_id
          ? `/profile/${notification.sender_id}`
          : "#";
      case "like":
      case "comment":
        return notification.post_id
          ? `/posts/${notification.post_id}`
          : notification.related_post_id
          ? `/posts/${notification.related_post_id}`
          : "#";
      case "challenge_complete":
        const challengeId =
          notification.related_post_id || notification.related_user_id;
        return challengeId ? `/challenges/${challengeId}` : "#";
      case "new_message":
        return notification.related_user_id
          ? `/chat/${notification.related_user_id}`
          : notification.sender_id
          ? `/chat/${notification.sender_id}`
          : "#";
      default:
        return "/notifications";
    }
  };

  // הפונקציה המשופרת לתוכן ההתראה - כוללת שם השולח
  const getNotificationMessage = (notification) => {
    // שם השולח, עם ברירת מחדל אם אין
    const senderName =
      notification.sender?.name || notification.sender_name || "משתמש";

    switch (notification.type) {
      case "follow":
        return (
          <span className={styles.richMessage}>
            <span className={styles.senderName}>{senderName}</span> התחיל לעקוב
            אחריך
          </span>
        );
      case "like":
        return (
          <span className={styles.richMessage}>
            <span className={styles.senderName}>{senderName}</span> אהב את הפוסט
            שלך
          </span>
        );
      case "comment":
        return (
          <span className={styles.richMessage}>
            <span className={styles.senderName}>{senderName}</span> הגיב על
            הפוסט שלך
          </span>
        );
      case "challenge_complete":
        return (
          <span className={styles.richMessage}>
            <span className={styles.senderName}>{senderName}</span> השלים אתגר!
          </span>
        );
      case "new_message":
        return (
          <span className={styles.richMessage}>
            <span className={styles.senderName}>{senderName}</span>:{" "}
            {notification.content || "שלח לך הודעה חדשה"}
          </span>
        );
      default:
        // במקרה שיש כותרת או תוכן בהתראה
        if (notification.content) {
          return (
            <span className={styles.richMessage}>{notification.content}</span>
          );
        }
        if (notification.title) {
          return (
            <span className={styles.richMessage}>{notification.title}</span>
          );
        }
        // ברירת מחדל
        return <span className={styles.richMessage}>התראה חדשה</span>;
    }
  };

  // פורמט תאריך יחסי משופר
  const formatTimeAgo = (isoTime) => {
    if (!isoTime) return "";

    const now = new Date();
    const date = new Date(isoTime);
    const diff = Math.floor((now - date) / 1000); // הפרש בשניות

    // בדיקה אם מדובר באותו יום
    const isToday = now.toDateString() === date.toDateString();
    const isYesterday =
      new Date(now - 86400000).toDateString() === date.toDateString();

    if (diff < 60) {
      return "הרגע";
    } else if (diff < 3600) {
      return `לפני ${Math.floor(diff / 60)} דקות`;
    } else if (diff < 86400) {
      return `לפני ${Math.floor(diff / 3600)} שעות`;
    } else if (isToday) {
      // שעה ביום הנוכחי
      return `היום בשעה ${date.getHours()}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    } else if (isYesterday) {
      // שעה באתמול
      return `אתמול בשעה ${date.getHours()}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    } else {
      // פורמט תאריך רגיל לדברים ישנים יותר
      return date.toLocaleDateString("he-IL", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
    }
  };

  // טיפול בלחיצה על התראה
  const handleNotificationClick = (notificationId) => {
    if (notificationId) {
      markAsRead(notificationId);
    }
    setNotificationsOpen(false);
  };

  const role = profile?.role || "user";

  // בדיקה אם הנתיב הנוכחי שייך לקטגוריית הכושר
  const isFitnessPath = () => {
    const fitnessPaths = [
      "/exercises",
      "/workout-tracker",
      "/challenges",
      "/group-workouts",
      "/personal-trainer",
    ];
    return fitnessPaths.some((path) => location.pathname.startsWith(path));
  };

  // חישוב שם תצוגה של המשתמש
  const displayName =
    profile?.name || (user?.email ? user.email.split("@")[0] : "משתמש");

  // בניית אווטאר המשתמש
  const userInitial =
    profile?.name?.charAt(0) || (user?.email ? user.email.charAt(0) : "U");

  return (
    <header
      className={`${styles.header} ${theme === "dark" ? styles.darkMode : ""}`}
    >
      <div className={styles.container}>
        {/* לוגו */}
        <Link to="/" className={styles.logo}>
          <img
            src="/FM1.png"
            alt="לוגו מתקני כושר עירוניים"
            className={styles.logoImage}
          />
          <span className={styles.logoText}>FitMap</span>
        </Link>

        {/* כפתור תפריט למובייל */}
        <div className={styles.mobileControls}>
          <button className={styles.searchToggle} aria-label="פתח חיפוש">
            <FaSearch />
          </button>

          <button
            className={`${styles.menuToggle} ${menuOpen ? styles.open : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "סגור תפריט" : "פתח תפריט"}
            aria-expanded={menuOpen}
          >
            <span className={styles.menuBar}></span>
            <span className={styles.menuBar}></span>
            <span className={styles.menuBar}></span>
          </button>
        </div>

        {/* תפריט ניווט */}
        <nav
          className={`${styles.nav} ${menuOpen ? styles.menuOpen : ""}`}
          aria-label="תפריט ראשי"
        >
          <ul className={styles.navList}>
            <li>
              <Link
                to="/"
                className={location.pathname === "/" ? styles.active : ""}
              >
                <FaHome className={styles.navIcon} />
                <span>דף הבית</span>
              </Link>
            </li>

            <li>
              <Link
                to="/fitness-map"
                className={
                  location.pathname === "/fitness-map" ? styles.active : ""
                }
              >
                <FaMap className={styles.navIcon} />
                <span>מפת מתקנים</span>
              </Link>
            </li>

            {/* תפריט כושר ואימונים */}
            <li className={styles.hasSubmenu} ref={fitnessDropdownRef}>
              <button
                className={`${styles.submenuButton} ${
                  isFitnessPath() ? styles.active : ""
                }`}
                onClick={toggleFitnessDropdown}
                aria-expanded={fitnessDropdownOpen}
                aria-haspopup="true"
              >
                <FaDumbbell className={styles.navIcon} />
                <span>אימונים וכושר</span>
                <FaChevronDown
                  className={`${styles.submenuChevron} ${
                    fitnessDropdownOpen ? styles.rotated : ""
                  }`}
                />
              </button>

              {fitnessDropdownOpen && (
                <ul className={styles.submenu} aria-label="תפריט אימונים וכושר">
                  <li>
                    <Link
                      to="/personal-trainer"
                      className={
                        location.pathname.startsWith("/personal-trainer")
                          ? styles.activeSubmenu
                          : ""
                      }
                    >
                      <FaRobot className={styles.submenuIcon} /> מאמן אישי
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/exercises"
                      className={
                        location.pathname.startsWith("/exercises")
                          ? styles.activeSubmenu
                          : ""
                      }
                    >
                      <FaDumbbell className={styles.submenuIcon} /> ספריית
                      תרגילים
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/workout-tracker"
                      className={
                        location.pathname === "/workout-tracker"
                          ? styles.activeSubmenu
                          : ""
                      }
                    >
                      <FaChartLine className={styles.submenuIcon} /> מעקב
                      אימונים
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/challenges"
                      className={
                        location.pathname.startsWith("/challenges")
                          ? styles.activeSubmenu
                          : ""
                      }
                    >
                      <FaTrophy className={styles.submenuIcon} /> אתגרי קהילה
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/group-workouts"
                      className={
                        location.pathname.startsWith("/group-workouts")
                          ? styles.activeSubmenu
                          : ""
                      }
                    >
                      <FaRunning className={styles.submenuIcon} /> אימונים
                      קבוצתיים
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            <li>
              <Link
                to="/community"
                className={
                  location.pathname === "/community" ? styles.active : ""
                }
              >
                <FaUsers className={styles.navIcon} />
                <span>FitFeed</span>
              </Link>
            </li>

            <li>
              <Link
                to="/chats"
                className={location.pathname === "/chats" ? styles.active : ""}
              >
                <FaComments className={styles.navIcon} />
                <span>צ'אטים</span>
              </Link>
            </li>

            {/* תפריטים תלויי תפקיד */}
            {role === "facility_manager" && (
              <li>
                <Link
                  to="/facility/dashboard"
                  className={
                    location.pathname.includes("/facility/dashboard")
                      ? styles.active
                      : ""
                  }
                >
                  <FaBuilding className={styles.navIcon} />
                  <span>ניהול מתקן</span>
                </Link>
              </li>
            )}

            {role === "admin" && (
              <li>
                <Link
                  to="/admin/dashboard"
                  className={
                    location.pathname.includes("/admin/dashboard")
                      ? styles.active
                      : ""
                  }
                >
                  <FaCog className={styles.navIcon} />
                  <span>ניהול מערכת</span>
                </Link>
              </li>
            )}

            {/* פריטי תפריט אחרונים */}
            <li className={styles.footerNavItem}>
              <Link
                to="/about"
                className={location.pathname === "/about" ? styles.active : ""}
              >
                <FaInfoCircle className={styles.navIcon} />
                <span>אודות</span>
              </Link>
            </li>

            <li className={styles.footerNavItem}>
              <Link
                to="/contact"
                className={
                  location.pathname === "/contact" ? styles.active : ""
                }
              >
                <FaFileContract className={styles.navIcon} />
                <span>צור קשר</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* פעולות צד ימין */}
        <div className={styles.navActions}>
          {/* כפתור החלפת ערכת נושא */}
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "עבור למצב בהיר" : "עבור למצב כהה"}
            title={theme === "dark" ? "עבור למצב בהיר" : "עבור למצב כהה"}
            data-theme={theme}
          >
            {theme === "dark" ? (
              <FaSun className={styles.themeIcon} />
            ) : (
              <FaMoon className={styles.themeIcon} />
            )}
          </button>

        {/* התראות עם עיצוב משופר */}
          {user && (
            <div
              className={`${styles.notificationsContainer} ${unreadCount > 0 ? styles.hasUnread : ''}`}
              ref={notificationsRef}
            >
              <button
                className={`${styles.notificationsButton} ${!unreadCount ? styles.noNotifications : ''}`}
                onClick={toggleNotifications}
                aria-label={`התראות${unreadCount ? ` (${unreadCount})` : ""}`}
                aria-expanded={notificationsOpen}
                aria-haspopup="true"
              >
                <FaBell className={styles.bellIcon} />
                {unreadCount > 0 && (
                  <span
                    className={`${styles.notificationBadge} ${unreadCount > 99 ? styles.high : ''}`}
                    title={`${unreadCount} התראות חדשות`}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className={styles.notificationsDropdown}>
                  <div className={styles.notificationsHeader}>
                    <h3>התראות</h3>
                    {unreadCount > 0 && (
                      <button
                        className={styles.markAllRead}
                        onClick={markAllAsRead}
                        aria-label="סמן הכל כנקרא"
                      >
                        <FaCheck />
                        <span>סמן הכל כנקרא</span>
                      </button>
                    )}
                  </div>

                  <div className={styles.notificationsList}>
                    {notifications && notifications.length > 0 ? (
                      <ul className={styles.notificationItemsList}>
                        {notifications.map((notification) => (
                          <li
                            key={
                              notification.id ||
                              Math.random().toString(36).substr(2, 9)
                            }
                            className={`${styles.notificationItem} ${
                              !notification.is_read ? styles.unread : ""
                            }`}
                          >
                            <Link
                              to={getNotificationLink(notification)}
                              className={styles.notificationLink}
                              onClick={() =>
                                handleNotificationClick(notification.id)
                              }
                            >
                              <div
                                className={styles.notificationIconWrapper}
                                style={{
                                  backgroundColor: getIconBackground(
                                    notification.type || "default"
                                  ),
                                }}
                              >
                                {getNotificationIcon(
                                  notification.type || "default"
                                )}
                              </div>
                              <div className={styles.notificationContent}>
                                <div className={styles.notificationMessage}>
                                  {getNotificationMessage(notification)}
                                </div>
                                <div className={styles.notificationFooter}>
                                  <time className={styles.notificationTime}>
                                    <FaClock className={styles.timeIcon} />
                                    {formatTimeAgo(notification.created_at)}
                                  </time>
                                  {!notification.is_read && (
                                    <span
                                      className={styles.unreadDot}
                                      title="לא נקרא"
                                    />
                                  )}
                                </div>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className={styles.emptyNotifications}>
                        <div className={styles.emptyNotificationsIcon}>
                          <FaBell />
                        </div>
                        <h4>אין התראות חדשות</h4>
                        <p>תהיה הראשון לקבל התראות!</p>
                      </div>
                    )}
                  </div>

                  {notifications && notifications.length > 0 && (
                    <div className={styles.notificationsFooter}>
                      <Link
                        to="/notifications"
                        className={styles.viewAllNotifications}
                        onClick={() => setNotificationsOpen(false)}
                      >
                        צפה בכל ההתראות
                        <span className={styles.arrowIcon}>←</span>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* תפריט משתמש */}
          {user ? (
            <div className={styles.userMenu} ref={dropdownRef}>
              <button
                className={styles.userButton}
                onClick={toggleProfileDropdown}
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
                aria-label="תפריט משתמש"
              >
                <div className={styles.userAvatar}>
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={`תמונת פרופיל של ${displayName}`}
                      className={styles.avatarImage}
                    />
                  ) : (
                    <span className={styles.avatarInitial}>{userInitial}</span>
                  )}
                </div>
                <span className={styles.userName}>{displayName}</span>
                <div className={styles.chevronContainer}>
                  <FaChevronDown
                    className={`${styles.rotateIcon} ${
                      profileDropdownOpen ? styles.rotated : ""
                    }`}
                  />
                </div>
              </button>

              {profileDropdownOpen && (
                <div className={styles.dropdown} aria-label="אפשרויות משתמש">
                  <div className={styles.dropdownHeader}>
                    <div className={styles.userInfo}>
                      <span className={styles.welcomeText}>
                        שלום, {displayName}
                      </span>
                      {profile?.email && (
                        <span className={styles.userEmail}>
                          {profile.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.dropdownDivider}></div>

                  <Link
                    to="/profile"
                    className={styles.dropdownItem}
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <FaUser className={styles.dropdownIcon} />
                    <span>פרופיל</span>
                  </Link>

                  <Link
                    to="/favorites"
                    className={styles.dropdownItem}
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <FaStar className={styles.dropdownIcon} />
                    <span>מועדפים</span>
                  </Link>

                  <Link
                    to="/community"
                    className={styles.dropdownItem}
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <FaUsers className={styles.dropdownIcon} />
                    <span>FitFeed</span>
                  </Link>

                  <div className={styles.dropdownDivider}></div>

                  <button
                    className={`${styles.dropdownItem} ${styles.logoutItem}`}
                    onClick={handleSignOut}
                  >
                    <FaSignOutAlt className={styles.dropdownIcon} />
                    <span>התנתק</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* כפתורי התחברות/הרשמה */
            <div className={styles.authButtons}>
              <Link to="/auth" className={styles.loginButton}>
                התחברות
              </Link>
              <Link to="/signup/user" className={styles.signupButton}>
                הרשמה
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
