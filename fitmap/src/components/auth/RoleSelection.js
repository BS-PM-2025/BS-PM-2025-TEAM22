import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaUser, 
  FaBuilding, 
  FaSignOutAlt, 
  FaMapMarkedAlt, 
  FaStar, 
  FaUserCog, 
  FaHeart, 
  FaRegListAlt, 
  FaBell
} from 'react-icons/fa';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import styles from '../../styles/RoleSelection.module.css';

function RoleSelection() {
  const { user, userProfile } = useAuth();
  const [showAlert, setShowAlert] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [, setLoading] = useState(false);
  const [animation, setAnimation] = useState(false);

  const fetchUserFavorites = useCallback(async () => {
    if (!user) {
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .limit(3);

      if (error) {
        throw error;
      }

      setFavorites(data || []);
    } catch (error) {
      console.error('שגיאה בטעינת מועדפים:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setAnimation(true);
      fetchUserFavorites();
    }
  }, [user, fetchUserFavorites]);

  const handleSignOut = async () => {
    try {
      setShowAlert(true);
      setTimeout(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
      }, 800);
    } catch (error) {
      console.error('שגיאה בהתנתקות:', error.message);
    }
  };

  const quickLinks = [
    {
      icon: <FaMapMarkedAlt />, title: 'מפת מתקנים', description: 'חפש מתקני כושר בקרבתך', path: '/fitness-map', color: 'var(--primary)'
    },
    {
      icon: <FaStar />, title: 'המועדפים שלי', description: 'צפה במתקנים המועדפים עליך', path: '/favorites', color: 'var(--warning)'
    },
    {
      icon: <FaUserCog />, title: 'הגדרות פרופיל', description: 'עדכן את פרטי החשבון שלך', path: '/profile', color: 'var(--accent)'
    }
  ];

  if (userProfile?.role === 'facility_manager') {
    quickLinks.push({
      icon: <FaBuilding />, title: 'ניהול מתקן', description: 'נהל את המתקן שלך', path: '/facility/dashboard', color: 'var(--secondary)'
    });
  }

  if (user) {
    return (
      <div className={`${styles.container} ${animation ? styles.animateIn : ''}`}>
        {showAlert && (
          <div className={styles.alertOverlay}>
            <div className={styles.alert}>
              <div className={styles.alertIcon}><FaSignOutAlt /></div>
              <div className={styles.alertText}>מתנתק...</div>
            </div>
          </div>
        )}

        <div className={styles.welcomeSection}>
          <div className={styles.welcomeHeader}>
            <div className={styles.userAvatarLarge}>{userProfile?.name?.charAt(0) || user.email?.charAt(0)}</div>
            <div className={styles.welcomeText}>
              <h1>ברוך הבא, <span className={styles.userName}>{userProfile?.name || user.email?.split('@')[0]}</span></h1>
              <p className={styles.userRole}>
                {userProfile?.role === 'facility_manager' ? <><FaBuilding className={styles.roleIcon} /> מנהל מתקן</>
                : userProfile?.role === 'admin' ? <><FaUserCog className={styles.roleIcon} /> מנהל מערכת</>
                : <><FaUser className={styles.roleIcon} /> משתמש רגיל</>}
              </p>
            </div>
          </div>

          <div className={styles.welcomeActions}>
            <button className={`${styles.actionButton} ${styles.logoutButton}`} onClick={handleSignOut}>
              <FaSignOutAlt /> התנתק
            </button>
          </div>
        </div>

        <div className={styles.dashboardSection}>
          <h2 className={styles.sectionTitle}>ניווט מהיר</h2>
          <div className={styles.quickLinks}>
            {quickLinks.map((link, index) => (
              <Link to={link.path} className={styles.dashboardCard} key={index} style={{"--card-color": link.color, "--index": index}}>
                <div className={styles.dashboardIcon} style={{"--icon-color": link.color}}>{link.icon}</div>
                <h3>{link.title}</h3>
                <p>{link.description}</p>
                <div className={styles.cardArrow}></div>
              </Link>
            ))}
          </div>
        </div>

        {favorites.length > 0 && (
          <div className={styles.favoritesSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}><FaHeart className={styles.sectionIcon} /> המתקנים המועדפים שלך</h2>
              <Link to="/favorites" className={styles.viewAllLink}><span>צפה בכולם</span> <FaRegListAlt /></Link>
            </div>
            <div className={styles.favoritesList}>
              {favorites.map((fav, index) => (
                <div className={styles.favoriteItem} key={index}>
                  <div className={styles.favoriteImagePlaceholder}><FaBuilding /></div>
                  <div className={styles.favoriteInfo}>
                    <h3>{fav.name || 'מתקן'}</h3>
                    <p>{fav.address || 'כתובת לא זמינה'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.activitySection}>
          <div className={styles.activityHeader}><h2 className={styles.sectionTitle}><FaBell className={styles.sectionIcon} /> פעילות אחרונה</h2></div>
          <div className={styles.timelineContainer}>
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <div className={styles.timelinePoint}></div>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineDate}>היום</span>
                  <h3>התחברת למערכת</h3>
                  <p>ברוך שובך למערכת מתקני הכושר העירוניים</p>
                </div>
              </div>
              <div className={styles.timelineItem}>
                <div className={styles.timelinePoint}></div>
                <div className={styles.timelineContent}>
                  <span className={styles.timelineDate}>לאחרונה</span>
                  <h3>אנחנו ממליצים</h3>
                  <p>גלה מתקנים חדשים באזורך ב<Link to="/fitness-map" className={styles.inlineLink}>מפת המתקנים</Link></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <img src="/Fmap.png" alt="Urban Fitness" className={styles.heroImage} />
        <div className={styles.heroContent}>
          <h1>מתקני כושר עירוניים</h1>
          <p>מצא מתקנים ציבוריים וצור קהילת כושר</p>
        </div>
      </div>

      <h2 className={styles.roleTitle}>הצטרף למערכת</h2>

      <div className={styles.roleCards}>
        <div className={styles.roleCard} style={{"--index": 0}}>
          <div className={styles.cardIcon}><FaUser size={24} /></div>
          <h3>משתמש רגיל</h3>
          <p>מצא מתקנים והצטרף לקהילה</p>
          <Link to="/signup/user" className={styles.cardButton}>הרשם כמשתמש</Link>
        </div>

        <div className={styles.roleCard} style={{"--index": 1}}>
          <div className={styles.cardIcon}><FaBuilding size={24} /></div>
          <h3>מנהל מתקן</h3>
          <p>נהל מתקן ועדכן מידע</p>
          <Link to="/signup/facility_manager" className={styles.cardButton}>הרשם כמנהל</Link>
        </div>
      </div>

      <p className={styles.loginLink}>כבר יש לך חשבון? <Link to="/auth">התחבר כאן</Link></p>
    </div>
  );
}

export default RoleSelection;