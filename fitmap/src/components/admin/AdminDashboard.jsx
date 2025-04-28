import React, { useState, useEffect } from 'react';
import { 
  FaDumbbell, 
  FaUsers, 
  FaUserCheck, 
  FaEnvelope, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaCheck, 
  FaTimes, 
  FaPlus, 
  FaCheckCircle,
  FaExclamationTriangle,
  FaFilter,
  FaSearch,
  FaDownload,
  FaPrint
} from 'react-icons/fa';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import styles from '../../styles/AdminDashboard.module.css';

function AdminDashboard() {
  const { user, userProfile, loading } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [users, setUsers] = useState([]);
  const [contactRequests, setContactRequests] = useState([]);
  const [pendingManagers, setPendingManagers] = useState([]);
  const [activeTab, setActiveTab] = useState('facilities');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!loading && (!userProfile || userProfile.role !== 'admin')) {
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // טעינת מתקנים
        const { data: facilitiesData, error: facilitiesError } = await supabase
          .from('facilities')
          .select('*');

        if (facilitiesError) {
          throw facilitiesError;
        }
        setFacilities(facilitiesData || []);

        // טעינת משתמשים
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*');

        if (usersError) {
          throw usersError;
        }
        setUsers(usersData || []);

        // טעינת פניות צור קשר
        const { data: contactData, error: contactError } = await supabase
          .from('contact_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (contactError) {
          throw contactError;
        }
        setContactRequests(contactData || []);

        // טעינת מנהלי מתקנים הממתינים לאישור
        const { data: pendingData, error: pendingError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'facility_manager')
          .eq('approval_status', 'pending')
          .order('created_at', { ascending: false });

        if (pendingError) {
          throw pendingError;
        }
        setPendingManagers(pendingData || []);
        
        // הגדרת הלשונית הראשונה להיות זו עם הפניות הממתינות אם יש כאלה
        if (pendingData && pendingData.length > 0) {
          setActiveTab('approvals');
        }
        
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('שגיאה בטעינת נתונים');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [loading, userProfile]);

  const handleUserRoleFilter = (role) => {
    setUserRoleFilter(role);
  };

  const getFilteredUsers = () => {
    if (!searchTerm && userRoleFilter === 'all') {
      return users;
    }
    
    return users.filter(user => {
      const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
      const matchesSearch = !searchTerm || 
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesRole && matchesSearch;
    });
  };

  const getFilteredFacilities = () => {
    if (!searchTerm) {
      return facilities;
    }
    
    return facilities.filter(facility => 
      facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('contact_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setContactRequests(prev => 
        prev.map(req => req.id === id ? { ...req, status: newStatus } : req)
      );
    } catch (err) {
      console.error('Error updating status:', err);
      setError('שגיאה בעדכון סטטוס');
    }
  };

  // פונקציה לאישור מנהל מתקן
  const approveManager = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // עדכון הרשימה המקומית
      setPendingManagers(prev => prev.filter(manager => manager.user_id !== userId));
      
      // עדכון רשימת המשתמשים
      setUsers(prev => prev.map(u => 
        u.user_id === userId ? {...u, approval_status: 'approved'} : u
      ));

      // יש להוסיף כאן קוד לשליחת אימייל למנהל המתקן שאושר
      // sendApprovalEmail(userId);

      // הצג הודעת הצלחה
      setSuccessMessage('מנהל המתקן אושר בהצלחה!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('שגיאה באישור מנהל:', err);
      setError('אירעה שגיאה באישור מנהל המתקן');
    }
  };

  // פונקציה לדחיית מנהל מתקן
  const rejectManager = async (userId) => {
    const isConfirmed = window.confirm('האם אתה בטוח שברצונך לדחות את הבקשה?');
    if (!isConfirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          approval_status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // עדכון הרשימה המקומית
      setPendingManagers(prev => prev.filter(manager => manager.user_id !== userId));
      
      // עדכון רשימת המשתמשים
      setUsers(prev => prev.map(u => 
        u.user_id === userId ? {...u, approval_status: 'rejected'} : u
      ));

      // הצג הודעת הצלחה
      setSuccessMessage('בקשת מנהל המתקן נדחתה בהצלחה');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('שגיאה בדחיית מנהל:', err);
      setError('אירעה שגיאה בדחיית מנהל המתקן');
    }
  };
  
  const handleExportData = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      let dataToExport;
      let filename;
      
      switch(activeTab) {
        case 'facilities':
          dataToExport = getFilteredFacilities();
          filename = 'facilities_export.csv';
          break;
        case 'users':
          dataToExport = getFilteredUsers();
          filename = 'users_export.csv';
          break;
        case 'contacts':
          dataToExport = contactRequests;
          filename = 'contact_requests_export.csv';
          break;
        default:
          dataToExport = [];
          filename = 'export.csv';
      }
      
      if (dataToExport.length === 0) {
        alert('אין נתונים לייצוא');
        setIsExporting(false);
        return;
      }
      
      // המרת הנתונים לפורמט CSV
      const headers = Object.keys(dataToExport[0]);
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => 
          headers.map(header => {
            const cell = row[header] || '';
            return typeof cell === 'string' && cell.includes(',') 
              ? `"${cell}"` 
              : cell;
          }).join(',')
        )
      ].join('\n');
      
      // יצירת קובץ להורדה
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
    }, 1000);
  };
  
  const [successMessage, setSuccessMessage] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  // פונקציה לאישור מחיקה
  const confirmDelete = (item, type) => {
    setShowConfirmDelete({ item, type });
  };

  // פונקציה למחיקה בפועל
  const handleDelete = async () => {
    if (!showConfirmDelete) {
      return;
    }
    
    const { item, type } = showConfirmDelete;
    
    try {
      let error;
      
      switch(type) {
        case 'facility':
          ({ error } = await supabase.from('facilities').delete().eq('id', item.id));
          if (!error) {
            setFacilities(prev => prev.filter(f => f.id !== item.id));
          }
          break;
        case 'user':
          ({ error } = await supabase.from('profiles').delete().eq('id', item.id));
          if (!error) {
            setUsers(prev => prev.filter(u => u.id !== item.id));
          }
          break;
        default:
          break;
      }
      
      if (error) {
        throw error;
      }
      
      setSuccessMessage(`הפריט נמחק בהצלחה`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('שגיאה במחיקה:', err);
      setError('אירעה שגיאה במחיקת הפריט');
    } finally {
      setShowConfirmDelete(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>טוען נתוני ניהול...</p>
        </div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminHeader}>
        <h1 className={styles.adminTitle}>פאנל ניהול מערכת</h1>
        
        <div className={styles.adminActions}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="חיפוש..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <FaSearch className={styles.searchIcon} />
          </div>
          
          <button 
            className={styles.actionButton}
            onClick={handleExportData}
            disabled={isExporting}
          >
            {isExporting ? (
              <div className={styles.buttonSpinner}></div>
            ) : (
              <FaDownload />
            )}
            <span>ייצוא נתונים</span>
          </button>
          
          <button className={styles.actionButton}>
            <FaPrint />
            <span>הדפסה</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className={styles.successMessage}>
          <FaCheckCircle />
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className={styles.errorMessage}>
          <FaExclamationTriangle />
          {error}
          <button 
            className={styles.closeError} 
            onClick={() => setError(null)}
          >
            <FaTimes />
          </button>
        </div>
      )}

      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'facilities' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('facilities')}
        >
          <FaDumbbell /> 
          <span>מתקנים</span>
          <span className={styles.tabCount}>{facilities.length}</span>
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'users' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FaUsers /> 
          <span>משתמשים</span>
          <span className={styles.tabCount}>{users.length}</span>
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'approvals' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          <FaUserCheck /> 
          <span>אישור מנהלים</span>
          {pendingManagers.length > 0 && 
            <span className={styles.badge}>{pendingManagers.length}</span>
          }
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'contacts' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          <FaEnvelope /> 
          <span>פניות</span>
          <span className={styles.tabCount}>{contactRequests.length}</span>
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>טוען נתונים...</p>
        </div>
      ) : (
        <div className={styles.tabContent}>
          {activeTab === 'facilities' && (
            <div className={styles.facilitiesTab}>
              <div className={styles.tabHeader}>
                <h2>ניהול מתקנים</h2>
                <button className={styles.addButton}>
                  <FaPlus /> הוסף מתקן חדש
                </button>
              </div>
              
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>שם מתקן</th>
                      <th>כתובת</th>
                      <th>סוג</th>
                      <th>דירוג</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredFacilities().length === 0 ? (
                      <tr>
                        <td colSpan="5" className={styles.noData}>
                          {searchTerm ? 'לא נמצאו תוצאות מתאימות לחיפוש' : 'אין מתקנים במערכת'}
                        </td>
                      </tr>
                    ) : (
                      getFilteredFacilities().map(facility => (
                        <tr key={facility.id}>
                          <td>{facility.name}</td>
                          <td>{facility.address}</td>
                          <td>{facility.type}</td>
                          <td>
                            <div className={styles.ratingDisplay}>
                              <span className={styles.ratingValue}>{facility.rating || '0'}</span>
                              <div className={styles.ratingStars}>
                                {[1, 2, 3, 4, 5].map(star => (
                                  <span key={star} className={star <= (facility.rating || 0) ? styles.filledStar : styles.emptyStar}>★</span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className={styles.actionButtons}>
                            <button 
                              className={styles.viewButton}
                              title="צפה בפרטים"
                            >
                              <FaEye />
                            </button>
                            <button 
                              className={styles.editButton}
                              title="ערוך מתקן"
                            >
                              <FaEdit />
                            </button>
                            <button 
                              className={styles.deleteButton}
                              title="מחק מתקן"
                              onClick={() => confirmDelete(facility, 'facility')}
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className={styles.usersTab}>
              <div className={styles.tabHeader}>
                <h2>ניהול משתמשים</h2>
                <div className={styles.userFilterDropdown}>
                  <FaFilter className={styles.filterIcon} />
                  <select 
                    value={userRoleFilter} 
                    onChange={(e) => handleUserRoleFilter(e.target.value)}
                    className={styles.filterSelect}
                  >
                    <option value="all">כל המשתמשים</option>
                    <option value="user">משתמשים רגילים</option>
                    <option value="facility_manager">מנהלי מתקנים</option>
                    <option value="admin">מנהלי מערכת</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>שם</th>
                      <th>אימייל</th>
                      <th>תפקיד</th>
                      <th>סטטוס</th>
                      <th>נרשם בתאריך</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredUsers().length === 0 ? (
                      <tr>
                        <td colSpan="6" className={styles.noData}>
                          {searchTerm ? 'לא נמצאו תוצאות מתאימות לחיפוש' : 'אין משתמשים מסוג זה במערכת'}
                        </td>
                      </tr>
                    ) : (
                      getFilteredUsers().map(user => (
                        <tr key={user.id}>
                          <td>{user.name || 'ללא שם'}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`${styles.roleTag} ${styles[`role_${user.role}`]}`}>
                              {user.role === 'user' ? 'משתמש רגיל' : 
                              user.role === 'facility_manager' ? 'מנהל מתקן' : 
                              user.role === 'admin' ? 'מנהל מערכת' : user.role}
                            </span>
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${styles[user.approval_status || 'approved']}`}>
                              {user.approval_status === 'pending' ? 'ממתין לאישור' :
                              user.approval_status === 'approved' ? 'מאושר' :
                              user.approval_status === 'rejected' ? 'נדחה' : 'מאושר'}
                            </span>
                          </td>
                          <td>{new Date(user.created_at).toLocaleDateString('he-IL')}</td>
                          <td className={styles.actionButtons}>
                            <button 
                              className={styles.viewButton}
                              title="צפה בפרטים"
                            >
                              <FaEye />
                            </button>
                            <button 
                              className={styles.editButton}
                              title="ערוך משתמש"
                            >
                              <FaEdit />
                            </button>
                            <button 
                              className={styles.deleteButton}
                              title="מחק משתמש"
                              onClick={() => confirmDelete(user, 'user')}
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'approvals' && (
            <div className={styles.approvalsTab}>
              <div className={styles.tabHeader}>
                <h2>אישור מנהלי מתקנים</h2>
                <div className={styles.approvalsMetrics}>
                  <div className={styles.metricBox}>
                    <span className={styles.metricValue}>{pendingManagers.length}</span>
                    <span className={styles.metricLabel}>בקשות ממתינות</span>
                  </div>
                </div>
              </div>
              
              {pendingManagers.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <FaCheckCircle />
                  </div>
                  <p>אין בקשות ממתינות לאישור</p>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>שם</th>
                        <th>אימייל</th>
                        <th>טלפון</th>
                        <th>תאריך בקשה</th>
                        <th>פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingManagers.map(manager => (
                        <tr key={manager.id} className={styles.pendingRow}>
                          <td>{manager.name || 'ללא שם'}</td>
                          <td>{manager.email}</td>
                          <td>{manager.phone || 'לא צוין'}</td>
                          <td>{new Date(manager.created_at).toLocaleDateString('he-IL')}</td>
                          <td className={styles.actionButtons}>
                            <button 
                              className={styles.approveButton}
                              onClick={() => approveManager(manager.user_id)}
                              title="אשר מנהל מתקן"
                            >
                              <FaCheck /> אשר
                            </button>
                            <button 
                              className={styles.rejectButton}
                              onClick={() => rejectManager(manager.user_id)}
                              title="דחה בקשה"
                            >
                              <FaTimes /> דחה
                            </button>
                            <button 
                              className={styles.viewButton}
                              title="צפה בפרטים נוספים"
                            >
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className={styles.contactsTab}>
              <div className={styles.tabHeader}>
                <h2>פניות "צור קשר"</h2>
                <div className={styles.contactsMetrics}>
                  <div className={styles.metricBox}>
                    <span className={styles.metricValue}>
                      {contactRequests.filter(req => req.status === 'pending').length}
                    </span>
                    <span className={styles.metricLabel}>ממתינות לטיפול</span>
                  </div>
                  <div className={styles.metricBox}>
                    <span className={styles.metricValue}>
                      {contactRequests.filter(req => req.status === 'in_progress').length}
                    </span>
                    <span className={styles.metricLabel}>בטיפול</span>
                  </div>
                  <div className={styles.metricBox}>
                    <span className={styles.metricValue}>
                      {contactRequests.filter(req => req.status === 'resolved').length}
                    </span>
                    <span className={styles.metricLabel}>טופלו</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>תאריך</th>
                      <th>שם</th>
                      <th>אימייל</th>
                      <th>נושא</th>
                      <th>סטטוס</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contactRequests.length === 0 ? (
                      <tr>
                        <td colSpan="6" className={styles.noData}>אין פניות במערכת</td>
                      </tr>
                    ) : (
                      contactRequests.map(request => (
                        <tr key={request.id} className={styles[`status_${request.status}`]}>
                          <td>{new Date(request.created_at).toLocaleDateString('he-IL')}</td>
                          <td>{request.name}</td>
                          <td>{request.email}</td>
                          <td>{request.subject}</td>
                          <td>
                            <select 
                              value={request.status}
                              onChange={(e) => handleStatusChange(request.id, e.target.value)}
                              className={`${styles.statusSelect} ${styles[request.status]}`}
                            >
                              <option value="pending">ממתין לטיפול</option>
                              <option value="in_progress">בטיפול</option>
                              <option value="resolved">טופל</option>
                            </select>
                          </td>
                          <td className={styles.actionButtons}>
                            <button 
                              className={styles.viewButton}
                              title="צפה בפרטים"
                            >
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Modal אישור מחיקה */}
      {showConfirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>אישור מחיקה</h3>
            <p>האם אתה בטוח שברצונך למחוק את {showConfirmDelete.type === 'facility' ? 'המתקן' : 'המשתמש'} הזה?</p>
            <p>פעולה זו אינה ניתנת לביטול.</p>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelModalButton}
                onClick={() => setShowConfirmDelete(null)}
              >
                ביטול
              </button>
              <button 
                className={styles.confirmDeleteButton}
                onClick={handleDelete}
              >
                כן, מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;