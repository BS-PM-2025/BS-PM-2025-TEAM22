// src/components/chat/PrivateChatRoom.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePrivateChat } from '../../hooks/usePrivateChat';
import { useOnlineStatus } from '../../contexts/OnlineStatusContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import EmptyState from './EmptyState';
import { 
  FaArrowRight, 
  FaPaperPlane, 
  FaSmile, 
  FaSpinner,
  FaExclamationTriangle,
  FaEllipsisV,
  FaUser,
  FaImage,
  FaChevronDown
} from 'react-icons/fa';
import styles from './styles/PrivateChatRoom.module.css';

/**
 * רכיב חדר צ'אט פרטי
 * מציג ומאפשר התכתבות פרטית בין שני משתמשים
 */
function PrivateChatRoom() {
  const { chatId } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [newMessage, setNewMessage] = useState('');
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  
  // שימוש בהוק usePrivateChat לניהול הצ'אט
  const {
    messages,
    loading,
    error,
    sending,
    otherUser,
    hasMore,
    isTyping,
    sendMessage,
    sendTypingEvent,
    loadMoreMessages
  } = usePrivateChat(chatId, userProfile);

  // קבלת נתוני הסטטוס המקוון
  const { onlineUsers, checkUserStatus } = useOnlineStatus();
  
  // בדיקת סטטוס המשתמש השני כאשר נטען
  useEffect(() => {
    if (otherUser?.id) {
      checkUserStatus(otherUser.id);
    }
  }, [otherUser, checkUserStatus]);
  
  // גלילה למטה בעת טעינה ובעת קבלת הודעה חדשה
  useEffect(() => {
    if (!loading && messagesEndRef.current && !hasMore) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading, messages, hasMore]);
  
  // האזנה לגלילה כדי להציג כפתור גלילה למטה
  useEffect(() => {
    const handleScroll = () => {
      if (!messagesContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      
      setShowScrollButton(isScrolledUp);
    };
    
    const containerEl = messagesContainerRef.current;
    if (containerEl) {
      containerEl.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (containerEl) {
        containerEl.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);
  
  // טיפול בשליחת הודעה
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!newMessage.trim() || sending) return;
    
    const result = await sendMessage(newMessage);
    
    if (result?.success) {
      setNewMessage('');
      messageInputRef.current?.focus();
    }
  };
  
  // גלילה למטה
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // טיפול בהוספת אימוג'י
  const handleAddEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setEmojiPickerVisible(false);
    messageInputRef.current?.focus();
  };
  
  // בדיקה אם הודעה היא חלק מרצף הודעות
  const isPartOfSequence = (index, messages) => {
    if (index === 0) return false;
    
    const currMsg = messages[index];
    const prevMsg = messages[index - 1];
    
    // בדיקה אם ההודעה הנוכחית ושולח ההודעה הקודמת הם אותו שולח
    return currMsg.sender_id === prevMsg.sender_id;
  };
  
  // בדיקה אם הודעה היא אחרונה ברצף
  const isLastInSequence = (index, messages) => {
    if (index === messages.length - 1) return true;
    
    const currMsg = messages[index];
    const nextMsg = messages[index + 1];
    
    // בדיקה אם ההודעה הנוכחית ושולח ההודעה הבאה אינם אותו שולח
    return currMsg.sender_id !== nextMsg.sender_id;
  };
  
  // פיענוח זמן יחסי
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';

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
  
  // אימוג'י נפוצים לבחירה מהירה
  const commonEmojis = ['😊', '👍', '❤️', '😂', '🔥', '👏', '🙏', '💪', '🤔', '😍'];
  
  // בדיקת סטטוס מקוון
  const userStatus = otherUser?.id ? onlineUsers[otherUser.id] || {} : {};
  const isOnline = userStatus.isOnline || false;
  const lastSeen = userStatus.lastSeen;
  
  // אם אין משתמש מחובר, החזר לדף ההתחברות
  if (!userProfile) {
    return (
      <div className={styles.authRequired}>
        <h2>נדרשת התחברות</h2>
        <p>יש להתחבר למערכת כדי לצפות בשיחות</p>
        <button onClick={() => navigate('/auth')} className={styles.authButton}>
          התחבר / הירשם
        </button>
      </div>
    );
  }
  
  return (
    <div className={styles.chatRoomContainer}>
      {/* כותרת הצ'אט */}
      <header className={styles.chatHeader}>
        <div className={styles.backButton}>
          <button onClick={() => navigate('/chats')} aria-label="חזרה לרשימת השיחות">
            <FaArrowRight />
          </button>
        </div>
        
        {otherUser ? (
          <div className={styles.userInfo}>
            <Link to={`/profile/${otherUser.id}`} className={styles.userAvatar}>
              {otherUser.avatar_url ? (
                <img 
                  src={otherUser.avatar_url} 
                  alt={otherUser.name} 
                  className={styles.avatarImage}
                />
              ) : (
                <div className={styles.defaultAvatar}>
                  <FaUser />
                </div>
              )}
            </Link>
            
            <div className={styles.chatInfo}>
              <Link to={`/profile/${otherUser.id}`} className={styles.userName}>
                {otherUser.name}
              </Link>
              <span className={styles.statusText}>
                {isOnline ? 'מקוון' : lastSeen ? `נראה לאחרונה ${formatTimeAgo(lastSeen)}` : 'לא מקוון'}
              </span>
            </div>
          </div>
        ) : (
          <div className={styles.loadingUserInfo}>
            <div className={styles.skeletonAvatar}></div>
            <div className={styles.skeletonText}></div>
          </div>
        )}
        
        <div className={styles.chatActions}>
          <button 
            className={styles.optionsButton}
            onClick={() => setShowOptions(!showOptions)}
            aria-label="אפשרויות"
          >
            <FaEllipsisV />
          </button>
          
          {showOptions && (
            <div className={styles.optionsMenu}>
              <Link to={`/profile/${otherUser?.id}`} className={styles.optionItem}>
                צפה בפרופיל
              </Link>
              <button className={styles.optionItem}>
                נקה שיחה
              </button>
              <button className={styles.optionItem}>
                חסום משתמש
              </button>
            </div>
          )}
        </div>
      </header>
      
      {/* הודעות שגיאה */}
      {error && (
        <div className={styles.errorContainer}>
          <FaExclamationTriangle className={styles.errorIcon} />
          <p>{error}</p>
        </div>
      )}
      
      {/* גוף הצ'אט - רשימת ההודעות */}
      <div 
        className={styles.chatBody}
        ref={messagesContainerRef}
      >
        {loading ? (
          <div className={styles.loadingContainer}>
            <FaSpinner className={styles.loadingSpinner} />
            <p>טוען שיחה...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyChat}>
            <EmptyState 
              type="empty-chat" 
              userName={otherUser?.name}
            />
          </div>
        ) : (
          <div className={styles.messagesContainer}>
            {/* כפתור טעינת עוד הודעות */}
            {hasMore && (
              <div className={styles.loadMoreContainer}>
                <button 
                  className={styles.loadMoreButton}
                  onClick={loadMoreMessages}
                >
                  <FaChevronDown className={styles.loadMoreIcon} />
                  <span>טען הודעות קודמות</span>
                </button>
              </div>
            )}
            
            {/* הודעות */}
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id || `temp-${index}`}
                message={message}
                currentUserId={userProfile.id}
                isFirst={!isPartOfSequence(index, messages)}
                isLast={isLastInSequence(index, messages)}
              />
            ))}
            
            {/* אינדיקטור הקלדה */}
            {isTyping && <TypingIndicator user={otherUser} />}
            
          </div>
        )}
        
        {/* כפתור גלילה למטה */}
        {showScrollButton && (
          <button 
            className={styles.scrollButton}
            onClick={scrollToBottom}
            aria-label="גלול למטה"
          >
            <FaChevronDown />
          </button>
        )}
      </div>
      
      {/* טופס שליחת הודעה */}
      <form className={styles.messageForm} onSubmit={handleSendMessage}>
        <div className={styles.emojiButton}>
          <button 
            type="button"
            onClick={() => setEmojiPickerVisible(!emojiPickerVisible)}
            aria-label="הוסף אימוג'י"
          >
            <FaSmile />
          </button>
          
          {/* בחירת אימוג'י פשוטה */}
          {emojiPickerVisible && (
            <div className={styles.emojiPicker}>
              {commonEmojis.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className={styles.emojiOption}
                  onClick={() => handleAddEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.attachButton}>
          <button
            type="button"
            aria-label="צרף תמונה"
          >
            <FaImage />
          </button>
        </div>
        
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onInput={sendTypingEvent}
          placeholder="כתוב הודעה..."
          className={styles.messageInput}
          ref={messageInputRef}
          disabled={loading}
        />
        
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!newMessage.trim() || sending || loading}
          aria-label="שלח הודעה"
        >
          {sending ? (
            <FaSpinner className={styles.loadingSpinner} />
          ) : (
            <FaPaperPlane />
          )}
        </button>
      </form>
    </div>
  );
}

export default PrivateChatRoom;