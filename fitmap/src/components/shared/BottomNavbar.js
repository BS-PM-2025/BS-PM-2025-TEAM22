// src/components/shared/BottomNavbar.js
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { useChatNotifications } from "../../hooks/useChatNotifications";
import { useBottomNavbar } from "../../hooks/useBottomNavbar";
import ChatQuickNav from "./ChatQuickNav";
import {
  FaHome,
  FaMap,
  FaDumbbell,
  FaUsers,
  FaUser,
  FaComments,
} from "react-icons/fa";
import styles from "./styles/BottomNavbar.module.css";

const BottomNavbar = () => {
  const [showChatQuickNav, setShowChatQuickNav] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { unreadChatsCount } = useChatNotifications();
  const { isVisible, shouldShow } = useBottomNavbar();

  // הוספת/הסרת מרווח לגוף הדף כשהבר מוצג
  useEffect(() => {
    const body = document.body;
    
    if (user && shouldShow && isVisible) {
      body.classList.add(styles.bodyPadding);
    } else {
      body.classList.remove(styles.bodyPadding);
    }

    // ניקוי כשהקומפוננט נמחק
    return () => {
      body.classList.remove(styles.bodyPadding);
    };
  }, [user, shouldShow, isVisible]);

  // אל תציג בר תחתון אם המשתמש לא מחובר או אם הדף לא מתאים
  if (!user || !shouldShow) {
    return null;
  }

  // הגדרת פריטי הניווט
  const navItems = [
    {
      path: "/",
      icon: FaHome,
      label: "בית",
      exact: true,
    },
    {
      path: "/fitness-map",
      icon: FaMap,
      label: "מפה",
      exact: true,
    },
    {
      path: "/exercises",
      icon: FaDumbbell,
      label: "תרגילים",
      exact: false,
      matchPaths: ["/exercises", "/workout-tracker", "/personal-trainer"],
    },
    {
      path: "/chats",
      icon: FaComments,
      label: "צ'אטים",
      exact: false,
      matchPaths: ["/chats", "/chat"],
      showBadge: true,
      badgeKey: "chats",
      hasQuickAccess: true,
    },
    {
      path: "/community",
      icon: FaUsers,
      label: "קהילה",
      exact: true,
      showBadge: true,
      badgeKey: "community",
    },
    {
      path: "/profile",
      icon: FaUser,
      label: "פרופיל",
      exact: true,
    },
  ];

  // טיפול בלחיצה על פריט ניווט
  const handleNavItemClick = (item, e) => {
    if (item.hasQuickAccess && item.path === "/chats") {
      e.preventDefault();
      setShowChatQuickNav(!showChatQuickNav);
    } else {
      setShowChatQuickNav(false);
    }
  };

  // בדיקה אם הנתיב פעיל
  const isActiveTab = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    if (item.matchPaths) {
      return item.matchPaths.some((path) => location.pathname.startsWith(path));
    }
    return location.pathname.startsWith(item.path);
  };

  // פונקציה לקביעת מספר התגים
  const getBadgeCount = (item) => {
    if (!item.showBadge) return 0;

    switch (item.badgeKey) {
      case "chats":
        return unreadChatsCount;
      case "community":
        return unreadCount;
      default:
        return 0;
    }
  };

  return (
    <>
      {/* רכיב הגישה המהירה לצ'אטים */}
      <ChatQuickNav
        isVisible={showChatQuickNav}
        onClose={() => setShowChatQuickNav(false)}
      />

      <nav
        className={`${styles.bottomNav} ${
          isVisible ? styles.visible : styles.hidden
        }`}
      >
        <div className={styles.navContainer}>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = isActiveTab(item);
            const badgeCount = getBadgeCount(item);

            return item.hasQuickAccess ? (
              <button
                key={item.path}
                className={`${styles.navItem} ${
                  isActive ? styles.active : ""
                } ${styles.navButton}`}
                onClick={(e) => handleNavItemClick(item, e)}
                aria-label={item.label}
              >
                <div className={styles.iconWrapper}>
                  <IconComponent className={styles.navIcon} />
                  {badgeCount > 0 && (
                    <span className={styles.badge}>
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </div>
                <span className={styles.navLabel}>{item.label}</span>
              </button>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                aria-label={item.label}
                onClick={(e) => handleNavItemClick(item, e)}
              >
                <div className={styles.iconWrapper}>
                  <IconComponent className={styles.navIcon} />
                  {badgeCount > 0 && (
                    <span className={styles.badge}>
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                </div>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNavbar;