// src/components/chat/ChatList.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { privateChatService } from "../../services/privateChatService";
import { supabase } from "../../utils/supabaseClient";
import NewChatModal from "./NewChatModal";
import EmptyState from "./EmptyState";
import OnlineIndicator from "./OnlineIndicator";
import {
  FaUser,
  FaSearch,
  FaPlus,
  FaExclamationTriangle,
  FaTimes,
  FaRegClock,
  FaSpinner,
} from "react-icons/fa";
import styles from "./styles/ChatList.module.css";

/**
 * רשימת השיחות של המשתמש
 * מציגה את כל השיחות הפרטיות עם אפשרות לחפש ולפתוח שיחה חדשה
 */
function ChatList() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [realtimeSubscription, setRealtimeSubscription] = useState(null);

  // סינון צ'אטים לפי חיפוש
  const filteredChats = useMemo(() => {
    return chats.filter((chat) =>
      chat.other_user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chats, searchTerm]);

  // טעינת רשימת הצ'אטים של המשתמש
  const fetchChats = useCallback(async () => {
    if (!userProfile?.id) return;

    try {
      setLoading(true);

      const { data, error } = await privateChatService.getUserChats(
        userProfile.id
      );

      if (error) throw error;

      setChats(data || []);
    } catch (err) {
      console.error("שגיאה בטעינת צ'אטים:", err);
      setError("לא ניתן היה לטעון את רשימת השיחות");
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  // הגדרת האזנה בזמן אמת לשינויים בצ'אטים
  // Remove chats from the dependency array in setupRealtimeSubscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!userProfile?.id || realtimeSubscription) return;

    // האזנה להודעות חדשות בכל הצ'אטים
    const subscription = supabase
      .channel(`user-chats-${userProfile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
        },
        async (payload) => {
          try {
            // טעינת פרטי הצ'אט והמשתמש השני
            const { data: chatData } = await supabase
              .from("private_chats")
              .select(
                `
              id,
              user1:user1_id (id, name, avatar_url),
              user2:user2_id (id, name, avatar_url)
            `
              )
              .eq("id", payload.new.chat_id)
              .single();

            if (!chatData) return;

            // בדיקה אם זה צ'אט של המשתמש הנוכחי
            const isUserInChat =
              chatData.user1.id === userProfile.id ||
              chatData.user2.id === userProfile.id;

            if (!isUserInChat) return;

            // Use the functional update pattern to access the current chats state
            // without having a dependency on the chats variable
            setChats((prevChats) => {
              // בדיקה אם הצ'אט כבר קיים ברשימה
              const chatIndex = prevChats.findIndex(
                (c) => c.id === chatData.id
              );

              if (chatIndex >= 0) {
                // Create a new copy of prevChats to avoid mutating state

                // Perform the async operation outside and then call setState again
                // instead of inside the setState function
                supabase
                  .from("profiles")
                  .select("id, name, avatar_url")
                  .eq("id", payload.new.sender_id)
                  .single()
                  .then(({ data: senderData }) => {
                    if (!senderData) return;

                    setChats((latestChats) => {
                      // Get the latest state again
                      const latestChatIndex = latestChats.findIndex(
                        (c) => c.id === chatData.id
                      );
                      if (latestChatIndex < 0) return latestChats;

                      const newChats = [...latestChats];
                      newChats[latestChatIndex] = {
                        ...newChats[latestChatIndex],
                        latest_message: {
                          ...payload.new,
                          sender: senderData,
                        },
                        unread_count:
                          payload.new.sender_id !== userProfile.id
                            ? newChats[latestChatIndex].unread_count + 1
                            : newChats[latestChatIndex].unread_count,
                      };

                      // מיון מחדש לפי ההודעה האחרונה
                      return newChats.sort((a, b) => {
                        const aTime = a.latest_message
                          ? new Date(a.latest_message.created_at).getTime()
                          : 0;
                        const bTime = b.latest_message
                          ? new Date(b.latest_message.created_at).getTime()
                          : 0;
                        return bTime - aTime;
                      });
                    });
                  });

                // Return the current chats without changes - we'll update in the async callback
                return prevChats;
              } else {
                // טעינה מחדש של כל הצ'אטים במקרה של צ'אט חדש
                // Call fetchChats() outside of setState to avoid dependency issues
                fetchChats();
                return prevChats;
              }
            });
          } catch (err) {
            console.error("שגיאה בטיפול בהודעת צ'אט חדשה:", err);
          }
        }
      )
      .subscribe();

    setRealtimeSubscription(subscription);

    // פונקציית ניקוי שמסירה את ההרשמה
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
        setRealtimeSubscription(null);
      }
    };
  }, [userProfile, fetchChats]); // Remove chats from dependency array
  // טעינה ראשונית
  useEffect(() => {
    if (userProfile?.id) {
      fetchChats();
      const cleanup = setupRealtimeSubscription();

      return cleanup;
    }
  }, [userProfile, fetchChats, setupRealtimeSubscription]);

  // פיענוח זמן יחסי להודעה האחרונה
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "";

    const now = new Date();
    const messageTime = new Date(timestamp);

    const diffMs = now - messageTime;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return diffDay === 1 ? "אתמול" : `לפני ${diffDay} ימים`;
    } else if (diffHour > 0) {
      return `לפני ${diffHour} שעות`;
    } else if (diffMin > 0) {
      return `לפני ${diffMin} דקות`;
    } else {
      return "כרגע";
    }
  };

  // טיפול בפתיחת צ'אט חדש עם משתמש
  const handleStartNewChat = async (targetUserId) => {
    if (!userProfile?.id || !targetUserId) return;

    try {
      setLoading(true);

      // יצירת צ'אט או קבלת קיים
      const { data, error } = await privateChatService.ensurePrivateChatExists(
        userProfile.id,
        targetUserId
      );

      if (error) throw error;

      // סגירת המודל
      setShowNewChatModal(false);

      // ניווט לצ'אט החדש
      navigate(`/chat/${data.id}`);
    } catch (err) {
      console.error("שגיאה בפתיחת צ'אט חדש:", err);
      setError("לא ניתן היה ליצור צ'אט חדש");
    } finally {
      setLoading(false);
    }
  };

  // טיפול בניקוי הודעת שגיאה
  const clearError = () => {
    setError(null);
  };

  // מעבר לצ'אט ספציפי
  const goToChat = (chatId) => {
    navigate(`/chat/${chatId}`);
  };

  // אם המשתמש לא מחובר, מעבר לדף התחברות
  if (!userProfile) {
    return (
      <div className={styles.noAuthContainer}>
        <h2>יש להתחבר כדי להשתמש בצ'אט</h2>
        <button onClick={() => navigate("/auth")} className={styles.authButton}>
          התחבר / הירשם
        </button>
      </div>
    );
  }

  return (
    <div className={styles.chatListContainer}>
      <header className={styles.chatListHeader}>
        <h1>הודעות</h1>
        <button
          className={styles.startChatButton}
          onClick={() => setShowNewChatModal(true)}
        >
          <FaPlus className={styles.buttonIcon} />
          התחל שיחה חדשה
        </button>
      </header>

      {/* חיפוש */}
      <div className={styles.searchContainer}>
        <FaSearch className={styles.searchIcon} />
        <input
          type="text"
          placeholder="חפש לפי שם..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        {searchTerm && (
          <button
            className={styles.clearSearchButton}
            onClick={() => setSearchTerm("")}
            aria-label="נקה חיפוש"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* הודעות שגיאה */}
      {error && (
        <div className={styles.errorContainer}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <p>{error}</p>
          <button className={styles.clearErrorButton} onClick={clearError}>
            <FaTimes />
          </button>
        </div>
      )}

      {/* תצוגת טעינה */}
      {loading && (
        <div className={styles.loadingContainer}>
          <FaSpinner className={styles.loadingSpinner} />
          <p>טוען שיחות...</p>
        </div>
      )}

      {/* רשימת השיחות */}
      {!loading && (
        <>
          {chats.length === 0 ? (
            <EmptyState
              type="no-chats"
              onAction={() => setShowNewChatModal(true)}
            />
          ) : filteredChats.length === 0 ? (
            <EmptyState type="no-results" onAction={() => setSearchTerm("")} />
          ) : (
            <ul className={styles.chatList}>
              {filteredChats.map((chat) => (
                <li
                  key={chat.id}
                  className={`${styles.chatItem} ${
                    chat.unread_count > 0 ? styles.unread : ""
                  }`}
                  onClick={() => goToChat(chat.id)}
                >
                  <div className={styles.chatAvatar}>
                    {chat.other_user.avatar_url ? (
                      <img
                        src={chat.other_user.avatar_url}
                        alt={chat.other_user.name}
                        className={styles.avatarImage}
                      />
                    ) : (
                      <div className={styles.defaultAvatar}>
                        <FaUser />
                      </div>
                    )}
                  </div>

                  <div className={styles.chatInfo}>
                    <div className={styles.chatHeader}>
                      <h3 className={styles.chatName}>
                        {chat.other_user.name}
                      </h3>
                      {chat.latest_message && (
                        <span className={styles.chatTime}>
                          <FaRegClock className={styles.timeIcon} />
                          {formatTimeAgo(chat.latest_message.created_at)}
                        </span>
                      )}
                    </div>

                    <div className={styles.latestMessage}>
                      {chat.latest_message ? (
                        <p className={styles.messageText}>
                          {chat.latest_message.sender_id === userProfile.id && (
                            <span className={styles.sentByMe}>את/ה: </span>
                          )}
                          {chat.latest_message.content}
                        </p>
                      ) : (
                        <p className={styles.noMessages}>אין הודעות עדיין</p>
                      )}

                      {chat.unread_count > 0 && (
                        <span className={styles.unreadBadge}>
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* אינדיקטור מצב מקוון משופר */}
                  <OnlineIndicator userId={chat.other_user.id} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* מודל יצירת שיחה חדשה */}
      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onSelectUser={handleStartNewChat}
          currentUserId={userProfile.id}
        />
      )}
    </div>
  );
}

export default ChatList;
