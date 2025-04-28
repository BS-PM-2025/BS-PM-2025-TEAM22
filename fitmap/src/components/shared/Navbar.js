// src/components/Navbar.js
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
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
  FaSun
} from "react-icons/fa";
import styles from "../../styles/Navbar.module.css";

const Navbar = ({ toggleTheme, theme }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef();

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
      (_event, session) => {
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

  // סגירת התפריט בעת שינוי מסלול
  useEffect(() => {
    setMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // סגירת התפריט הנפתח בלחיצה מחוץ לאלמנט
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
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

    if (!error) {
      setProfile(data);
    }
  };

  // טיפול בהתנתקות
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth"; // רענון מוחלט
  };

  // פתיחת/סגירת תפריט המשתמש
  const toggleProfileDropdown = (e) => {
    e.stopPropagation();
    setProfileDropdownOpen((prev) => !prev);
  };

  const role = profile?.role || "user";

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* לוגו */}
        <Link to="/" className={styles.logo}>
          <img src="/Fmap1.png" alt="לוגו מתקני כושר עירוניים" />
          <span>FitMap</span>
        </Link>

        {/* כפתור תפריט למובייל */}
        <button
  className={`${styles.rocketButton} ${menuOpen ? styles.open : ""}`}
  onClick={() => setMenuOpen(!menuOpen)}
  aria-label={menuOpen ? "סגור תפריט" : "פתח תפריט"}
>
  <span className={styles.rocketFin}></span>
  <span className={styles.rocketBody}></span>
  <span className={styles.rocketFin}></span>
</button>


        {/* תפריט ניווט */}
        <nav className={`${styles.nav} ${menuOpen ? styles.menuOpen : ""}`}>
          <ul className={styles.navList}>
            <li>
              <Link
                to="/fitness-map"
                className={
                  location.pathname === "/fitness-map" ? styles.active : ""
                }
              >
                <FaMap className={styles.navIcon} /> מפת מתקנים
              </Link>
            </li>

            <li>
              <Link
                to="/profile"
                className={
                  location.pathname === "/profile" ? styles.active : ""
                }
              >
                <FaUser className={styles.navIcon} /> פרופיל
              </Link>
            </li>

            <li>
              <Link
                to="/Contact"
                className={
                  location.pathname === "/Contact" ? styles.active : ""
                }
              >
                <FaFileContract className={styles.navIcon} /> צור קשר
              </Link>
            </li>

            <li>
              <Link
                to="/about"
                className={
                  location.pathname === "/about" ? styles.active : ""
                }
              >
                <FaInfoCircle className={styles.navIcon} /> אודות
              </Link>
            </li>


            {/* תפריטים תלויי תפקיד */}
            {role === "facility_manager" && (
              <li>
                <Link
                  to="/facility/dashboard"
                  className={
                    location.pathname.includes("/facility/dashboard") ? styles.active : ""
                  }
                >
                  <FaBuilding className={styles.navIcon} /> ניהול מתקן
                </Link>
              </li>
            )}

            {role === "admin" && (
              <li>
                <Link
                  to="/admin/dashboard"
                  className={
                    location.pathname.includes("/admin/dashboard") ? styles.active : ""
                  }
                >
                  <FaCog className={styles.navIcon} /> ניהול מערכת
                </Link>
              </li>
            )}

            <li>
              <Link
                to="/community"
                className={
                  location.pathname === "/community" ? styles.active : ""
                }
              >
                <FaUsers className={styles.navIcon} /> קהילה
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
            data-theme={theme}
          >
            {theme === "dark" ? <FaSun className={styles.themeIcon} /> : <FaMoon className={styles.themeIcon} />}
          </button>

          {/* תפריט משתמש */}
          {user ? (
            <div className={styles.userMenu} ref={dropdownRef}>
              <button
                className={styles.userButton}
                onClick={toggleProfileDropdown}
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
              >
                <div className={styles.userAvatar}>
                  {profile?.name?.charAt(0) || user.email?.charAt(0) || "U"}
                </div>
                <span className={styles.userName}>
                  {profile?.name || user.email?.split("@")[0]}
                </span>
                <div className={styles.chevronContainer}>
                  <FaChevronDown
                    className={`${styles.rotateIcon} ${profileDropdownOpen ? styles.rotated : ""}`}
                  />
                </div>
              </button>

              {profileDropdownOpen && (
                <div className={styles.dropdown}>
                  <Link
                    to="/profile"
                    className={styles.dropdownItem}
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <FaUser className={styles.dropdownIcon} /> <span>פרופיל</span>
                  </Link>
                  <Link
                    to="/favorites"
                    className={styles.dropdownItem}
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <FaStar className={styles.dropdownIcon} /> <span>מועדפים</span>
                  </Link>
                  <button
                    className={`${styles.dropdownItem} ${styles.logoutItem}`}
                    onClick={handleSignOut}
                  >
                    <FaSignOutAlt className={styles.dropdownIcon} /> <span>התנתק</span>
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