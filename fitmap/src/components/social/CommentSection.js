import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { 
  FaSpinner, FaExclamationTriangle, FaPaperPlane, 
  FaTrash, FaEdit, FaReply, FaInfoCircle 
} from 'react-icons/fa';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import UserProfileMini from './UserProfileMini';
import './styles/CommentSection.css'; // CSS מותאם אישית לרכיב
/**
 * קומפוננטה לתצוגה ושליחת תגובות - גרסה משודרגת
 * יכולה לשמש עבור אימונים, פוסטים או כל תוכן אחר
 */
function CommentSection({ 
  entityId,
  entityType,
  maxComments = 10,
  className = '',
  title = 'תגובות',
  onNewComment,
  disableRealtime = false
}) {
  const { userProfile } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  const commentInputRef = useRef(null);
  
  // Observer עבור Infinite Scroll
  const observer = useRef();
  const lastCommentRef = useCallback(node => {
    if (loading) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMore();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // טעינת תגובות
  const fetchComments = useCallback(async (pageNumber = 0, replace = true) => {
    if (!entityId || !entityType) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // שליפת מספר תגובות כולל (לחישוב pagination)
      const countResponse = await supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('entity_id', entityId)
        .eq('entity_type', entityType);
        
      if (countResponse.count !== null) {
        setTotalCount(countResponse.count);
        setHasMore(countResponse.count > (pageNumber + 1) * maxComments);
      }
      
      // שליפת התגובות עצמן
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select(`
          *,
          user:user_id (
            id,
            name,
            avatar_url
          ),
          parent:parent_id (
            id,
            content,
            user_id,
            user:user_id (
              name
            )
          )
        `)
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('created_at', { ascending: false })
        .range(pageNumber * maxComments, (pageNumber * maxComments) + maxComments - 1);
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (replace) {
        setComments(data || []);
      } else {
        setComments(prev => [...prev, ...(data || [])]);
      }
    } catch (err) {
      console.error('שגיאה בטעינת תגובות:', err);
      setError('אירעה שגיאה בטעינת התגובות');
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, maxComments]);
  
  // התקנת מאזין לתגובות בזמן אמת
  const setupRealtimeComments = useCallback(() => {
    if (!entityId || !entityType || disableRealtime) return null;
    
    const channel = supabase
      .channel(`comments-${entityId}`)
      .on('postgres_changes', { 
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `entity_id=eq.${entityId}` 
      }, async (payload) => {
        // כאשר מתקבלת תגובה חדשה
        try {
          // שליפת כל פרטי התגובה כולל משתמש
          const { data: newComment } = await supabase
            .from('comments')
            .select(`
              *,
              user:user_id (
                id,
                name,
                avatar_url
              ),
              parent:parent_id (
                id,
                content,
                user_id,
                user:user_id (
                  name
                )
              )
            `)
            .eq('id', payload.new.id)
            .single();
            
          if (newComment) {
            // וידוא שהתגובה אינה קיימת כבר ברשימה
            if (!comments.some(c => c.id === newComment.id)) {
              setComments(prev => [newComment, ...prev]);
              setTotalCount(prev => prev + 1);
              
              // הפעלת קולבק חיצוני אם קיים
              if (onNewComment) {
                onNewComment(newComment);
              }
            }
          }
        } catch (err) {
          console.error('שגיאה בעדכון תגובה בזמן אמת:', err);
        }
      })
      .subscribe();
      
    // פונקציית ניקוי לביטול המינוי
    return () => {
      channel.unsubscribe();
    };
  }, [entityId, entityType, comments, disableRealtime, onNewComment]);
  
  // טעינה ראשונית של תגובות והגדרת מאזין לתגובות חדשות
  useEffect(() => {
    if (entityId && entityType) {
      fetchComments(0, true);
      const cleanup = setupRealtimeComments();
      return cleanup;
    }
  }, [entityId, entityType, fetchComments, setupRealtimeComments]);
  
  // ניקוי replyTo כאשר טקסט התגובה מתרוקן
  useEffect(() => {
    if (!commentText.trim() && replyTo) {
      setReplyTo(null);
    }
  }, [commentText, replyTo]);
  
  // טעינת עוד תגובות
  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchComments(nextPage, false);
    }
  };
  
  // שליחת תגובה חדשה
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!userProfile) {
      setError('יש להתחבר כדי להגיב');
      return;
    }
    
    if (!commentText.trim()) {
      return;
    }
    
    try {
      setSendingComment(true);
      setError(null);
      
      const newComment = {
        content: commentText.trim(),
        entity_id: entityId,
        entity_type: entityType,
        user_id: userProfile.user_id,
        parent_id: replyTo ? replyTo.id : null,
        created_at: new Date().toISOString()
      };
      
      const { data, error: submitError } = await supabase
        .from('comments')
        .insert(newComment)
        .select(`
          *,
          user:user_id (
            id,
            name,
            avatar_url
          ),
          parent:parent_id (
            id,
            content,
            user_id,
            user:user_id (
              name
            )
          )
        `)
        .single();
      
      if (submitError) {
        throw submitError;
      }
      
      // אם Realtime מושבת, עדכון מקומי של רשימת התגובות
      if (disableRealtime) {
        // הוספת התגובה החדשה לרשימה
        setComments(prev => [data, ...prev]);
        setTotalCount(prev => prev + 1);
      }
      
      // הפעלת קולבק חיצוני אם קיים
      if (onNewComment) {
        onNewComment(data);
      }
      
      // ניקוי טופס התגובה
      setCommentText('');
      setReplyTo(null);
    } catch (err) {
      console.error('שגיאה בשליחת תגובה:', err);
      setError('אירעה שגיאה בשליחת התגובה');
    } finally {
      setSendingComment(false);
    }
  };
  
  // עריכת תגובה
  const handleEditComment = (commentId) => {
    if (!userProfile) return;
    
    try {
      const comment = comments.find(c => c.id === commentId);
      if (!comment || comment.user_id !== userProfile.user_id) {
        return;
      }
      
      setEditingCommentId(commentId);
      setEditText(comment.content);
      
      // התמקדות בשדה העריכה לאחר הרינדור
      setTimeout(() => {
        const editElement = document.getElementById(`edit-comment-${commentId}`);
        if (editElement) {
          editElement.focus();
        }
      }, 50);
    } catch (err) {
      console.error('שגיאה בעריכת תגובה:', err);
    }
  };
  
  // שמירת תגובה ערוכה
  const handleSaveEdit = async (commentId) => {
    if (!userProfile || !editText.trim()) return;
    
    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('comments')
        .update({ content: editText.trim(), updated_at: new Date().toISOString() })
        .eq('id', commentId)
        .eq('user_id', userProfile.user_id);
      
      if (updateError) {
        throw updateError;
      }
      
      // עדכון התגובה ברשימה המקומית
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: editText.trim(), updated_at: new Date().toISOString() } 
          : comment
      ));
      
      // ניקוי מצב העריכה
      setEditingCommentId(null);
      setEditText('');
      
    } catch (err) {
      console.error('שגיאה בשמירת תגובה ערוכה:', err);
      setError('אירעה שגיאה בשמירת התגובה');
    }
  };
  
  // מחיקת תגובה
  const handleDeleteComment = async (commentId) => {
    if (!userProfile) return;
    
    if (!window.confirm('האם אתה בטוח שברצונך למחוק תגובה זו?')) {
      return;
    }
    
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userProfile.user_id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      // הסרת התגובה מהרשימה המקומית
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      setTotalCount(prev => prev - 1);
      
    } catch (err) {
      console.error('שגיאה במחיקת תגובה:', err);
      setError('אירעה שגיאה במחיקת התגובה');
    }
  };
  
  // התחלת תגובה לתגובה קיימת
  const handleReply = (comment) => {
    setReplyTo(comment);
    setCommentText(`@${comment.user?.name || 'משתמש'} `);
    commentInputRef.current?.focus();
    
    // גלילה לטופס התגובה
    const formElement = document.getElementById('comment-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  // ביטול מצב תגובה לתגובה
  const cancelReply = () => {
    setReplyTo(null);
    setCommentText('');
  };

  // רינדור תצוגת טעינה
  if (loading && comments.length === 0) {
    return (
      <div className={`comments-loading ${className}`} aria-live="polite">
        <FaSpinner className="loading-spinner" aria-hidden="true" />
        <p>טוען תגובות...</p>
      </div>
    );
  }

  return (
    <section className={`comments-section ${className}`} aria-labelledby="comments-heading">
      <h3 id="comments-heading" className="comments-title">
        {title} {totalCount > 0 && <span className="comments-count">({totalCount})</span>}
      </h3>
      
      {/* טופס תגובה */}
      {userProfile ? (
        <form 
          id="comment-form"
          className="comment-form" 
          onSubmit={handleSubmitComment}
          aria-label="טופס תגובה"
        >
          {replyTo && (
            <div className="reply-indicator" aria-live="polite">
              <p>מגיב ל: <strong>{replyTo.user?.name || 'משתמש'}</strong></p>
              <button 
                type="button" 
                onClick={cancelReply} 
                className="cancel-reply-btn"
                aria-label="בטל תגובה"
              >
                ביטול
              </button>
            </div>
          )}
          
          <div className="comment-input-container">
            <textarea
              ref={commentInputRef}
              className="comment-input"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="כתוב תגובה..."
              rows={2}
              aria-label="תוכן התגובה"
              required
            />
            <button 
              type="submit" 
              className="submit-comment-btn"
              disabled={sendingComment || !commentText.trim()}
              aria-label="שלח תגובה"
            >
              {sendingComment ? (
                <FaSpinner className="loading-spinner" aria-hidden="true" />
              ) : (
                <FaPaperPlane aria-hidden="true" />
              )}
              <span className="sr-only">שלח תגובה</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="login-to-comment">
          <FaInfoCircle aria-hidden="true" />
          <p>יש להתחבר כדי להוסיף תגובה</p>
        </div>
      )}
      
      {/* הודעת שגיאה */}
      {error && (
        <div className="comments-error" role="alert">
          <FaExclamationTriangle className="error-icon" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}
      
      {/* רשימת תגובות */}
      <div className="comments-list" aria-label="רשימת תגובות">
        {comments.length === 0 ? (
          <p className="no-comments">אין תגובות עדיין. היה הראשון להגיב!</p>
        ) : (
          comments.map((comment, index) => {
            const isLastComment = index === comments.length - 1;
            
            return (
              <div 
                key={comment.id} 
                className={`comment-item ${comment.parent_id ? 'comment-reply' : ''}`}
                ref={isLastComment && hasMore ? lastCommentRef : null}
              >
                <UserProfileMini 
                  user={comment.user} 
                  timestamp={comment.created_at} 
                  isEdited={comment.updated_at}
                />
                
                {/* תוכן הורה (אם זו תגובה לתגובה) */}
                {comment.parent && (
                  <div className="parent-comment">
                    <p>
                      בתגובה ל-<strong>{comment.parent.user?.name || 'משתמש'}</strong>: {" "}
                      {comment.parent.content.length > 50 
                        ? comment.parent.content.substring(0, 50) + '...' 
                        : comment.parent.content
                      }
                    </p>
                  </div>
                )}
                
                {/* תוכן התגובה */}
                {editingCommentId === comment.id ? (
                  <div className="comment-edit-form">
                    <textarea
                      id={`edit-comment-${comment.id}`}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="edit-comment-input"
                      rows={3}
                      aria-label="עריכת תגובה"
                    />
                    <div className="edit-actions">
                      <button 
                        onClick={() => handleSaveEdit(comment.id)}
                        className="save-edit-btn"
                        disabled={!editText.trim()}
                        aria-label="שמור תגובה"
                      >
                        שמור
                      </button>
                      <button 
                        onClick={() => setEditingCommentId(null)}
                        className="cancel-edit-btn"
                        aria-label="בטל עריכה"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="comment-content">
                    <p>{comment.content}</p>
                  </div>
                )}
                
                {/* כפתורי פעולה */}
                <div className="comment-actions">
                  {/* כפתור תגובה לתגובה */}
                  <button 
                    onClick={() => handleReply(comment)}
                    className="comment-action-btn reply-btn"
                    aria-label="הגב לתגובה זו"
                  >
                    <FaReply aria-hidden="true" /> הגב
                  </button>
                  
                  {/* כפתורי עריכה ומחיקה (רק לבעל התגובה) */}
                  {userProfile && userProfile.user_id === comment.user_id && editingCommentId !== comment.id && (
                    <>
                      <button 
                        onClick={() => handleEditComment(comment.id)}
                        className="comment-action-btn edit-btn"
                        aria-label="ערוך תגובה"
                      >
                        <FaEdit aria-hidden="true" /> ערוך
                      </button>
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="comment-action-btn delete-btn"
                        aria-label="מחק תגובה"
                      >
                        <FaTrash aria-hidden="true" /> מחק
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* כפתור "טען עוד" אם יש צורך */}
      {hasMore && comments.length > 0 && (
        <div className="load-more-comments">
          <button 
            onClick={loadMore}
            className="load-more-btn"
            disabled={loading}
            aria-label="טען עוד תגובות"
          >
            {loading ? (
              <><FaSpinner className="loading-spinner" aria-hidden="true" /> טוען...</>
            ) : (
              'טען עוד תגובות'
            )}
          </button>
        </div>
      )}
    </section>
  );
}

// ייצוא עם ממואיזציה לשיפור ביצועים
export default memo(CommentSection);