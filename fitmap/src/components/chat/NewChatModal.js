// src/components/chat/NewChatModal.js
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { 
  FaUser, 
  FaSearch,
  FaTimes,
  FaSpinner,
  FaExclamationTriangle,
  FaUserPlus,
  
} from 'react-icons/fa';
import styles from './styles/NewChatModal.module.css';

/**
 * מודל לבחירת משתמש ליצירת שיחה חדשה
 * 
 * @param {Object} props
 * @param {Function} props.onClose - פונקציה לסגירת המודל
 * @param {Function} props.onSelectUser - פונקציה המקבלת את מזהה המשתמש שנבחר
 * @param {string} props.currentUserId - מזהה המשתמש הנוכחי
 */
function NewChatModal({ onClose, onSelectUser, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);

  // טעינת רשימת המשתמשים
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, city, fitness_level')
          .neq('id', currentUserId) // לא כולל את המשתמש הנוכחי
          .order('name');
          
        if (error) throw error;
        
        setUsers(data || []);
      } catch (err) {
        console.error('שגיאה בטעינת משתמשים:', err);
        setError('לא ניתן היה לטעון את רשימת המשתמשים');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
    
    // התמקדות בשדה החיפוש
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [currentUserId]);

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

  // פיענוח רמת כושר
  const translateFitnessLevel = (level) => {
    switch (level) {
      case 'beginner':
        return 'מתחיל';
      case 'intermediate':
        return 'בינוני';
      case 'advanced':
        return 'מתקדם';
      default:
        return level;
    }
  };

  // סינון המשתמשים לפי חיפוש
  const filteredUsers = searchTerm.trim() 
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.city && user.city.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : users;

  // טיפול בבחירת משתמש
  const handleUserSelect = (userId) => {
    onSelectUser(userId);
  };

  // סגירת המודל בלחיצה על Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalContent} ref={modalRef}>
        <div className={styles.modalHeader}>
          <h2>התחל שיחה חדשה</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="סגור"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="חפש לפי שם או עיר..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            autoFocus
          />
          {searchTerm && (
            <button 
              className={styles.clearSearchButton}
              onClick={() => setSearchTerm('')}
              aria-label="נקה חיפוש"
            >
              <FaTimes />
            </button>
          )}
        </div>
        
        <div className={styles.userListContainer}>
          {error && (
            <div className={styles.errorContainer}>
              <FaExclamationTriangle />
              <p>{error}</p>
            </div>
          )}
          
          {loading ? (
            <div className={styles.loadingContainer}>
              <FaSpinner className={styles.loadingSpinner} />
              <p>טוען משתמשים...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className={styles.noResultsContainer}>
              {searchTerm ? (
                <>
                  <p>לא נמצאו משתמשים התואמים את החיפוש "{searchTerm}"</p>
                  <button 
                    className={styles.clearSearchButton}
                    onClick={() => setSearchTerm('')}
                  >
                    נקה חיפוש
                  </button>
                </>
              ) : (
                <p>לא נמצאו משתמשים זמינים</p>
              )}
            </div>
          ) : (
            <ul className={styles.userList}>
              {filteredUsers.map(user => (
                <li 
                  key={user.id} 
                  className={styles.userItem}
                  onClick={() => handleUserSelect(user.id)}
                >
                  <div className={styles.userAvatar}>
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.name} 
                        className={styles.avatarImage} 
                      />
                    ) : (
                      <div className={styles.defaultAvatar}>
                        <FaUser />
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.userInfo}>
                    <h3 className={styles.userName}>{user.name}</h3>
                    <div className={styles.userDetails}>
                      {user.city && (
                        <span className={styles.userCity}>{user.city}</span>
                      )}
                      {user.fitness_level && (
                        <span className={styles.fitnessLevel}>
                          {translateFitnessLevel(user.fitness_level)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button className={styles.selectUserButton} aria-label={`התחל שיחה עם ${user.name}`}>
                    <FaUserPlus />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewChatModal;