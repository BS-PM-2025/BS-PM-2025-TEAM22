// src/components/shared/ChatQuickNav.js - גרסה מותאמת עם טעינה מוקדמת
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useChatNotifications } from "../../hooks/useChatNotifications";
import { supabase } from "../../utils/supabaseClient";
import {
  FaComments,
  FaUser,
  FaSearch,
  FaPlus,
  FaCheckDouble,
  FaCircle,
  FaTimes,
  FaClock,
  FaSync,
  FaSortAmountDown,
  FaSpinner,
  FaCheck
} from "react-icons/fa";
import styles from "./styles/ChatQuickNav.module.css";

const ChatQuickNav = ({ isVisible, onClose }) => {
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [showPreloader, setShowPreloader] = useState(false);
  
  const { user, userProfile } = useAuth();
  const { 
    unreadChatsCount, 
    unreadMessagesCount,
    recentChats,
    loading,
    isInitialized, // חדש
    markAllChatsAsRead,
    refresh,
    userId
  } = useChatNotifications();
  
  const containerRef = useRef(null);
  const onlineCheckRef = useRef(null);
  const autoRefreshRef = useRef(null);

  // רענון אוטומטי מותאם
  useEffect(() => {
    if (!isVisible || !userId) return;

    // רק אם עדיין לא אותחל - הצג preloader
    if (!isInitialized) {
      setShowPreloader(true);
    } else {
      setShowPreloader(false);
      setLastRefreshTime(new Date().toLocaleTimeString());
    }

    const autoRefresh = () => {
      if (isInitialized) { // רק אם כבר מאותחל
        refresh();
        setLastRefreshTime(new Date().toLocaleTimeString());
      }
    };

    // הגדרת טיימר רק אם מאותחל
    if (isInitialized) {
      autoRefreshRef.current = setInterval(autoRefresh, 30000);
    }

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
    };
  }, [isVisible, userId, refresh, isInitialized]);

  // מעקב אחר אתחול
  useEffect(() => {
    if (isInitialized) {
      setShowPreloader(false);
      if (isVisible) {
        setLastRefreshTime(new Date().toLocaleTimeString());
      }
    }
  }, [isInitialized, isVisible]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refresh();
      setLastRefreshTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Manual refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh, isRefreshing]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllChatsAsRead();
      setLastRefreshTime(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [markAllChatsAsRead]);

  // פונקציות עזר
  const formatLastSeen = useMemo(() => (timestamp) => {
    if (!timestamp) return "";

    try {
      const now = new Date();
      const date = new Date(timestamp);
      const diff = Math.floor((now - date) / 1000);

      if (diff < 60) return "עכשיו";
      if (diff < 3600) return `${Math.floor(diff / 60)}ד'`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}ש'`;
      if (diff < 604800) return `${Math.floor(diff / 86400)}י'`;
      
      return date.toLocaleDateString("he-IL", {
        day: "numeric",
        month: "short",
      });
    } catch (error) {
      console.error('Error formatting date:', timestamp, error);
      return "";
    }
  }, []);

  const truncateMessage = useMemo(() => (message, maxLength = 30) => {
    if (!message) return "התחל שיחה...";
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  }, []);

  // סגירה בלחיצה מחוץ לתיבה
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        handleClose();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isVisible, handleClose]);

  // מעקב אחר משתמשים מחוברים - רק אם מאותחל
  useEffect(() => {
    if (!isVisible || !userId || !isInitialized) return;

    const trackOnlineUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("user_status")
          .select("user_id")
          .eq("is_online", true)
          .gte("last_seen", new Date(Date.now() - 5 * 60 * 1000).toISOString());

        if (!error && data) {
          const newOnlineUsers = new Set(data.map((status) => status.user_id));
          setOnlineUsers(prev => {
            const prevArray = Array.from(prev).sort();
            const newArray = Array.from(newOnlineUsers).sort();
            
            if (JSON.stringify(prevArray) !== JSON.stringify(newArray)) {
              return newOnlineUsers;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Error tracking online users:", error);
      }
    };

    trackOnlineUsers();
    onlineCheckRef.current = setInterval(trackOnlineUsers, 60000);

    return () => {
      if (onlineCheckRef.current) {
        clearInterval(onlineCheckRef.current);
        onlineCheckRef.current = null;
      }
    };
  }, [isVisible, userId, isInitialized]);

  if (!isVisible) return null;

  const shouldShowChats = recentChats && Array.isArray(recentChats) && recentChats.length > 0;
  const isLoadingState = loading || showPreloader || !isInitialized;

  return (
    <div className={styles.overlay}>
      <div 
        ref={containerRef}
        className={styles.quickNavContainer}
      >
        {/* כותרת */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <FaComments className={styles.headerIcon} />
            <h4>צ'אטים</h4>
            {unreadChatsCount > 0 && (
              <span className={styles.unreadCounter}>
                {unreadChatsCount}
              </span>
            )}
            {unreadMessagesCount > 0 && unreadMessagesCount !== unreadChatsCount && (
              <span className={styles.unreadMessages} title={`${unreadMessagesCount} הודעות שלא נקראו`}>
                +{unreadMessagesCount}
              </span>
            )}
            {isInitialized && <FaSortAmountDown className={styles.sortIcon} title="ממוין לפי פעילות אחרונה" />}
            {showPreloader && <FaSpinner className={`${styles.sortIcon} ${styles.spinning}`} title="טוען..." />}
            {isInitialized && !loading && <FaCheck className={styles.readyIcon} title="מוכן" />}
          </div>
          <div className={styles.headerActions}>
            <button
              className={`${styles.refreshBtn} ${isRefreshing ? styles.spinning : ''}`}
              onClick={handleRefresh}
              disabled={isRefreshing || !isInitialized}
              title={`רענן ${lastRefreshTime ? `(${lastRefreshTime})` : ''}`}
            >
              <FaSync />
            </button>
            {unreadChatsCount > 0 && isInitialized && (
              <button
                className={styles.markAllBtn}
                onClick={handleMarkAllAsRead}
                title="סמן הכל כנקרא"
              >
                <FaCheckDouble />
              </button>
            )}
            <button 
              className={styles.closeBtn}
              onClick={handleClose}
              title="סגור"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* פעולות מהירות */}
        <div className={styles.quickActions}>
          <Link 
            to="/chats?action=new" 
            className={styles.quickAction}
            onClick={handleClose}
          >
            <FaPlus />
            <span>צ'אט חדש</span>
          </Link>
          <Link 
            to="/chats?action=search" 
            className={styles.quickAction}
            onClick={handleClose}
          >
            <FaSearch />
            <span>חיפוש</span>
          </Link>
        </div>

        {/* רשימת צ'אטים */}
        <div className={styles.recentChats}>
          {isLoadingState ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingText}>
                {showPreloader ? (
                  <>
                    <FaSpinner className={styles.spinning} />
                    טוען צ'אטים בפעם הראשונה...
                  </>
                ) : isRefreshing ? (
                  <>
                    <FaSync className={styles.spinning} />
                    מרענן...
                  </>
                ) : (
                  <>
                    <FaSpinner className={styles.spinning} />
                    טוען...
                  </>
                )}
              </div>
              
              {/* מונים זמינים כבר */}
              {(unreadChatsCount > 0 || unreadMessagesCount > 0) && (
                <div className={styles.quickStats}>
                  <div className={styles.statItem}>
                    <FaComments />
                    {unreadChatsCount} צ'אטים חדשים
                  </div>
                  <div className={styles.statItem}>
                    <FaCircle />
                    {unreadMessagesCount} הודעות
                  </div>
                </div>
              )}
              
              {[...Array(3)].map((_, i) => (
                <div key={i} className={styles.chatSkeleton}>
                  <div className={styles.skeletonAvatar} />
                  <div className={styles.skeletonContent}>
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonLine} style={{ width: "60%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : shouldShowChats ? (
            <div className={styles.chatsList}>
              <div className={styles.chatsInfo}>
                <FaSortAmountDown />
                מוצג {recentChats.length} צ'אטים ממוינים לפי פעילות
                {lastRefreshTime && <small> (עודכן: {lastRefreshTime})</small>}
              </div>
              
              {recentChats.map((chat, index) => {
                if (!chat || !chat.id) return null;
                
                const isOnline = chat.otherUser?.id ? onlineUsers.has(chat.otherUser.id) : false;
                
                return (
                  <div key={`chat-${chat.id}-${index}`} className={styles.chatItemWrapper}>
                    <Link
                      to={`/chat/${chat.id}`}
                      className={`${styles.chatItem} ${chat.hasUnread ? styles.unread : ''}`}
                      onClick={handleClose}
                    >
                      {/* דירוג הצ'אט */}
                      <div className={styles.chatRank}>
                        #{index + 1}
                      </div>

                      {/* אווטאר */}
                      <div className={styles.chatAvatar}>
                        {chat.otherUser?.avatar_url ? (
                          <img
                            src={chat.otherUser.avatar_url}
                            alt={chat.otherUser.name || 'משתמש'}
                            className={styles.avatarImage}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className={styles.avatarPlaceholder}
                          style={{ display: chat.otherUser?.avatar_url ? 'none' : 'flex' }}
                        >
                          <FaUser />
                        </div>
                        
                        {/* אינדיקטור מחובר */}
                        {isOnline && (
                          <div className={styles.onlineIndicator}>
                            <FaCircle />
                          </div>
                        )}
                      </div>
                      
                      {/* מידע הצ'אט */}
                      <div className={styles.chatInfo}>
                        <div className={styles.chatHeader}>
                          <span className={styles.chatName}>
                            {chat.otherUser?.name || `משתמש ${chat.otherUser?.id?.slice(0, 8) || 'לא ידוע'}`}
                          </span>
                          <span className={styles.messageTime}>
                            <FaClock />
                            {formatLastSeen(chat.lastActivityTime)}
                          </span>
                        </div>
                        
                        <div className={styles.messagePreview}>
                          {chat.lastMessage ? (
                            <>
                              {chat.lastMessage.sender_id === userId && (
                                <span className={styles.youLabel}>אתה: </span>
                              )}
                              <span className={styles.messageText}>
                                {truncateMessage(chat.lastMessage.content)}
                              </span>
                            </>
                          ) : (
                            <span className={styles.noMessages}>התחל שיחה...</span>
                          )}
                        </div>
                      </div>
                      
                      {/* אינדיקטור הודעות שלא נקראו */}
                      {chat.hasUnread && (
                        <div className={styles.unreadDot}>
                          {chat.unreadCount > 1 && (
                            <span className={styles.unreadCount}>
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <FaComments className={styles.emptyIcon} />
              <div className={styles.emptyContent}>
                <span className={styles.emptyTitle}>אין צ'אטים עדיין</span>
                <span className={styles.emptySubtitle}>התחל שיחה עם חברים</span>
              </div>
              
              {isInitialized && (
                <button 
                  className={styles.startChatBtn}
                  onClick={handleRefresh}
                  style={{ marginBottom: '10px' }}
                >
                  <FaSync />
                  רענן
                </button>
              )}
              
              <Link 
                to="/chats?action=new" 
                className={styles.startChatBtn}
                onClick={handleClose}
              >
                <FaPlus />
                התחל צ'אט חדש
              </Link>
            </div>
          )}
        </div>

        {/* כפתור לכל הצ'אטים */}
        <div className={styles.footer}>
          <Link
            to="/chats"
            className={styles.viewAllBtn}
            onClick={handleClose}
          >
            <span>כל הצ'אטים ({recentChats?.length || 0})</span>
            <span className={styles.arrow}>←</span>
          </Link>
          {lastRefreshTime && (
            <div className={styles.lastUpdate}>
              עודכן: {lastRefreshTime}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatQuickNav;