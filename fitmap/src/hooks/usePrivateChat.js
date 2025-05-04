// src/hooks/usePrivateChat.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { privateChatService } from '../services/privateChatService';

/**
 * הוק לניהול צ'אט פרטי עם עדכונים בזמן אמת באמצעות Supabase Realtime
 * @param {string} chatId - מזהה הצ'אט
 * @param {Object} currentUser - המשתמש הנוכחי
 * @returns {Object} אובייקט עם סטייטים ופונקציות לניהול צ'אט
 */
export const usePrivateChat = (chatId, currentUser) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [sending, setSending] = useState(false);
  const [chatInfo, setChatInfo] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);

  // מעקב אחר ערוצי ההאזנה בזמן אמת
  const subscriptionRef = useRef(null);

  // בדיקה אם המשתמש רשאי לצפות בצ'אט זה
  const validateAccess = useCallback(async () => {
    if (!chatId || !currentUser?.id) return false;

    try {
      const isAllowed = await privateChatService.isUserInChat(chatId, currentUser.id);
      return isAllowed;
    } catch (error) {
      console.error('שגיאה בבדיקת הרשאות צ\'אט:', error);
      return false;
    }
  }, [chatId, currentUser]);

  // טעינת פרטי הצ'אט
  const fetchChatInfo = useCallback(async () => {
    if (!chatId || !currentUser?.id) return;

    try {
      // בדיקת הרשאות
      const hasAccess = await validateAccess();
      if (!hasAccess) {
        setError('אין לך הרשאות לצפות בצ\'אט זה');
        setLoading(false);
        return;
      }

      // טעינת פרטי הצ'אט
      const { data, error } = await supabase
        .from('private_chats')
        .select(`
          *,
          user1:user1_id (*),
          user2:user2_id (*)
        `)
        .eq('id', chatId)
        .single();

      if (error) throw error;

      setChatInfo(data);

      // קביעת המשתמש השני (לא המשתמש הנוכחי)
      const other = data.user1.id === currentUser.id ? data.user2 : data.user1;
      setOtherUser(other);

      // סימון הצ'אט כנקרא
      privateChatService.markChatAsRead(chatId, currentUser.id);
    } catch (err) {
      console.error('שגיאה בטעינת פרטי צ\'אט:', err);
      setError('לא ניתן היה לטעון את פרטי הצ\'אט');
    }
  }, [chatId, currentUser, validateAccess]);

  // טעינת הודעות (פעולה ראשונית וטעינת עוד)
  const fetchMessages = useCallback(async (newOffset = 0, append = false) => {
    if (!chatId || !currentUser?.id) return;

    try {
      setLoading(true);
      
      const { data, error } = await privateChatService.getChatMessages(
        chatId, 
        20, // מספר הודעות בכל טעינה
        newOffset
      );

      if (error) throw error;

      // הפיכת הסדר כדי שהודעות ישנות יהיו למעלה וחדשות למטה
      const sortedMessages = [...data].reverse();
      
      if (append) {
        // הוספת הודעות ישנות יותר בראש הרשימה
        setMessages(prev => [...sortedMessages, ...prev]);
      } else {
        // החלפת ההודעות הקיימות
        setMessages(sortedMessages);
      }

      // בדיקה אם יש עוד הודעות לטעון
      setHasMore(data.length === 20);
      
      // עדכון ההיסט לטעינה הבאה
      setOffset(newOffset + data.length);

      setInitialLoad(false);
    } catch (err) {
      console.error('שגיאה בטעינת הודעות:', err);
      setError('לא ניתן היה לטעון את ההודעות');
    } finally {
      setLoading(false);
    }
  }, [chatId, currentUser]);

  // טעינת עוד הודעות (למעלה - הודעות ישנות יותר)
  const loadMoreMessages = useCallback(() => {
    if (loading || !hasMore) return;
    fetchMessages(offset, true);
  }, [fetchMessages, loading, hasMore, offset]);

  // שליחת הודעה חדשה
  const sendMessage = useCallback(async (content) => {
    if (!chatId || !currentUser?.id || !content.trim()) return;

    try {
      setSending(true);
      
      const { data, error } = await privateChatService.sendMessage(
        chatId, 
        currentUser.id,
        content
      );

      if (error) throw error;

      // הוספת ההודעה החדשה לסוף הרשימה
      // (זה מיותר למעשה כי ההודעה תגיע דרך הערוץ בזמן אמת,
      // אבל זה מאפשר UI מיידי)
      setMessages(prev => [...prev, data]);

      setSending(false);
      return { success: true };
    } catch (err) {
      console.error('שגיאה בשליחת הודעה:', err);
      setSending(false);
      return { success: false, error: err.message };
    }
  }, [chatId, currentUser]);

  // הגדרת הערוץ להאזנה בזמן אמת להודעות חדשות
  const setupRealtimeSubscription = useCallback(() => {
    if (!chatId || !currentUser?.id || subscriptionRef.current) return;

    // יצירת ערוץ להאזנה להודעות חדשות
    const subscription = supabase
      .channel(`private-chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'private_messages',
        filter: `chat_id=eq.${chatId}`
      }, async (payload) => {
        // כאשר מגיעה הודעה חדשה
        
        // טעינת פרטי השולח (אם ההודעה מגיעה ממשתמש אחר)
        if (payload.new.sender_id !== currentUser.id) {
          try {
            const { data: senderData } = await supabase
              .from('profiles')
              .select('id, name, avatar_url')
              .eq('id', payload.new.sender_id)
              .single();

            if (senderData) {
              // הוספת ההודעה החדשה עם פרטי השולח
              setMessages(prev => [
                ...prev, 
                { 
                  ...payload.new, 
                  sender: senderData 
                }
              ]);
            } else {
              // אם לא הצלחנו להביא את פרטי השולח, נציג את ההודעה בלעדיהם
              setMessages(prev => [...prev, payload.new]);
            }
            
            // סימון הצ'אט כנקרא עבור הודעות נכנסות (אופציונלי)
            if (document.visibilityState === 'visible') {
              privateChatService.markChatAsRead(chatId, currentUser.id);
            }
          } catch (err) {
            console.error('שגיאה בטיפול בהודעה חדשה:', err);
          }
        }
      })
      .subscribe();

    subscriptionRef.current = subscription;

    // פונקציית ניקוי שמסירה את ההרשמה
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [chatId, currentUser]);

  // האזנה לשינויים בפרמטרים כדי לטעון את הצ'אט
  useEffect(() => {
    if (chatId && currentUser?.id) {
      // טעינת פרטי הצ'אט
      fetchChatInfo();
      
      // טעינה ראשונית של הודעות
      if (initialLoad) {
        fetchMessages(0, false);
      }
      
      // הגדרת האזנה בזמן אמת
      const cleanup = setupRealtimeSubscription();
      
      // ניקוי בעת הסרת הקומפוננטה
      return cleanup;
    }
  }, [
    chatId, 
    currentUser, 
    fetchChatInfo, 
    fetchMessages, 
    setupRealtimeSubscription, 
    initialLoad
  ]);

  // האזנה לשינויי מסך כדי לעדכן סטטוס קריאה
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && chatId && currentUser?.id) {
        privateChatService.markChatAsRead(chatId, currentUser.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [chatId, currentUser]);

  return {
    messages,
    loading,
    error,
    sending,
    otherUser,
    chatInfo,
    hasMore,
    sendMessage,
    loadMoreMessages,
    refreshMessages: () => fetchMessages(0, false)
  };
};

export default usePrivateChat;