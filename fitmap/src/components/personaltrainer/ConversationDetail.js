// src/components/workouts/ConversationDetail.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { 
  FaArrowRight, 
  FaUser, 
  FaRobot, 
  FaDumbbell,
  FaAppleAlt,
  FaComment,
  FaDownload,
  FaShare,
  FaPrint,
  FaExclamationTriangle,
  FaStar,
  FaRegStar,
  FaHeartbeat,
  FaBrain,
  FaRunning,
  FaInfo,
  FaCopy,
  FaCheck,
  FaEllipsisV,
  FaBookmark,
  FaRegBookmark,
  FaTrash,
  FaEdit
} from 'react-icons/fa';
import styles from './ConversationDetail.module.css';
import { toast } from 'react-toastify'; // וודא שהספרייה מותקנת

function ConversationDetail() {
  const { conversationId } = useParams();
  const { userProfile } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [showResponseActions, setShowResponseActions] = useState(false);
  const [rating, setRating] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [relatedConversations, setRelatedConversations] = useState([]);
  const [showFullResponse, setShowFullResponse] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const actionMenuRef = useRef(null);
  const navigate = useNavigate();

  // סגירת תפריט הפעולות כאשר לוחצים מחוץ לתפריט
  useEffect(() => {
    function handleClickOutside(event) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setActionMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchConversationDetails = async () => {
      if (!userProfile) return;

      try {
        setLoading(true);
        
        // שליפת השיחה
        const { data, error } = await supabase
          .from('ai_conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('user_id', userProfile.user_id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setConversation(data);
          setRating(data.user_rating || 0);
          setIsBookmarked(data.is_bookmarked || false);
          
          // שליפת שיחות קשורות
          const { data: relatedData } = await supabase
            .from('ai_conversations')
            .select('id, user_message, created_at, response_type')
            .eq('user_id', userProfile.user_id)
            .eq('response_type', data.response_type)
            .neq('id', conversationId)
            .order('created_at', { ascending: false })
            .limit(3);
            
          if (relatedData) {
            setRelatedConversations(relatedData);
          }
        } else {
          setError('השיחה המבוקשת לא נמצאה או שאין לך הרשאות לצפות בה.');
        }
      } catch (err) {
        console.error('שגיאה בעת שליפת פרטי השיחה:', err);
        setError('אירעה שגיאה בעת טעינת פרטי השיחה.');
      } finally {
        setLoading(false);
      }
    };

    fetchConversationDetails();
  }, [conversationId, userProfile]);

  // עדכון דירוג
  const handleRatingChange = async (newRating) => {
    try {
      // עדכון במסד הנתונים
      const { error } = await supabase
        .from('ai_conversations')
        .update({ user_rating: newRating })
        .eq('id', conversationId);

      if (error) throw error;

      setRating(newRating);
      toast.success('הדירוג עודכן בהצלחה!');
      
      // עדכון השיחה במצב המקומי
      setConversation(prev => ({ ...prev, user_rating: newRating }));
    } catch (err) {
      console.error('שגיאה בעדכון הדירוג:', err);
      toast.error('אירעה שגיאה בעדכון הדירוג');
    }
  };

  // עדכון סימניה
  const toggleBookmark = async () => {
    try {
      const newBookmarkStatus = !isBookmarked;
      
      // עדכון במסד הנתונים
      const { error } = await supabase
        .from('ai_conversations')
        .update({ is_bookmarked: newBookmarkStatus })
        .eq('id', conversationId);

      if (error) throw error;

      setIsBookmarked(newBookmarkStatus);
      toast.success(newBookmarkStatus ? 'השיחה נוספה למועדפים' : 'השיחה הוסרה מהמועדפים');
      
      // עדכון השיחה במצב המקומי
      setConversation(prev => ({ ...prev, is_bookmarked: newBookmarkStatus }));
    } catch (err) {
      console.error('שגיאה בעדכון סימניה:', err);
      toast.error('אירעה שגיאה בעדכון המועדפים');
    }
  };

  // העתקת תשובה
  const handleCopyResponse = () => {
    navigator.clipboard.writeText(conversation.ai_response)
      .then(() => {
        setIsCopied(true);
        toast.success('התשובה הועתקה ללוח');
        
        // איפוס סטטוס ההעתקה אחרי 3 שניות
        setTimeout(() => {
          setIsCopied(false);
        }, 3000);
      })
      .catch(err => {
        console.error('שגיאה בהעתקה:', err);
        toast.error('לא ניתן להעתיק את התשובה');
      });
  };

  // מחיקת שיחה
  const handleDeleteConversation = async () => {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      toast.success('השיחה נמחקה בהצלחה');
      navigate('/conversations');
    } catch (err) {
      console.error('שגיאה במחיקת השיחה:', err);
      toast.error('אירעה שגיאה במחיקת השיחה');
      setShowDeleteConfirm(false);
    }
  };

  // הורדת השיחה כקובץ טקסט
  const handleDownload = () => {
    if (!conversation) return;

    const content = `שיחה עם מאמן אישי - ${new Date(conversation.created_at).toLocaleString('he-IL')}\n\n` +
      `שאלה: ${conversation.user_message}\n\n` +
      `תשובה: ${conversation.ai_response}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `שיחה-מאמן-אישי-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('השיחה הורדה בהצלחה');
  };

  // שיתוף השיחה (אם יש תמיכה בדפדפן)
  const handleShare = async () => {
    if (!conversation) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'שיחה עם המאמן האישי',
          text: `שאלה: ${conversation.user_message}\n\nתשובה: ${conversation.ai_response}`,
        });
      } catch (err) {
        console.error('שגיאה בשיתוף:', err);
      }
    } else {
      // פתרון חלופי - העתקה ללוח
      navigator.clipboard.writeText(
        `שאלה: ${conversation.user_message}\n\nתשובה: ${conversation.ai_response}`
      ).then(() => {
        toast.success('השיחה הועתקה ללוח');
      });
    }
  };

  // הדפסת השיחה
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      toast.error('נא לאפשר חלונות קופצים כדי להדפיס את השיחה');
      return;
    }

    const content = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <title>שיחה עם מאמן אישי</title>
        <style>
          body { font-family: Assistant, Arial, sans-serif; line-height: 1.6; direction: rtl; padding: 20px; }
          h1 { color: #6d28d9; }
          .date { color: #6b7280; margin-bottom: 20px; }
          .question, .answer { margin-bottom: 30px; padding: 15px; border-radius: 8px; }
          .question { background-color: #e0f2fe; }
          .answer { background-color: #f3e8ff; }
          .header { font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
          footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 0.9em; }
          .metadata { margin: 20px 0; padding: 10px; background-color: #f9fafb; border-radius: 8px; }
          .metadata div { margin-bottom: 5px; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.8em; margin-right: 5px; }
          .badge-primary { background-color: #e0f2fe; color: #1e40af; }
          .badge-energy { background-color: #fef3c7; color: #92400e; }
          .badge-secondary { background-color: #f3f4f6; color: #4b5563; }
        </style>
      </head>
      <body>
        <h1>שיחה עם מאמן אישי</h1>
        <div class="date">
          ${new Date(conversation.created_at).toLocaleString('he-IL')}
        </div>
        
        <div class="metadata">
          <div>סוג תשובה: ${getResponseTypeLabel(conversation.response_type)}</div>
          <div>מקור: ${conversation.ai_model === 'gpt-3.5-turbo' ? 'תשובת AI' : 'תשובה מוכנה מראש'}</div>
          ${conversation.user_rating ? `<div>דירוג: ${conversation.user_rating}/5</div>` : ''}
        </div>
        
        <div class="question">
          <div class="header">שאלה:</div>
          <div>${conversation.user_message}</div>
        </div>
        
        <div class="answer">
          <div class="header">תשובה:</div>
          <div>${conversation.ai_response.replace(/\n/g, '<br>')}</div>
        </div>
        
        <footer>
          FitDray - המאמן האישי הדיגיטלי
        </footer>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();

    // נחכה שהדף ייטען ואז נדפיס
    printWindow.onload = function() {
      printWindow.print();
      // חלק מהדפדפנים יסגרו את החלון אוטומטית, אחרים לא
    };
  };

  // הכנת שיחה חדשה עם אותה שאלה
  const handleReAsk = () => {
    if (!conversation) return;
    
    navigate('/trainer', { 
      state: { 
        initialQuestion: conversation.user_message,
        forceAiModel: true // אפשרות להכריח שימוש במודל AI
      } 
    });
  };

  // מעבר לעריכת השאלה
  const handleEditQuestion = () => {
    if (!conversation) return;
    
    navigate('/trainer', { 
      state: { 
        initialQuestion: conversation.user_message,
        isEditing: true,
        conversationId: conversationId
      } 
    });
  };

  // הצגת אייקון לפי סוג תשובה
  const getResponseTypeIcon = (type) => {
    switch(type) {
      case 'workout':
        return <FaDumbbell className={styles.typeIcon} title="תוכנית אימון" />;
      case 'nutrition':
        return <FaAppleAlt className={styles.typeIcon} title="תזונה" />;
      case 'motivation':
        return <FaBrain className={styles.typeIcon} title="מוטיבציה" />;
      case 'health':
        return <FaHeartbeat className={styles.typeIcon} title="בריאות" />;
      case 'fitness':
        return <FaRunning className={styles.typeIcon} title="כושר" />;
      default:
        return <FaComment className={styles.typeIcon} title="כללי" />;
    }
  };

  // קבלת שם הקטגוריה לפי קוד
  const getResponseTypeLabel = (type) => {
    switch(type) {
      case 'workout': return 'תוכנית אימון';
      case 'nutrition': return 'תזונה';
      case 'motivation': return 'מוטיבציה';
      case 'health': return 'בריאות';
      case 'fitness': return 'כושר';
      default: return 'כללי';
    }
  };

  // הצגת תגית לפי סוג תשובה 
  const getResponseTypeBadge = (type) => {
    switch(type) {
      case 'workout':
        return <span className="badge badge-primary">תוכנית אימון</span>;
      case 'nutrition':
        return <span className="badge badge-energy">תזונה</span>;
      case 'motivation':
        return <span className="badge badge-motivation">מוטיבציה</span>;
      case 'health':
        return <span className="badge badge-health">בריאות</span>;
      case 'fitness':
        return <span className="badge badge-fitness">כושר</span>;
      default:
        return <span className="badge badge-secondary">כללי</span>;
    }
  };

  // בדיקה אם התוכן ארוך
  const isLongContent = (text) => {
    return text && text.length > 500;
  };

  // קיצור טקסט אם הוא ארוך
  const truncateText = (text, maxLength = 500) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // השורות הראשונות להרחבה/צמצום
  const getDisplayText = () => {
    if (!conversation) return '';
    
    if (showFullResponse || !isLongContent(conversation.ai_response)) {
      return conversation.ai_response;
    }
    
    return truncateText(conversation.ai_response);
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className="spinner spinner-md"></div>
        <p>טוען את פרטי השיחה...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <FaExclamationTriangle className={styles.errorIcon} />
        <h3>אירעה שגיאה</h3>
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          חזרה לרשימת השיחות
        </button>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className={styles.errorState}>
        <FaExclamationTriangle className={styles.errorIcon} />
        <h3>השיחה לא נמצאה</h3>
        <p>לא ניתן למצוא את השיחה המבוקשת</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          חזרה לרשימת השיחות
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* כותרת ופעולות ראשיות */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <FaArrowRight /> חזור לרשימת השיחות
        </button>
        <h2 className={styles.title}>צפייה בשיחה</h2>
        
        <div className={styles.primaryActions}>
          <button 
            className={`${styles.bookmarkButton} ${isBookmarked ? styles.bookmarked : ''}`}
            onClick={toggleBookmark}
            title={isBookmarked ? "הסר מהמועדפים" : "הוסף למועדפים"}
          >
            {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
          </button>
          
          <div className={styles.actionMenuContainer} ref={actionMenuRef}>
            <button 
              className={styles.menuButton} 
              onClick={() => setActionMenuOpen(!actionMenuOpen)}
              aria-label="פעולות נוספות"
            >
              <FaEllipsisV />
            </button>
            
            {actionMenuOpen && (
              <div className={styles.actionMenu}>
                <button onClick={handleEditQuestion} className={styles.menuItem}>
                  <FaEdit className={styles.menuIcon} /> ערוך שאלה
                </button>
                <button onClick={handleReAsk} className={styles.menuItem}>
                  <FaRobot className={styles.menuIcon} /> שאל שוב עם AI
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className={styles.menuItem}>
                  <FaTrash className={styles.menuIcon} /> מחק שיחה
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* מידע על השיחה */}
      <div className={styles.metaInfo}>
        <div className={styles.dateTimeInfo}>
          <span className={styles.label}>תאריך:</span>
          <span className={styles.value}>
            {new Date(conversation.created_at).toLocaleDateString('he-IL')}
          </span>
          <span className={styles.label}>שעה:</span>
          <span className={styles.value}>
            {new Date(conversation.created_at).toLocaleTimeString('he-IL', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        <div className={styles.typeInfo}>
          <span className={styles.label}>סוג:</span>
          <span className={styles.typeValue}>
            {getResponseTypeIcon(conversation.response_type)}
            {getResponseTypeBadge(conversation.response_type)}
          </span>
          <span className={styles.label}>מקור:</span>
          <span className={styles.modelValue}>
            {conversation.ai_model === 'gpt-3.5-turbo' ? (
              <span className={styles.aiModelPill}>AI</span>
            ) : (
              <span className={styles.presetPill}>תשובות מוכנות</span>
            )}
          </span>
        </div>
      </div>

      {/* דירוג */}
      <div className={styles.ratingSection}>
        <p className={styles.ratingLabel}>דרג את התשובה:</p>
        <div className={styles.ratingStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              className={styles.starButton}
              onClick={() => handleRatingChange(star)}
              aria-label={`דירוג ${star} מתוך 5`}
            >
              {star <= rating ? (
                <FaStar className={styles.starFilled} />
              ) : (
                <FaRegStar className={styles.starEmpty} />
              )}
            </button>
          ))}
          {rating > 0 && (
            <span className={styles.ratingText}>{rating}/5</span>
          )}
        </div>
      </div>

      {/* תוכן השיחה */}
      <div className={styles.conversationContent}>
        <div className={styles.userQuestion}>
          <div className={styles.msgHeader}>
            <FaUser className={styles.userIcon} />
            <strong>השאלה שלך</strong>
          </div>
          <div className={styles.messageText}>
            {conversation.user_message}
          </div>
        </div>

        <div 
          className={styles.aiResponse}
          onMouseEnter={() => setShowResponseActions(true)}
          onMouseLeave={() => setShowResponseActions(false)}
        >
          <div className={styles.msgHeader}>
            <FaRobot className={styles.botIcon} />
            <strong>תשובת המאמן</strong>
            
            {showResponseActions && (
              <div className={styles.responseActions}>
                <button 
                  className={styles.responseAction} 
                  onClick={handleCopyResponse}
                  title="העתק תשובה"
                >
                  {isCopied ? <FaCheck /> : <FaCopy />}
                </button>
              </div>
            )}
          </div>
          
          <div className={styles.messageText}>
            {getDisplayText().split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < getDisplayText().split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
            
            {isLongContent(conversation.ai_response) && (
              <button 
                className={styles.expandButton}
                onClick={() => setShowFullResponse(!showFullResponse)}
              >
                {showFullResponse ? 'הצג פחות' : 'הצג עוד...'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* תשובות דומות/קשורות */}
      {relatedConversations.length > 0 && (
        <div className={styles.relatedConversations}>
          <h3 className={styles.relatedTitle}>
            <FaInfo /> שיחות קשורות
          </h3>
          <div className={styles.relatedList}>
            {relatedConversations.map(related => (
              <div 
                key={related.id} 
                className={styles.relatedItem}
                onClick={() => navigate(`/conversations/${related.id}`)}
              >
                <div className={styles.relatedIcon}>
                  {getResponseTypeIcon(related.response_type)}
                </div>
                <div className={styles.relatedContent}>
                  <div className={styles.relatedQuestion}>
                    {truncateText(related.user_message, 60)}
                  </div>
                  <div className={styles.relatedDate}>
                    {new Date(related.created_at).toLocaleDateString('he-IL')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* כפתורי פעולה */}
      <div className={styles.actionButtons}>
        <button className={styles.actionButton} onClick={handleDownload}>
          <FaDownload className={styles.actionIcon} />
          <span>הורד כטקסט</span>
        </button>
        <button className={styles.actionButton} onClick={handleShare}>
          <FaShare className={styles.actionIcon} />
          <span>שתף</span>
        </button>
        <button className={styles.actionButton} onClick={handlePrint}>
          <FaPrint className={styles.actionIcon} />
          <span>הדפס</span>
        </button>
      </div>

      {/* חלון אישור מחיקה */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>אישור מחיקה</h3>
            <p>האם אתה בטוח שברצונך למחוק את השיחה הזו? לא ניתן לבטל פעולה זו.</p>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowDeleteConfirm(false)}
              >
                ביטול
              </button>
              <button 
                className={styles.deleteButton}
                onClick={handleDeleteConversation}
              >
                מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConversationDetail;