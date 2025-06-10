import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FaTimes, FaWhatsapp, FaTelegram, FaFacebook, FaTwitter, FaLink,
  FaCheck, FaSpinner, FaSearch, FaUsers,FaExclamationTriangle,FaEdit, FaUserPlus,      
} from 'react-icons/fa';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import './styles/ShareWorkoutModal.css'; // CSS מותאם אישית לרכיב
/**
 * מודל לשיתוף אימון במגוון פלטפורמות - גרסה משודרגת
 * עם אפשרויות שיתוף מתקדמות ושיפורי נגישות
 */
function ShareWorkoutModal({ 
  workout, 
  onClose,
  onShare
}) {
  const { userProfile } = useAuth();
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareText, setShareText] = useState('');
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [shareTextEditable, setShareTextEditable] = useState(false);
  
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // יצירת כתובת ה-URL והטקסט לשיתוף
  useEffect(() => {
    const url = `${window.location.origin}/group-workouts/${workout?.id || ''}`;
    setShareUrl(url);
    
    // יצירת טקסט לשיתוף
    const text = workout ? 
      `הצטרפו אליי לאימון "${workout.title}" בתאריך ${formatDate(workout.start_time)}${workout.facility_name ? ` ב${workout.facility_name}` : ''}` :
      'הצטרפו לאימון משותף באפליקציית האימונים שלנו!';
    
    setShareText(text);
  }, [workout]);
  
  // האזנה לקליקים מחוץ למודל
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // התמקדות על שדה החיפוש כאשר מציגים את רשימת החברים
  useEffect(() => {
    if (showFriendsList && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [showFriendsList]);
  
  // סינון חברים לפי חיפוש
  useEffect(() => {
    if (friends.length === 0) return;
    
    if (!searchTerm.trim()) {
      setFilteredFriends(friends);
    } else {
      const term = searchTerm.toLowerCase().trim();
      const filtered = friends.filter(friend => 
        friend.name.toLowerCase().includes(term)
      );
      setFilteredFriends(filtered);
    }
  }, [searchTerm, friends]);

  // פונקציה לפרמוט תאריך
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    return new Date(dateString).toLocaleString('he-IL', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // העתקת קישור ללוח
  const copyToClipboard = async () => {
    const textToCopy = `${shareText} ${shareUrl}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      // איפוס ההודעה אחרי 3 שניות
      setTimeout(() => setCopySuccess(false), 3000);
      
      // הפעלת קולבק שיתוף
      if (onShare) {
        onShare('copy', textToCopy);
      }
    } catch (err) {
      console.error('שגיאה בהעתקה ללוח:', err);
    }
  };

  // פתיחת חלון שיתוף של הדפדפן (אם זמין)
  const useNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: workout?.title || 'שיתוף אימון',
          text: shareText,
          url: shareUrl
        });
        
        // הפעלת קולבק שיתוף
        if (onShare) {
          onShare('native', { title: workout?.title, text: shareText, url: shareUrl });
        }
      } catch (err) {
        if (err.name !== 'AbortError') { // התעלם משגיאות ביטול של המשתמש
          console.error('שגיאה בשיתוף:', err);
        }
      }
    } else {
      // אם API השיתוף לא זמין, מעתיק ללוח
      copyToClipboard();
    }
  };
  
  // שיתוף ברשת חברתית
  const shareToSocialMedia = (platform) => {
    let shareUrl;
    const fullShareUrl = `${shareText} ${shareUrl}`;
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(fullShareUrl)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareUrl)}`;
        break;
      default:
        return;
    }
    
    // פתיחת חלון שיתוף קטן
    const width = 575;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    const options = `status=1,width=${width},height=${height},top=${top},left=${left}`;
    
    window.open(shareUrl, `${platform}_share`, options);
    
    // הפעלת קולבק שיתוף
    if (onShare) {
      onShare(platform, fullShareUrl);
    }
  };

  // טעינת רשימת חברים מהדאטהבייס
  const fetchFriends = useCallback(async () => {
    if (!userProfile) return;
    
    if (friends.length > 0) return; // טעינה רק פעם אחת
    
    try {
      setLoading(true);
      
      // שליפת משתמשים שהמשתמש הנוכחי עוקב אחריהם
      const { data, error } = await supabase
        .from('follows')
        .select(`
          followed_id,
          followed_user:followed_id (
            id,
            name,
            avatar_url
          )
        `)
        .eq('follower_id', userProfile.user_id);
      
      if (error) throw error;
      
      // עיבוד הנתונים למבנה פשוט יותר
      const friendsList = data?.map(item => item.followed_user) || [];
      setFriends(friendsList);
      setFilteredFriends(friendsList);
      
    } catch (err) {
      console.error('שגיאה בטעינת רשימת חברים:', err);
    } finally {
      setLoading(false);
    }
  }, [userProfile, friends.length]);
  
  // כאשר מציגים את רשימת החברים, טוען את החברים
  useEffect(() => {
    if (showFriendsList) {
      fetchFriends();
    }
  }, [showFriendsList, fetchFriends]);

  // הזמנת חברים לאימון
  const inviteFriends = async () => {
    if (!userProfile || !workout || selectedFriends.length === 0) return;
    
    try {
      setLoading(true);
      setInviteError(null);
      
      // יצירת הזמנות לכל החברים שנבחרו
      const invites = selectedFriends.map(friend => ({
        sender_id: userProfile.user_id,
        recipient_id: friend.id,
        type: 'workout_invite',
        entity_id: workout.id,
        entity_type: 'workout',
        content: `${userProfile.name || 'משתמש'} הזמין אותך לאימון "${workout.title}"`,
        data: {
          workout_title: workout.title,
          workout_date: workout.start_time,
          workout_location: workout.facility_name
        },
        is_read: false,
        created_at: new Date().toISOString()
      }));
      
      // הוספת ההזמנות לטבלת ההתראות
      const { error } = await supabase
        .from('notifications')
        .insert(invites);
      
      if (error) throw error;
      
      setInviteSuccess(true);
      
      // הפעלת קולבק שיתוף
      if (onShare) {
        onShare('invite', { workout, friends: selectedFriends });
      }
      
      // איפוס הבחירה אחרי 3 שניות
      setTimeout(() => {
        setInviteSuccess(false);
        setSelectedFriends([]);
        setShowFriendsList(false);
      }, 3000);
      
    } catch (err) {
      console.error('שגיאה בשליחת הזמנות:', err);
      setInviteError('אירעה שגיאה בשליחת ההזמנות. אנא נסה שוב מאוחר יותר.');
    } finally {
      setLoading(false);
    }
  };

  // הוספה/הסרה של חבר מרשימת הנבחרים
  const toggleFriendSelection = (friend) => {
    setSelectedFriends(prev => {
      const isSelected = prev.some(f => f.id === friend.id);
      if (isSelected) {
        return prev.filter(f => f.id !== friend.id);
      } else {
        return [...prev, friend];
      }
    });
  };
  
  // בחירה/ביטול של כל החברים המוצגים
  const toggleSelectAll = () => {
    if (filteredFriends.length === 0) return;
    
    // בודק אם כל החברים המסוננים נבחרו
    const allSelected = filteredFriends.every(friend => 
      selectedFriends.some(selected => selected.id === friend.id)
    );
    
    if (allSelected) {
      // הסרת החברים המסוננים מהבחירה
      setSelectedFriends(prev => 
        prev.filter(selected => 
          !filteredFriends.some(friend => friend.id === selected.id)
        )
      );
    } else {
      // הוספת החברים המסוננים שעדיין לא נבחרו
      setSelectedFriends(prev => {
        const newSelection = [...prev];
        
        filteredFriends.forEach(friend => {
          if (!newSelection.some(selected => selected.id === friend.id)) {
            newSelection.push(friend);
          }
        });
        
        return newSelection;
      });
    }
  };
  
  // יצירת QR קוד עבור קישור האימון
  const generateQRCode = () => {
    // כאן אפשר להשתמש בספריית QR קוד כמו qrcode או react-qr-code
    // למטרות דוגמה, אנו רק מציגים ממשק
    setShowQRCode(!showQRCode);
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-workout-title"
    >
      <div 
        className="share-modal" 
        onClick={e => e.stopPropagation()}
        ref={modalRef}
      >
        <div className="modal-header">
          <h2 id="share-workout-title">שתף אימון</h2>
          <button 
            className="close-button" 
            onClick={onClose} 
            aria-label="סגור"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>
        
        <div className="modal-content">
          {/* כותרת האימון */}
          <div className="workout-preview">
            <h3>{workout?.title || 'אימון'}</h3>
            <p>
              {workout?.start_time && formatDate(workout.start_time)}
              {workout?.facility_name && ` ב${workout.facility_name}`}
            </p>
          </div>
          
          {/* טקסט לעריכה */}
          {shareTextEditable ? (
            <div className="editable-share-text">
              <textarea
                value={shareText}
                onChange={(e) => setShareText(e.target.value)}
                rows={3}
                placeholder="הזן טקסט לשיתוף..."
                aria-label="טקסט לשיתוף"
              />
              <button 
                className="done-edit-btn"
                onClick={() => setShareTextEditable(false)}
                aria-label="סיום עריכה"
              >
                <FaCheck aria-hidden="true" /> סיום עריכה
              </button>
            </div>
          ) : (
            <div className="share-text-preview">
              <p>{shareText}</p>
              <button 
                className="edit-text-btn"
                onClick={() => setShareTextEditable(true)}
                aria-label="ערוך טקסט שיתוף"
              >
                <FaEdit aria-hidden="true" /> ערוך
              </button>
            </div>
          )}
          
          {/* אפשרויות שיתוף */}
          <div className="share-options">
            <h4>שתף דרך</h4>
            <div className="share-buttons">
              <button 
                className="share-button whatsapp"
                onClick={() => shareToSocialMedia('whatsapp')}
                aria-label="שתף בוואטסאפ"
              >
                <FaWhatsapp aria-hidden="true" />
                <span>וואטסאפ</span>
              </button>
              
              <button 
                className="share-button telegram"
                onClick={() => shareToSocialMedia('telegram')}
                aria-label="שתף בטלגרם"
              >
                <FaTelegram aria-hidden="true" />
                <span>טלגרם</span>
              </button>
              
              <button 
                className="share-button facebook"
                onClick={() => shareToSocialMedia('facebook')}
                aria-label="שתף בפייסבוק"
              >
                <FaFacebook aria-hidden="true" />
                <span>פייסבוק</span>
              </button>
              
              <button 
                className="share-button twitter"
                onClick={() => shareToSocialMedia('twitter')}
                aria-label="שתף בטוויטר"
              >
                <FaTwitter aria-hidden="true" />
                <span>טוויטר</span>
              </button>
              
              <button 
                className="share-button copy"
                onClick={copyToClipboard}
                aria-label="העתק קישור"
              >
                {copySuccess ? <FaCheck aria-hidden="true" /> : <FaLink aria-hidden="true" />}
                <span>{copySuccess ? 'הועתק' : 'העתק קישור'}</span>
              </button>
              
              <button 
                className="share-button qrcode"
                onClick={generateQRCode}
                aria-label="הצג קוד QR"
              >
                <FaUserPlus aria-hidden="true" />
                <span>קוד QR</span>
              </button>
            </div>
            
            {/* תצוגת קוד QR */}
            {showQRCode && (
              <div className="qr-code-container">
                <div className="qr-code-placeholder">
                  {/* כאן יוצג קוד ה-QR האמיתי בגרסה שמשלבת ספריית QR */}
                  <div className="qr-placeholder" aria-label="קוד QR לשיתוף האימון">
                    <FaUserPlus aria-hidden="true" size={150} />
                    <p>קוד QR לשיתוף האימון</p>
                  </div>
                </div>
                <p className="qr-instructions">סרוק את הקוד כדי להצטרף לאימון</p>
              </div>
            )}
            
            {/* כפתור שיתוף מובנה (אם זמין) */}
            {navigator.share && (
              <button 
                className="native-share-button"
                onClick={useNativeShare}
                aria-label="שתף באמצעות..."
              >
                שתף באמצעות...
              </button>
            )}
          </div>
          
          {/* הזמנת חברים */}
          {userProfile && (
            <div className="invite-friends-section">
              <button 
                className="toggle-friends-button"
                onClick={() => setShowFriendsList(!showFriendsList)}
                aria-label={showFriendsList ? 'הסתר רשימת חברים' : 'הזמן חברים'}
                aria-expanded={showFriendsList}
              >
                <FaUsers aria-hidden="true" />
                {showFriendsList ? 'הסתר רשימת חברים' : 'הזמן חברים לאימון'}
              </button>
              
              {showFriendsList && (
                <div className="friends-list-container">
                  <div className="friends-search">
                    <div className="search-input-wrapper">
                      <FaSearch className="search-icon" aria-hidden="true" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="חפש חברים..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="friends-search-input"
                        aria-label="חיפוש חברים"
                      />
                      {searchTerm && (
                        <button 
                          className="clear-search"
                          onClick={() => setSearchTerm('')}
                          aria-label="נקה חיפוש"
                        >
                          <FaTimes aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    
                    {filteredFriends.length > 0 && (
                      <button 
                        className="select-all-btn"
                        onClick={toggleSelectAll}
                        aria-label="בחר/בטל הכל"
                      >
                        {filteredFriends.every(friend => 
                          selectedFriends.some(f => f.id === friend.id)
                        ) ? 'בטל הכל' : 'בחר הכל'}
                      </button>
                    )}
                  </div>
                  
                  {loading && friends.length === 0 ? (
                    <div className="loading-friends">
                      <FaSpinner className="loading-spinner" aria-hidden="true" />
                      <p>טוען רשימת חברים...</p>
                    </div>
                  ) : friends.length === 0 ? (
                    <p className="no-friends">לא נמצאו חברים. התחל לעקוב אחרי משתמשים כדי להזמין אותם.</p>
                  ) : filteredFriends.length === 0 ? (
                    <p className="no-search-results">לא נמצאו חברים התואמים לחיפוש.</p>
                  ) : (
                    <ul className="friends-list" role="listbox" aria-multiselectable="true">
                      {filteredFriends.map(friend => {
                        const isSelected = selectedFriends.some(f => f.id === friend.id);
                        
                        return (
                          <li 
                            key={friend.id} 
                            className={`friend-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleFriendSelection(friend)}
                            role="option"
                            aria-selected={isSelected}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                toggleFriendSelection(friend);
                                e.preventDefault();
                              }
                            }}
                          >
                            {friend.avatar_url ? (
                              <img 
                                src={friend.avatar_url} 
                                alt="" 
                                className="friend-avatar" 
                                aria-hidden="true"
                              />
                            ) : (
                              <div className="friend-avatar-placeholder" aria-hidden="true">
                                {friend.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                            )}
                            <span className="friend-name">{friend.name || 'משתמש'}</span>
                            <div className="friend-checkbox" aria-hidden="true">
                              {isSelected && <FaCheck />}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  
                  {/* הודעת שגיאה */}
                  {inviteError && (
                    <div className="invite-error" role="alert">
                      <FaExclamationTriangle aria-hidden="true" />
                      <p>{inviteError}</p>
                    </div>
                  )}
                  
                  {/* כפתור הזמנה */}
                  {selectedFriends.length > 0 && (
                    <button 
                      className="invite-button"
                      onClick={inviteFriends}
                      disabled={loading || inviteSuccess}
                      aria-label={`הזמן ${selectedFriends.length} חברים לאימון`}
                    >
                      {loading ? (
                        <><FaSpinner className="loading-spinner" aria-hidden="true" /> שולח הזמנות...</>
                      ) : inviteSuccess ? (
                        <><FaCheck aria-hidden="true" /> נשלחו הזמנות</>
                      ) : (
                        <>הזמן {selectedFriends.length} חברים</>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShareWorkoutModal;