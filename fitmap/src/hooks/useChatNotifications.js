// src/hooks/useChatNotifications.js - גרסה מותאמת עם טעינה מוקדמת
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './useAuth';

export const useChatNotifications = () => {
  const { userProfile, user } = useAuth();
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const subscriptionRef = useRef(null);
  const isInitializedRef = useRef(false);
  const lastFetchRef = useRef(0);
  const cacheRef = useRef(new Map()); // קש למניעת שאילתות כפולות
  const preloadTimerRef = useRef(null);

  // קבע את ה-user ID פעם אחת
  const userId = useMemo(() => {
    return userProfile?.id || userProfile?.user_id || user?.id;
  }, [userProfile?.id, userProfile?.user_id, user?.id]);

  // **פונקציה לטעינה מוקדמת מהירה - רק נתונים חיוניים**
  const preloadCriticalData = useCallback(async () => {
    if (!userId) return;

    try {
      console.log('⚡ Starting critical preload for user:', userId.slice(0, 8));

      // שליפה מהירה של מונים בלבד - ללא פרטים מלאים
      const { data: unreadStats, error } = await supabase
        .from('private_messages')
        .select('chat_id, id')
        .eq('is_read', false)
        .neq('sender_id', userId);

      if (!error && unreadStats) {
        const chatIds = new Set(unreadStats.map(msg => msg.chat_id));
        setUnreadChatsCount(chatIds.size);
        setUnreadMessagesCount(unreadStats.length);
        console.log('⚡ Preload completed - Unread chats:', chatIds.size, 'Messages:', unreadStats.length);
      }

      // שמירה בקש
      cacheRef.current.set('lastPreload', Date.now());
      
    } catch (error) {
      console.error('💥 Error in preload:', error);
    }
  }, [userId]);

  // **טעינה מלאה מותאמת - רק כשצריך**
  const fetchChatsDataOptimized = useCallback(async (forceRefresh = false) => {
    if (!userId) return [];

    // בדיקת קש
    const cacheKey = `chats_${userId}`;
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();
    
    if (!forceRefresh && cached && (now - cached.timestamp < 30000)) {
      console.log('📦 Using cached data');
      return cached.data;
    }

    // מניעת קריאות כפולות
    if (!forceRefresh && now - lastFetchRef.current < 2000) {
      console.log('⏳ Preventing duplicate call');
      return recentChats;
    }
    lastFetchRef.current = now;

    try {
      console.log('🚀 Starting optimized fetch for user:', userId.slice(0, 8));

      // **שלב 1: שליפת צ'אטים עם הודעות אחרונות בשאילתה אחת**
      const { data: chatsWithMessages, error: fetchError } = await supabase
        .from('private_chats')
        .select(`
          id,
          user1_id,
          user2_id,
          created_at,
          private_messages!inner (
            id,
            content,
            created_at,
            sender_id,
            is_read
          )
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { foreignTable: 'private_messages', ascending: false })
        .limit(50);

      if (fetchError) {
        console.error('❌ Error in optimized fetch:', fetchError);
        return await fetchChatsSimple();
      }

      console.log('📦 Raw data received:', chatsWithMessages?.length || 0, 'chats');

      if (!chatsWithMessages || chatsWithMessages.length === 0) {
        return await fetchChatsSimple();
      }

      // **שלב 2: עיבוד מהיר של הנתונים**
      const processedChats = [];
      const chatMap = new Map();

      // קבץ הודעות לפי צ'אט
      for (const chatData of chatsWithMessages) {
        const chatId = chatData.id;
        
        if (!chatMap.has(chatId)) {
          const otherUserId = chatData.user1_id === userId ? chatData.user2_id : chatData.user1_id;
          
          chatMap.set(chatId, {
            id: chatId,
            user1_id: chatData.user1_id,
            user2_id: chatData.user2_id,
            otherUserId,
            createdAt: chatData.created_at,
            messages: [],
            lastMessage: null,
            unreadCount: 0
          });
        }

        // הוסף הודעות
        if (chatData.private_messages) {
          const messages = Array.isArray(chatData.private_messages) 
            ? chatData.private_messages 
            : [chatData.private_messages];
          
          chatMap.get(chatId).messages.push(...messages);
        }
      }

      console.log('🔄 Processing', chatMap.size, 'unique chats');

      // **שלב 3: שליפת פרטי משתמשים בקריאה אחת**
      const otherUserIds = Array.from(chatMap.values()).map(chat => chat.otherUserId);
      const uniqueUserIds = [...new Set(otherUserIds)];

      let usersMap = new Map();
      if (uniqueUserIds.length > 0) {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', uniqueUserIds);

        if (users) {
          users.forEach(user => usersMap.set(user.id, user));
        }
      }

      // **שלב 4: עיבוד סופי**
      for (const [chatId, chatInfo] of chatMap) {
        // מיון הודעות לפי זמן
        chatInfo.messages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // הודעה אחרונה
        chatInfo.lastMessage = chatInfo.messages[0] || null;
        
        // ספירת הודעות שלא נקראו
        chatInfo.unreadCount = chatInfo.messages.filter(
          msg => !msg.is_read && msg.sender_id !== userId
        ).length;

        // פרטי המשתמש השני
        const otherUser = usersMap.get(chatInfo.otherUserId) || {
          id: chatInfo.otherUserId,
          name: `משתמש ${chatInfo.otherUserId.slice(0, 8)}`,
          avatar_url: null
        };

        // זמן פעילות אחרון
        const lastActivityTime = chatInfo.lastMessage?.created_at || chatInfo.createdAt;

        processedChats.push({
          id: chatInfo.id,
          user1_id: chatInfo.user1_id,
          user2_id: chatInfo.user2_id,
          otherUser,
          lastMessage: chatInfo.lastMessage,
          createdAt: chatInfo.createdAt,
          lastActivityTime,
          hasUnread: chatInfo.unreadCount > 0,
          unreadCount: chatInfo.unreadCount
        });
      }

      // **שלב 5: מיון וחזרת התוצאות**
      processedChats.sort((a, b) => {
        const timeA = new Date(a.lastActivityTime);
        const timeB = new Date(b.lastActivityTime);
        return timeB - timeA;
      });

      const finalChats = processedChats.slice(0, 10);

      // שמירה בקש
      cacheRef.current.set(cacheKey, {
        data: finalChats,
        timestamp: now
      });

      console.log('✅ Optimized fetch completed:', finalChats.length, 'chats processed');
      return finalChats;

    } catch (error) {
      console.error('💥 Error in optimized fetch:', error);
      // fallback לשיטה הפשוטה
      return await fetchChatsSimple();
    }
  }, [userId, recentChats]);

  // פונקציית fallback פשוטה
  const fetchChatsSimple = useCallback(async () => {
    if (!userId) return [];

    try {
      console.log('🔄 Using simple fallback fetch');

      // שליפת צ'אטים בלבד
      const { data: chats, error: chatsError } = await supabase
        .from('private_chats')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(15);

      if (chatsError) throw chatsError;
      if (!chats) return [];

      console.log('📦 Simple fetch got', chats.length, 'chats');

      // עיבוד פשוט - רק עם הנתונים הבסיסיים
      const processedChats = [];

      for (const chat of chats.slice(0, 10)) {
        const otherUserId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;

        const chatData = {
          id: chat.id,
          user1_id: chat.user1_id,
          user2_id: chat.user2_id,
          otherUser: {
            id: otherUserId,
            name: `משתמש ${otherUserId.slice(0, 8)}`,
            avatar_url: null
          },
          lastMessage: null,
          createdAt: chat.created_at,
          lastActivityTime: chat.created_at,
          hasUnread: false,
          unreadCount: 0
        };

        processedChats.push(chatData);
      }

      console.log('✅ Simple fetch completed:', processedChats.length, 'chats');
      return processedChats;

    } catch (error) {
      console.error('💥 Error in simple fetch:', error);
      return [];
    }
  }, [userId]);

  // עדכון הנתונים - עם הבחנה בין preload לטעינה מלאה
  const updateChatData = useCallback(async (forceRefresh = false, fullLoad = true) => {
    if (!userId) {
      setUnreadChatsCount(0);
      setUnreadMessagesCount(0);
      setRecentChats([]);
      return;
    }

    setLoading(true);
    
    try {
      if (fullLoad) {
        // טעינה מלאה
        const freshChats = await fetchChatsDataOptimized(forceRefresh);
        
        // חישוב סטטיסטיקות
        const chatsWithUnread = freshChats.filter(chat => chat.hasUnread);
        const totalUnreadMessages = freshChats.reduce((sum, chat) => sum + chat.unreadCount, 0);

        // עדכון state
        setRecentChats(freshChats);
        setUnreadChatsCount(chatsWithUnread.length);
        setUnreadMessagesCount(totalUnreadMessages);
        setIsInitialized(true);
      } else {
        // רק preload של מונים
        await preloadCriticalData();
      }

    } catch (error) {
      console.error('Error updating data:', error);
      setUnreadChatsCount(0);
      setUnreadMessagesCount(0);
      if (fullLoad) {
        setRecentChats([]);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, fetchChatsDataOptimized, preloadCriticalData]);

  // **אתחול מוקדם - מיד כשיש userId**
  useEffect(() => {
    if (!userId || isInitializedRef.current) return;

    console.log('⚡ Starting early initialization for user:', userId.slice(0, 8));
    isInitializedRef.current = true;
    
    // טעינה מוקדמת מיידית של מונים
    updateChatData(false, false);
    
    // טעינה מלאה לאחר דיליי קצר
    preloadTimerRef.current = setTimeout(() => {
      console.log('🚀 Starting full preload');
      updateChatData(true, true);
    }, 1000);

  }, [userId, updateChatData]);

  // הגדרת real-time subscription
  useEffect(() => {
    if (!userId) return;

    // נקה subscription קודם
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    console.log('🔗 Setting up real-time subscription');

    const subscription = supabase
      .channel(`chat-notifications-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'private_messages',
      }, (payload) => {
        console.log('📩 Message change detected');
        // ניקוי קש
        cacheRef.current.clear();
        // רענון עם delay
        setTimeout(() => updateChatData(true, true), 1000);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'private_chats',
      }, (payload) => {
        console.log('💬 Chat change detected');
        // ניקוי קש
        cacheRef.current.clear();
        setTimeout(() => updateChatData(true, true), 1000);
      })
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [userId, updateChatData]);

  // פונקציות פעולה
  const markChatAsRead = useCallback(async (chatId) => {
    if (!userId || !chatId) return false;

    try {
      const { error } = await supabase
        .from('private_messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('chat_id', chatId)
        .eq('is_read', false)
        .neq('sender_id', userId);

      if (error) throw error;

      // ניקוי קש ורענון מהיר
      cacheRef.current.clear();
      setTimeout(() => updateChatData(true, true), 500);
      return true;
    } catch (error) {
      console.error('Error marking chat as read:', error);
      return false;
    }
  }, [userId, updateChatData]);

  const markAllChatsAsRead = useCallback(async () => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('private_messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('is_read', false)
        .neq('sender_id', userId);

      if (error) throw error;

      // עדכון מיידי של המונים
      setUnreadChatsCount(0);
      setUnreadMessagesCount(0);
      
      // ניקוי קש ורענון
      cacheRef.current.clear();
      setTimeout(() => updateChatData(true, true), 500);
      return true;
    } catch (error) {
      console.error('Error marking all chats as read:', error);
      return false;
    }
  }, [userId, updateChatData]);

  const refresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    cacheRef.current.clear(); // ניקוי קש
    updateChatData(true, true);
  }, [updateChatData]);

  // ניקוי טיימרים
  useEffect(() => {
    return () => {
      if (preloadTimerRef.current) {
        clearTimeout(preloadTimerRef.current);
      }
    };
  }, []);

  return {
    unreadChatsCount,
    unreadMessagesCount,
    recentChats,
    loading,
    isInitialized, // חדש - אומר אם הטעינה הראשונית הושלמה
    markChatAsRead,
    markAllChatsAsRead,
    refresh,
    userId
  };
};

export default useChatNotifications;