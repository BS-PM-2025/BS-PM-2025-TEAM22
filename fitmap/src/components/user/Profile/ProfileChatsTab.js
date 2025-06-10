import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../utils/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';
import GroupChat from '../../groups/GroupChat';
import styles from './ProfileChatsTab.module.css';
import {
  FaComments,
  FaUsers,
  FaCalendarAlt,
  FaArrowLeft,
  FaSpinner,
  FaExclamationTriangle,
  FaSearch,
  FaRegClock,
  FaRegComment,
  FaTrashAlt,
  FaBell,
  FaBellSlash,
  FaEllipsisV
} from 'react-icons/fa';

/**
 * קומפוננטת טאב צ'אטים למסך פרופיל
 * מציגה את כל הצ'אטים הקבוצתיים שבהם המשתמש פעיל
 */
function ProfileChatsTab() {
  const { user, userProfile } = useAuth();
  const [activeChats, setActiveChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  const [mutedChats, setMutedChats] = useState({});

  // טעינת רשימת הצ'אטים הפעילים של המשתמש
  const fetchActiveChats = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('טוען צ\'אטים פעילים למשתמש:', userProfile?.name);
      
      // 1. מצא את כל האימונים שהמשתמש רשום אליהם
      const { data: participations, error: participationsError } = await supabase
        .from('group_participants')
        .select('workout_id')
        .eq('user_id', userProfile?.user_id)
        .eq('status', 'registered');
      
      if (participationsError) throw participationsError;
      
      if (!participations || participations.length === 0) {
        console.log('לא נמצאו אימונים פעילים למשתמש');
        setActiveChats([]);
        setLoading(false);
        return;
      }
      
      const workoutIds = participations.map(p => p.workout_id);
      console.log(`נמצאו ${workoutIds.length} אימונים למשתמש`);
      
      // 2. טען את פרטי האימונים
      const { data: workouts, error: workoutsError } = await supabase
        .from('group_workouts')
        .select('*, creator:creator_id(name)')
        .in('id', workoutIds)
        .order('start_time', { ascending: false });
      
      if (workoutsError) throw workoutsError;
      
      // 3. בדוק את כמות ההודעות שלא נקראו בכל צ'אט
      const unreadCountsData = {};
      const mutedChatsData = {};
      
      // טען הגדרות השתקת צ'אט מהאחסון המקומי
      const savedMutedChats = localStorage.getItem('mutedChats');
      if (savedMutedChats) {
        try {
          const parsed = JSON.parse(savedMutedChats);
          if (parsed && typeof parsed === 'object') {
            Object.keys(parsed).forEach(chatId => {
              if (parsed[chatId] === true) {
                mutedChatsData[chatId] = true;
              }
            });
          }
        } catch (e) {
          console.error('שגיאה בטעינת הגדרות השתקה:', e);
        }
      }
      
      // טען את המועד האחרון שהמשתמש צפה בכל צ'אט
      for (const workout of workouts || []) {
        const lastViewedKey = `lastViewed_${workout.id}`;
        const lastViewed = localStorage.getItem(lastViewedKey);
        
        // ספור הודעות שלא נקראו
        const { data: unreadMessages, error: countError } = await supabase
          .from('group_chat')
          .select('id', { count: 'exact' })
          .eq('workout_id', workout.id)
          .gt('created_at', lastViewed || '1970-01-01T00:00:00Z');
        
        if (!countError) {
          unreadCountsData[workout.id] = unreadMessages?.length || 0;
        }
      }
      
      setUnreadCounts(unreadCountsData);
      setMutedChats(mutedChatsData);
      setActiveChats(workouts || []);
      
      console.log('נטענו בהצלחה', workouts?.length || 0, 'צ\'אטים פעילים');
      
    } catch (err) {
      console.error('שגיאה בטעינת צ\'אטים פעילים:', err);
      setError('אירעה שגיאה בטעינת הצ\'אטים הפעילים');
    } finally {
      setLoading(false);
    }
  }, [user?.id, userProfile?.user_id, userProfile?.name]);

  // טעינה ראשונית
  useEffect(() => {
    if (userProfile?.user_id) {
      fetchActiveChats();
    }
  }, [userProfile?.user_id, fetchActiveChats]);

  // סנן צ'אטים לפי חיפוש
  const filteredChats = activeChats.filter(chat => 
    chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chat.creator?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // פתיחת צ'אט ספציפי
  const openChat = (chat) => {
    setSelectedChat(chat);
    
    // שמור את המועד האחרון שהמשתמש צפה בצ'אט
    const lastViewedKey = `lastViewed_${chat.id}`;
    localStorage.setItem(lastViewedKey, new Date().toISOString());
    
    // אפס את מספר ההודעות שלא נקראו
    setUnreadCounts(prev => ({
      ...prev,
      [chat.id]: 0
    }));
  };

  // חזרה לרשימת הצ'אטים
  const backToList = () => {
    setSelectedChat(null);
  };

  // ניהול תפריט אפשרויות
  const toggleMenu = (chatId) => {
    setMenuOpen(prev => prev === chatId ? null : chatId);
  };

  // השתקת/ביטול השתקת צ'אט
  const toggleMute = (chatId) => {
    const newMutedChats = { ...mutedChats };
    
    if (newMutedChats[chatId]) {
      delete newMutedChats[chatId];
    } else {
      newMutedChats[chatId] = true;
    }
    
    setMutedChats(newMutedChats);
    localStorage.setItem('mutedChats', JSON.stringify(newMutedChats));
    setMenuOpen(null);
  };

  // מחיקת צ'אט (מסתיר אותו בלבד, לא מוחק מהמסד)
  const hideChat = (chatId) => {
    setActiveChats(prev => prev.filter(chat => chat.id !== chatId));
    setMenuOpen(null);
  };

  // פורמט תאריך
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'היום';
    } else if (diffDays === 1) {
      return 'אתמול';
    } else if (diffDays < 7) {
      return `לפני ${diffDays} ימים`;
    } else {
      return date.toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      });
    }
  };

  // רינדור מצב טעינה
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FaSpinner className={styles.loadingSpinner} />
        <p>טוען צ'אטים...</p>
      </div>
    );
  }

  // רינדור הודעת שגיאה
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <FaExclamationTriangle className={styles.errorIcon} />
        <p>{error}</p>
        <button onClick={fetchActiveChats} className={styles.retryButton}>
          נסה שוב
        </button>
      </div>
    );
  }

  // רינדור צ'אט פתוח
  if (selectedChat) {
    return (
      <div className={styles.chatViewContainer}>
        <div className={styles.chatHeader}>
          <button onClick={backToList} className={styles.backButton}>
            <FaArrowLeft /> חזרה לרשימת הצ'אטים
          </button>
          <h2>{selectedChat.title}</h2>
          <Link to={`/group-workouts/${selectedChat.id}`} className={styles.workoutLink}>
            פרטי האימון <FaCalendarAlt />
          </Link>
        </div>
        
        <div className={styles.chatContainer}>
          <GroupChat 
            workoutId={selectedChat.id} 
            userId={userProfile?.user_id} 
            userName={userProfile?.name}
          />
        </div>
      </div>
    );
  }

  // רינדור רשימת צ'אטים כשאין צ'אט נבחר
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2><FaComments className={styles.headerIcon} /> הצ'אטים שלי</h2>
        <div className={styles.searchBar}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפש צ'אט..."
            className={styles.searchInput}
          />
        </div>
      </div>

      {filteredChats.length === 0 ? (
        <div className={styles.emptyState}>
          <FaRegComment className={styles.emptyIcon} />
          <h3>אין צ'אטים פעילים</h3>
          <p>
            {searchTerm ? 
              'לא נמצאו צ\'אטים התואמים לחיפוש שלך' : 
              'הירשם לאימונים קבוצתיים כדי להשתתף בצ\'אטים'
            }
          </p>
          <Link to="/group-workouts" className={styles.findWorkoutsButton}>
            <FaUsers /> מצא אימונים קבוצתיים
          </Link>
        </div>
      ) : (
        <div className={styles.chatsList}>
          {filteredChats.map(chat => (
            <div 
              key={chat.id} 
              className={`${styles.chatItem} ${unreadCounts[chat.id] > 0 && !mutedChats[chat.id] ? styles.unread : ''}`}
              onClick={() => openChat(chat)}
            >
              <div className={styles.chatInfo}>
                <div className={styles.chatTitle}>
                  {chat.title}
                  {mutedChats[chat.id] && (
                    <FaBellSlash className={styles.mutedIcon} title="צ'אט מושתק" />
                  )}
                </div>
                
                <div className={styles.chatMeta}>
                  <span className={styles.chatCreator}>
                    <FaUsers className={styles.creatorIcon} /> {chat.creator?.name || 'מארגן לא ידוע'}
                  </span>
                  <span className={styles.chatDate}>
                    <FaRegClock className={styles.dateIcon} /> {formatDate(chat.start_time)}
                  </span>
                </div>
              </div>
              
              {unreadCounts[chat.id] > 0 && (
                <div className={`${styles.unreadBadge} ${mutedChats[chat.id] ? styles.mutedBadge : ''}`}>
                  {unreadCounts[chat.id]}
                </div>
              )}
              
              <div className={styles.chatActions}>
                <button
                  className={styles.menuButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMenu(chat.id);
                  }}
                >
                  <FaEllipsisV />
                </button>
                
                {menuOpen === chat.id && (
                  <div className={styles.actionsMenu}>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      toggleMute(chat.id);
                    }}>
                      {mutedChats[chat.id] ? (
                        <><FaBell /> בטל השתקה</>
                      ) : (
                        <><FaBellSlash /> השתק צ'אט</>
                      )}
                    </button>
                    
                    <button onClick={(e) => {
                      e.stopPropagation();
                      hideChat(chat.id);
                    }}>
                      <FaTrashAlt /> הסתר צ'אט
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProfileChatsTab;