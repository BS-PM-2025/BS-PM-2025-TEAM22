// src/components/workouts/ConversationHistory.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../utils/supabaseClient';
import styles from './ConversationHistory.module.css';
import { 
  FaArrowRight, 
  FaCalendarAlt, 
  FaUser, 
  FaRobot, 
  FaSearch, 
  FaFilter, 
  FaTrash, 
  FaSpinner,
  FaDumbbell,
  FaAppleAlt,
  FaComment,
  FaExclamationTriangle,
  FaHistory,
  FaTimes,
  FaSort,
  FaSortAmountDown,
  FaSortAmountUp,
  FaBookmark,
  FaRegBookmark,
  FaPlus,
  FaBrain,
  FaHeartbeat,
  FaRunning,
  FaStar,
  FaEllipsisV,
  FaPrint,
  FaDownload,
  FaShare,
  FaCheck,
  FaExclamation
} from 'react-icons/fa';
import { toast } from 'react-toastify'; // וודא שהספרייה מותקנת

function ConversationHistory() {
  const { userProfile } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedBookmark, setSelectedBookmark] = useState(false);
  const [selectedRating, setSelectedRating] = useState('');
  const [groupedConversations, setGroupedConversations] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc'); // desc=מהחדש לישן, asc=מהישן לחדש
  const [sortBy, setSortBy] = useState('date'); // date=תאריך, rating=דירוג
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [bookmarkUpdating, setBookmarkUpdating] = useState(null);
  const [statisticsData, setStatisticsData] = useState({
    totalConversations: 0,
    byType: {},
    byModel: {},
    averageRating: 0,
    recentActivity: []
  });
  const [showStatistics, setShowStatistics] = useState(false);
  const [selectedConversationActions, setSelectedConversationActions] = useState(null);
  const searchInputRef = useRef(null);
  const sortOptionsRef = useRef(null);
  const conversationActionsRef = useRef(null);
  const navigate = useNavigate();

  // סגירת תפריטים כאשר לוחצים מחוץ להם
  useEffect(() => {
    function handleClickOutside(event) {
      if (sortOptionsRef.current && !sortOptionsRef.current.contains(event.target)) {
        setShowSortOptions(false);
      }
      
      if (conversationActionsRef.current && !conversationActionsRef.current.contains(event.target)) {
        setSelectedConversationActions(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // שליפת השיחות וארגון לפי תאריכים
  useEffect(() => {
    const fetchConversations = async () => {
      if (!userProfile) return;

      setLoading(true);

      let query = supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', userProfile.user_id);

      // מיון תוצאות
      const order = sortOrder === 'desc' ? { ascending: false } : { ascending: true };
      const orderByField = sortBy === 'rating' ? 'user_rating' : 'created_at';
      query = query.order(orderByField, order);

      // אם יש סינון לפי מועדפים
      if (selectedBookmark) {
        query = query.eq('is_bookmarked', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('שגיאה בעת שליפת היסטוריית שיחות:', error);
        toast.error('אירעה שגיאה בעת טעינת היסטוריית השיחות');
      } else {
        setConversations(data);

        // ארגון השיחות לפי תאריכים
        const grouped = data.reduce((acc, conv) => {
          const date = new Date(conv.created_at).toLocaleDateString('he-IL');
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(conv);
          return acc;
        }, {});

        setGroupedConversations(grouped);

        // הגדרת כל הקבוצות כפתוחות כברירת מחדל
        const initialExpandedState = Object.keys(grouped).reduce((acc, date) => {
          acc[date] = true;
          return acc;
        }, {});

        setExpandedGroups(initialExpandedState);

        // מחשב סטטיסטיקה
        calculateStatistics(data);
      }

      setLoading(false);
    };

    fetchConversations();
  }, [userProfile, sortOrder, sortBy, selectedBookmark]);

  // חישוב סטטיסטיקות
  const calculateStatistics = (data) => {
    if (!data || !data.length) return;

    // סך כל שיחות
    const totalConversations = data.length;

    // חלוקה לפי סוג
    const byType = data.reduce((acc, conv) => {
      const type = conv.response_type || 'general';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // חלוקה לפי מודל
    const byModel = data.reduce((acc, conv) => {
      const model = conv.ai_model || 'standard';
      acc[model] = (acc[model] || 0) + 1;
      return acc;
    }, {});

    // ממוצע דירוג
    const ratingsCount = data.filter(conv => conv.user_rating).length;
    const ratingsSum = data.reduce((sum, conv) => sum + (conv.user_rating || 0), 0);
    const averageRating = ratingsCount > 0 ? (ratingsSum / ratingsCount).toFixed(1) : 0;

    // פעילות אחרונה - 7 ימים אחרונים
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentActivity = Array(7).fill(0);
    data.forEach(conv => {
      const convDate = new Date(conv.created_at);
      if (convDate >= oneWeekAgo) {
        const dayIndex = 6 - Math.floor((Date.now() - convDate) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < 7) {
          recentActivity[dayIndex]++;
        }
      }
    });

    setStatisticsData({
      totalConversations,
      byType,
      byModel,
      averageRating,
      recentActivity
    });
  };

  // סינון שיחות לפי חיפוש, תאריך, סוג ודירוג
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchTerm === '' || 
      conv.user_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.ai_response.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = selectedDate === '' || 
      new Date(conv.created_at).toLocaleDateString('he-IL') === selectedDate;

    const matchesType = selectedType === '' || 
      (selectedType === 'workout' && conv.response_type === 'workout') ||
      (selectedType === 'nutrition' && conv.response_type === 'nutrition') ||
      (selectedType === 'motivation' && conv.response_type === 'motivation') ||
      (selectedType === 'health' && conv.response_type === 'health') ||
      (selectedType === 'fitness' && conv.response_type === 'fitness') ||
      (selectedType === 'general' && (conv.response_type === 'general' || !conv.response_type));
      
    const matchesModel = selectedModel === '' || 
      (selectedModel === 'ai' && conv.ai_model === 'gpt-3.5-turbo') ||
      (selectedModel === 'standard' && conv.ai_model !== 'gpt-3.5-turbo');
      
    const matchesRating = selectedRating === '' || 
      (selectedRating === '5' && conv.user_rating === 5) ||
      (selectedRating === '4+' && conv.user_rating >= 4) ||
      (selectedRating === '3-' && conv.user_rating <= 3 && conv.user_rating > 0) ||
      (selectedRating === 'unrated' && !conv.user_rating);

    return matchesSearch && matchesDate && matchesType && matchesModel && matchesRating;
  });

  // קבלת הקבוצות המסוננות להצגה
  const getFilteredGroups = () => {
    if (selectedDate || searchTerm || selectedType || selectedModel || selectedRating || selectedBookmark) {
      const filtered = {};

      filteredConversations.forEach(conv => {
        const date = new Date(conv.created_at).toLocaleDateString('he-IL');
        if (!filtered[date]) {
          filtered[date] = [];
        }
        filtered[date].push(conv);
      });

      return filtered;
    }

    return groupedConversations;
  };

  // טיפול בלחיצה על כותרת קבוצה (פתיחה/סגירה)
  const toggleGroup = (date) => {
    setExpandedGroups(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  // פתיחה/סגירה של כל הקבוצות
  const toggleAllGroups = (expand) => {
    const dates = Object.keys(getFilteredGroups());
    const newState = dates.reduce((acc, date) => {
      acc[date] = expand;
      return acc;
    }, {});
    
    setExpandedGroups(newState);
  };

  // בחירת שיחה למחיקה
  const toggleItemSelection = (id, event) => {
    // מונע פעולה כשלוחצים על כפתורים פנימיים
    if (event.target.tagName === 'BUTTON' || event.target.closest('button')) return;
    
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // בחירת/ביטול בחירת כל השיחות
  const toggleSelectAll = () => {
    if (selectedItems.length === filteredConversations.length) {
      // אם כל השיחות נבחרו כבר, מבטל את כולן
      setSelectedItems([]);
    } else {
      // אחרת בוחר את כל השיחות
      setSelectedItems(filteredConversations.map(conv => conv.id));
    }
  };

  // מחיקת שיחות נבחרות
  const deleteSelectedItems = async () => {
    if (!selectedItems.length) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('ai_conversations')
        .delete()
        .in('id', selectedItems);

      if (error) {
        console.error('שגיאה במחיקת שיחות:', error);
        toast.error('אירעה שגיאה במחיקת השיחות');
      } else {
        // עדכון הממשק לאחר מחיקה
        setConversations(prev => prev.filter(conv => !selectedItems.includes(conv.id)));
        setSelectedItems([]);

        // עדכון הקבוצות
        const updatedConvs = conversations.filter(conv => !selectedItems.includes(conv.id));
        const updatedGroups = updatedConvs.reduce((acc, conv) => {
          const date = new Date(conv.created_at).toLocaleDateString('he-IL');
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(conv);
          return acc;
        }, {});

        setGroupedConversations(updatedGroups);
        
        // עדכון סטטיסטיקות
        calculateStatistics(updatedConvs);
        
        toast.success(`${selectedItems.length} שיחות נמחקו בהצלחה`);
      }
    } catch (error) {
      console.error('שגיאה במחיקת שיחות:', error);
      toast.error('אירעה שגיאה במחיקת השיחות');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  // עדכון סימניה
  const toggleBookmark = async (id) => {
    if (bookmarkUpdating === id) return;
    
    const conversation = conversations.find(conv => conv.id === id);
    if (!conversation) return;
    
    const newStatus = !conversation.is_bookmarked;
    setBookmarkUpdating(id);
    
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ is_bookmarked: newStatus })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // עדכון במצב המקומי
      setConversations(prev => 
        prev.map(conv => 
          conv.id === id ? { ...conv, is_bookmarked: newStatus } : conv
        )
      );
      
      toast.success(newStatus ? 'השיחה נוספה למועדפים' : 'השיחה הוסרה מהמועדפים');
      
    } catch (error) {
      console.error('שגיאה בעדכון סימניה:', error);
      toast.error('אירעה שגיאה בעדכון המועדפים');
    } finally {
      setBookmarkUpdating(null);
    }
  };

  // ניקוי כל הסינונים
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDate('');
    setSelectedType('');
    setSelectedModel('');
    setSelectedRating('');
    
    // מתמקד בשדה החיפוש
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // ביצוע חיפוש מהיר
  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(true);
    
    // סימולציה של עיכוב חיפוש
    setTimeout(() => {
      setIsSearching(false);
    }, 300);
  };

  // קיצור טקסט ארוך
  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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

  // קבלת שם הקטגוריה
  const getResponseTypeName = (type) => {
    switch(type) {
      case 'workout': return 'תוכנית אימון';
      case 'nutrition': return 'תזונה';
      case 'motivation': return 'מוטיבציה';
      case 'health': return 'בריאות';
      case 'fitness': return 'כושר';
      default: return 'כללי';
    }
  };

  // הצגת דירוג כוכבים
  const renderRatingStars = (rating) => {
    if (!rating) return null;
    
    return (
      <div className={styles.ratingStars}>
        {Array.from({ length: 5 }).map((_, i) => (
          <FaStar 
            key={i} 
            className={i < rating ? styles.starFilled : styles.starEmpty} 
          />
        ))}
      </div>
    );
  };

  // מנהל עיבוד פעולות על שיחה יחידה
  const handleConversationAction = async (action, conversation) => {
    setSelectedConversationActions(null);
    
    switch(action) {
      case 'view':
        navigate(`/conversation/${conversation.id}`);
        break;
        
      case 'bookmark':
        toggleBookmark(conversation.id);
        break;
        
      case 'delete':
        setSelectedItems([conversation.id]);
        setShowDeleteConfirmation(true);
        break;
        
      case 'reAsk':
        navigate('/trainer', { 
          state: { 
            initialQuestion: conversation.user_message,
            forceAiModel: true
          } 
        });
        break;
        
      case 'print':
        printConversation(conversation);
        break;
        
      case 'download':
        downloadConversation(conversation);
        break;
        
      case 'share':
        shareConversation(conversation);
        break;
        
      default:
        break;
    }
  };

  // הדפסת שיחה
  const printConversation = (conversation) => {
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
        </style>
      </head>
      <body>
        <h1>שיחה עם מאמן אישי</h1>
        <div class="date">
          ${new Date(conversation.created_at).toLocaleString('he-IL')}
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

  // הורדת שיחה כקובץ טקסט
  const downloadConversation = (conversation) => {
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

  // שיתוף שיחה
  const shareConversation = async (conversation) => {
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

  // סטטיסטיקה ותובנות
  const renderStatistics = () => {
    if (!statisticsData.totalConversations) return null;
    
    return (
      <div className={styles.statisticsPanel}>
        <h3 className={styles.statsTitle}>סטטיסטיקות שיחות</h3>
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h4>סך הכל שיחות</h4>
            <div className={styles.statValue}>{statisticsData.totalConversations}</div>
          </div>
          
          <div className={styles.statCard}>
            <h4>דירוג ממוצע</h4>
            <div className={styles.statValue}>
              {statisticsData.averageRating}
              <div className={styles.ratingStars}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar 
                    key={i} 
                    className={i < Math.round(statisticsData.averageRating) ? styles.starFilled : styles.starEmpty} 
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <h4>התפלגות לפי סוג</h4>
            <div className={styles.typeDistribution}>
              {Object.entries(statisticsData.byType).map(([type, count]) => (
                <div key={type} className={styles.typeItem}>
                  <span>{getResponseTypeName(type)}</span>
                  <div className={styles.typeBar}>
                    <div 
                      className={styles.typeFill} 
                      style={{ 
                        width: `${(count / statisticsData.totalConversations) * 100}%`,
                        backgroundColor: getTypeColor(type)
                      }}
                    ></div>
                  </div>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.statCard}>
            <h4>פעילות 7 ימים אחרונים</h4>
            <div className={styles.activityChart}>
              {statisticsData.recentActivity.map((count, index) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - index));
                const dayLabel = date.toLocaleDateString('he-IL', { weekday: 'short' });
                
                return (
                  <div key={index} className={styles.activityDay}>
                    <div 
                      className={styles.activityBar} 
                      style={{ 
                        height: `${count ? Math.max((count / Math.max(...statisticsData.recentActivity)) * 100, 10) : 0}%` 
                      }}
                    >
                      {count > 0 && <span className={styles.activityCount}>{count}</span>}
                    </div>
                    <div className={styles.activityLabel}>{dayLabel}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <button 
          className={styles.closeStatsButton}
          onClick={() => setShowStatistics(false)}
        >
          סגור
        </button>
      </div>
    );
  };

  // קבלת צבע עבור סוג תשובה
  const getTypeColor = (type) => {
    switch(type) {
      case 'workout': return 'var(--primary)';
      case 'nutrition': return 'var(--energy)';
      case 'motivation': return 'var(--calm)';
      case 'health': return 'var(--healing)';
      case 'fitness': return 'var(--nature)';
      default: return 'var(--text-secondary)';
    }
  };

  // בדיקה אם יש פילטרים פעילים
  const hasActiveFilters = () => {
    return selectedDate || selectedType || selectedModel || selectedRating || selectedBookmark || searchTerm;
  };

  if (!userProfile) {
    return (
      <div className={styles.emptyState}>
        <FaExclamationTriangle className={styles.emptyStateIcon} />
        <h2>יש להתחבר תחילה</h2>
        <p>אנא התחבר כדי לראות את היסטוריית השיחות שלך</p>
        <button className={`btn btn-primary ${styles.loginButton}`} onClick={() => navigate('/auth')}>התחברות / הרשמה</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className="spinner spinner-md"></div>
        <p>טוען את היסטוריית השיחות...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* כותרת ופעולות ראשיות */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <FaArrowRight /> חזור
        </button>
        <h2 className={styles.title}>היסטוריית שיחות עם המאמן</h2>
        
        <div className={styles.headerActions}>
          <button 
            className={styles.statsButton} 
            onClick={() => setShowStatistics(!showStatistics)}
            title="סטטיסטיקה"
          >
            <FaHistory />
          </button>
          
          <button
            className={styles.newConversationButton}
            onClick={() => navigate('/trainer')}
            title="שיחה חדשה"
          >
            <FaPlus />
          </button>
        </div>
      </div>

      {/* סטטיסטיקה ותובנות */}
      {showStatistics && renderStatistics()}

      {/* חיפוש וסינון */}
      <div className={styles.toolbarContainer}>
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <div className={styles.searchContainer}>
            {isSearching ? (
              <FaSpinner className={`${styles.searchIcon} ${styles.spinnerIcon}`} />
            ) : (
              <FaSearch className={styles.searchIcon} />
            )}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש בהיסטוריה..."
              className={styles.searchInput}
              ref={searchInputRef}
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.clearSearchButton}
                onClick={() => setSearchTerm('')}
              >
                <FaTimes />
              </button>
            )}
          </div>
        </form>

        <div className={styles.toolbarButtons}>
          <div className={styles.sortContainer}>
            <button
              className={styles.sortButton}
              onClick={() => setShowSortOptions(!showSortOptions)}
              title="מיון"
              ref={sortOptionsRef}
            >
              {sortOrder === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
            </button>
            
            {showSortOptions && (
              <div className={styles.sortOptions}>
                <button 
                  className={`${styles.sortOption} ${sortBy === 'date' && sortOrder === 'desc' ? styles.activeSort : ''}`}
                  onClick={() => { setSortBy('date'); setSortOrder('desc'); setShowSortOptions(false); }}
                >
                  <span>חדש לישן</span>
                  {sortBy === 'date' && sortOrder === 'desc' && <FaCheck className={styles.checkIcon} />}
                </button>
                <button 
                  className={`${styles.sortOption} ${sortBy === 'date' && sortOrder === 'asc' ? styles.activeSort : ''}`}
                  onClick={() => { setSortBy('date'); setSortOrder('asc'); setShowSortOptions(false); }}
                >
                  <span>ישן לחדש</span>
                  {sortBy === 'date' && sortOrder === 'asc' && <FaCheck className={styles.checkIcon} />}
                </button>
                <button 
                  className={`${styles.sortOption} ${sortBy === 'rating' && sortOrder === 'desc' ? styles.activeSort : ''}`}
                  onClick={() => { setSortBy('rating'); setSortOrder('desc'); setShowSortOptions(false); }}
                >
                  <span>דירוג גבוה לנמוך</span>
                  {sortBy === 'rating' && sortOrder === 'desc' && <FaCheck className={styles.checkIcon} />}
                </button>
                <button 
                  className={`${styles.sortOption} ${sortBy === 'rating' && sortOrder === 'asc' ? styles.activeSort : ''}`}
                  onClick={() => { setSortBy('rating'); setSortOrder('asc'); setShowSortOptions(false); }}
                >
                  <span>דירוג נמוך לגבוה</span>
                  {sortBy === 'rating' && sortOrder === 'asc' && <FaCheck className={styles.checkIcon} />}
                </button>
              </div>
            )}
          </div>

          <button
            className={`${styles.filterButton} ${showFilters ? styles.activeFilter : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            title="סינון"
          >
            <FaFilter />
            {hasActiveFilters() && <span className={styles.filterBadge} />}
          </button>

          {selectedItems.length > 0 && (
            <button
              className={styles.deleteButton}
              onClick={() => setShowDeleteConfirmation(true)}
              disabled={isDeleting}
              title="מחק שיחות נבחרות"
            >
              {isDeleting ? <FaSpinner className={styles.spinnerIcon} /> : <FaTrash />}
              <span>{selectedItems.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* אזור פילטרים */}
      {showFilters && (
        <div className={styles.filtersContainer}>
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label>תאריך:</label>
              <select 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">כל התאריכים</option>
                {Object.keys(groupedConversations).map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>סוג:</label>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">הכל</option>
                <option value="workout">תוכניות אימון</option>
                <option value="nutrition">תזונה</option>
                <option value="motivation">מוטיבציה</option>
                <option value="health">בריאות</option>
                <option value="fitness">כושר</option>
                <option value="general">כללי</option>
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label>מקור:</label>
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">הכל</option>
                <option value="ai">תשובות AI</option>
                <option value="standard">תשובות מוכנות</option>
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label>דירוג:</label>
              <select 
                value={selectedRating} 
                onChange={(e) => setSelectedRating(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">הכל</option>
                <option value="5">5 כוכבים</option>
                <option value="4+">4+ כוכבים</option>
                <option value="3-">3 כוכבים ומטה</option>
                <option value="unrated">לא דורג</option>
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedBookmark}
                  onChange={() => setSelectedBookmark(!selectedBookmark)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>מועדפים בלבד</span>
              </label>
            </div>
          </div>

          <div className={styles.filtersActions}>
            <button 
              className={styles.clearFiltersButton} 
              onClick={clearFilters}
              disabled={!hasActiveFilters()}
            >
              נקה סינונים
            </button>
            
            <div className={styles.selectAllContainer}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={selectedItems.length === filteredConversations.length && filteredConversations.length > 0}
                  onChange={toggleSelectAll}
                  className={styles.checkbox}
                  disabled={filteredConversations.length === 0}
                />
                <span className={styles.checkboxText}>בחר הכל</span>
              </label>
              
              <div className={styles.groupToggleButtons}>
                <button 
                  className={styles.expandAllButton}
                  onClick={() => toggleAllGroups(true)}
                  title="פתח הכל"
                >
                  פתח הכל
                </button>
                <button 
                  className={styles.collapseAllButton}
                  onClick={() => toggleAllGroups(false)}
                  title="סגור הכל"
                >
                  סגור הכל
                </button>
              </div>
            </div>
          </div>

          {hasActiveFilters() && (
            <div className={styles.activeFiltersBar}>
              <div className={styles.activeFiltersLabel}>סינון פעיל:</div>
              <div className={styles.activeFiltersList}>
                {searchTerm && (
                  <div className={styles.activeFilterTag}>
                    <span>חיפוש: {searchTerm}</span>
                    <button 
                      onClick={() => setSearchTerm('')}
                      className={styles.removeFilterButton}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
                
                {selectedDate && (
                  <div className={styles.activeFilterTag}>
                    <span>תאריך: {selectedDate}</span>
                    <button 
                      onClick={() => setSelectedDate('')}
                      className={styles.removeFilterButton}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
                
                {selectedType && (
                  <div className={styles.activeFilterTag}>
                    <span>סוג: {getResponseTypeName(selectedType)}</span>
                    <button 
                      onClick={() => setSelectedType('')}
                      className={styles.removeFilterButton}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
                
                {selectedModel && (
                  <div className={styles.activeFilterTag}>
                    <span>מקור: {selectedModel === 'ai' ? 'תשובות AI' : 'תשובות מוכנות'}</span>
                    <button 
                      onClick={() => setSelectedModel('')}
                      className={styles.removeFilterButton}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
                
                {selectedRating && (
                  <div className={styles.activeFilterTag}>
                    <span>דירוג: {
                      selectedRating === '5' ? '5 כוכבים' :
                      selectedRating === '4+' ? '4+ כוכבים' :
                      selectedRating === '3-' ? '3 כוכבים ומטה' :
                      'לא דורג'
                    }</span>
                    <button 
                      onClick={() => setSelectedRating('')}
                      className={styles.removeFilterButton}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
                
                {selectedBookmark && (
                  <div className={styles.activeFilterTag}>
                    <span>מועדפים בלבד</span>
                    <button 
                      onClick={() => setSelectedBookmark(false)}
                      className={styles.removeFilterButton}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* רשימת השיחות */}
      {Object.keys(getFilteredGroups()).length === 0 ? (
        <div className={styles.emptyState}>
          <FaHistory className={styles.emptyIcon} />
          <h3>לא נמצאו שיחות</h3>
          {hasActiveFilters() ? (
            <p>לא נמצאו שיחות התואמות את הסינון שבחרת. נסה להשתמש בתנאי סינון אחרים.</p>
          ) : (
            <p>לא נמצאו שיחות קודמות עם המאמן האישי.</p>
          )}
          <button 
            className={`${styles.emptyActionButton} ${styles.primaryButton}`}
            onClick={() => navigate('/trainer')}
          >
            התחל שיחה חדשה
          </button>
        </div>
      ) : (
        <div className={styles.conversationsContainer}>
          {Object.entries(getFilteredGroups()).map(([date, convs]) => (
            <div key={date} className={styles.dateGroup}>
              <div 
                className={styles.dateHeader} 
                onClick={() => toggleGroup(date)}
              >
                <div className={styles.dateInfo}>
                  <FaCalendarAlt className={styles.calendarIcon} />
                  <span>{date}</span>
                  <span className={styles.dateCount}>{convs.length} שיחות</span>
                </div>
                <span className={expandedGroups[date] ? styles.arrowDown : styles.arrowLeft}>
                  ▼
                </span>
              </div>

              {expandedGroups[date] && (
                <ul className={styles.chatList}>
                  {convs.map((conv) => (
                    <li 
                      key={conv.id} 
                      className={`${styles.chatItem} ${selectedItems.includes(conv.id) ? styles.selectedItem : ''}`}
                      onClick={(e) => toggleItemSelection(conv.id, e)}
                    >
                      <div className={styles.chatHeader}>
                        <div className={styles.chatMeta}>
                          <div className={styles.time}>
                            {new Date(conv.created_at).toLocaleTimeString('he-IL', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>

                          <div className={styles.chatType}>
                            {getResponseTypeIcon(conv.response_type)}
                            {getResponseTypeBadge(conv.response_type)}
                          </div>
                        </div>

                        <div className={styles.chatControls}>
                          <button
                            className={`${styles.bookmarkButton} ${conv.is_bookmarked ? styles.bookmarked : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(conv.id);
                            }}
                            disabled={bookmarkUpdating === conv.id}
                            title={conv.is_bookmarked ? "הסר מהמועדפים" : "הוסף למועדפים"}
                          >
                            {conv.is_bookmarked ? <FaBookmark /> : <FaRegBookmark />}
                          </button>

                          <div className={styles.actionsMenuContainer} ref={conversationActionsRef}>
                            <button
                              className={styles.actionsButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedConversationActions(selectedConversationActions === conv.id ? null : conv.id);
                              }}
                              title="פעולות נוספות"
                            >
                              <FaEllipsisV />
                            </button>
                            
                            {selectedConversationActions === conv.id && (
                              <div className={styles.actionsMenu}>
                                <button 
                                  className={styles.actionMenuItem}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConversationAction('view', conv);
                                  }}
                                >
                                  <FaSearch className={styles.actionIcon} />
                                  <span>הצג שיחה מלאה</span>
                                </button>
                                
                                <button 
                                  className={styles.actionMenuItem}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConversationAction('reAsk', conv);
                                  }}
                                >
                                  <FaRobot className={styles.actionIcon} />
                                  <span>שאל שוב עם AI</span>
                                </button>
                                
                                <button 
                                  className={styles.actionMenuItem}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConversationAction('bookmark', conv);
                                  }}
                                >
                                  {conv.is_bookmarked ? (
                                    <>
                                      <FaRegBookmark className={styles.actionIcon} />
                                      <span>הסר מהמועדפים</span>
                                    </>
                                  ) : (
                                    <>
                                      <FaBookmark className={styles.actionIcon} />
                                      <span>הוסף למועדפים</span>
                                    </>
                                  )}
                                </button>
                                
                                <div className={styles.menuDivider}></div>
                                
                                <button 
                                  className={styles.actionMenuItem}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConversationAction('download', conv);
                                  }}
                                >
                                  <FaDownload className={styles.actionIcon} />
                                  <span>הורד כטקסט</span>
                                </button>
                                
                                <button 
                                  className={styles.actionMenuItem}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConversationAction('print', conv);
                                  }}
                                >
                                  <FaPrint className={styles.actionIcon} />
                                  <span>הדפס</span>
                                </button>
                                
                                <button 
                                  className={styles.actionMenuItem}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConversationAction('share', conv);
                                  }}
                                >
                                  <FaShare className={styles.actionIcon} />
                                  <span>שתף</span>
                                </button>
                                
                                <div className={styles.menuDivider}></div>
                                
                                <button 
                                  className={`${styles.actionMenuItem} ${styles.deleteAction}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConversationAction('delete', conv);
                                  }}
                                >
                                  <FaTrash className={styles.actionIcon} />
                                  <span>מחק</span>
                                </button>
                              </div>
                            )}
                          </div>

                          <label className={styles.checkboxContainer} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(conv.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleItemSelection(conv.id, { target: e.target });
                              }}
                            />
                            <span className={styles.checkmark}></span>
                          </label>
                        </div>
                      </div>

                      <div className={styles.userMsg}>
                        <div className={styles.msgHeader}>
                          <FaUser className={styles.userIcon} />
                          <strong>אתה</strong>
                        </div>
                        <p>{truncateText(conv.user_message)}</p>
                      </div>

                      <div className={styles.aiMsg}>
                        <div className={styles.msgHeader}>
                          <FaRobot className={styles.botIcon} />
                          <strong>מאמן</strong>
                          {conv.ai_model === 'gpt-3.5-turbo' && (
                            <span className={styles.aiModelBadge}>AI</span>
                          )}
                        </div>
                        <p>{truncateText(conv.ai_response)}</p>
                      </div>

                      <div className={styles.itemFooter}>
                        <div className={styles.itemRating}>
                          {renderRatingStars(conv.user_rating)}
                        </div>
                        
                        <button 
                          className={styles.viewFullButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/conversation/${conv.id}`);
                          }}
                        >
                          הצג שיחה מלאה
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* חלון אישור מחיקה */}
      {showDeleteConfirmation && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <FaExclamation className={styles.warningIcon} />
            <h3>אישור מחיקה</h3>
            <p>
              האם אתה בטוח שברצונך למחוק {selectedItems.length === 1 ? 'שיחה זו' : `${selectedItems.length} שיחות`}?
              <br />
              <strong>פעולה זו אינה ניתנת לביטול.</strong>
            </p>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowDeleteConfirmation(false)}
              >
                ביטול
              </button>
              <button 
                className={styles.deleteConfirmButton}
                onClick={deleteSelectedItems}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <FaSpinner className={styles.spinnerIcon} />
                    מוחק...
                  </>
                ) : 'מחק'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConversationHistory;