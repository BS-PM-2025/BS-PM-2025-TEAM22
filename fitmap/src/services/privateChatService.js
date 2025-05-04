// src/services/privateChatService.js
import { supabase } from '../utils/supabaseClient';

export const privateChatService = {
  async ensurePrivateChatExists(user1Id, user2Id) {
    try {
      // סידור המזהים בסדר אלפביתי כדי למנוע שיחות כפולות
      const [firstUserId, secondUserId] = [user1Id, user2Id].sort();
  
      // שאילתה תיקונית לבדיקת קיום צ'אט
      const { data: existingChat, error: findError } = await supabase
        .from('private_chats')
        .select('*')
        .eq('user1_id', firstUserId)
        .eq('user2_id', secondUserId)
        .maybeSingle(); // שינוי ל־maybeSingle במקום single כדי לטפל טוב יותר בתרחיש של אין נתונים
  
      if (findError) {
        throw findError;
      }
  
      // אם קיים צ'אט, מחזירים אותו
      if (existingChat) {
        return { data: existingChat, error: null };
      }
  
      // יצירת צ'אט חדש
      const { data: newChat, error: createError } = await supabase
        .from('private_chats')
        .insert([
          {
            user1_id: firstUserId,
            user2_id: secondUserId
          }
        ])
        .select()
        .single();
  
      if (createError) {
        throw createError;
      }
  
      return { data: newChat, error: null };
    } catch (error) {
      console.error('שגיאה ביצירת/שליפת צ\'אט:', error);
      return { data: null, error };
    }
  },
  async getUserChats(userId) {
    try {
      const { data, error } = await supabase
        .from('private_chats')
        .select(`
          id,
          created_at,
          user1:user1_id (id, name, avatar_url),
          user2:user2_id (id, name, avatar_url),
          private_messages!private_messages_chat_id_fkey (
            id,
            content,
            created_at,
            sender_id
          )
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { foreignTable: 'private_messages', ascending: false })
        .limit(1, { foreignTable: 'private_messages' });

      if (error) throw error;

      const processedChats = await Promise.all(data.map(async (chat) => {
        const otherUser = chat.user1.id === userId ? chat.user2 : chat.user1;
        const latestMessage = chat.private_messages && chat.private_messages.length > 0
          ? chat.private_messages[0]
          : null;

        const { count: unreadCount, error: unreadError } = await supabase
          .from('private_messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .eq('is_read', false)
          .neq('sender_id', userId);

        return {
          id: chat.id,
          created_at: chat.created_at,
          other_user: otherUser,
          latest_message: latestMessage,
          unread_count: unreadCount ?? 0
        };
      }));

      processedChats.sort((a, b) => {
        const aTime = a.latest_message ? new Date(a.latest_message.created_at).getTime() : 0;
        const bTime = b.latest_message ? new Date(b.latest_message.created_at).getTime() : 0;
        return bTime - aTime;
      });

      return { data: processedChats, error: null };
    } catch (error) {
      console.error('שגיאה בשליפת צ\'אטים של משתמש:', error);
      return { data: null, error };
    }
  },

  async getChatMessages(chatId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select(`
          *,
          sender:sender_id (
            id, 
            name, 
            avatar_url
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('שגיאה בשליפת הודעות צ\'אט:', error);
      return { data: null, error };
    }
  },

  async sendMessage(chatId, senderId, content) {
    try {
      console.log('Sending message:', { chatId, senderId, content });
      
      const { data, error } = await supabase
        .from('private_messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content: content,
          is_read: false
        })
        .select()
        .single();
  
      console.log('Result:', { data, error });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error:', error);
      return { data: null, error };
    }
  },
  async isUserInChat(chatId, userId) {
    try {
      const { data, error } = await supabase
        .from('private_chats')
        .select('id')
        .eq('id', chatId)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .single();

      if (error) throw error;

      return !!data;
    } catch (error) {
      console.error('שגיאה בבדיקת השתתפות בצ\'אט:', error);
      return false;
    }
  },

  async markChatAsRead(chatId, userId) {
    try {
      const { data, error } = await supabase
        .rpc('mark_chat_messages_as_read', {
          p_chat_id: chatId,
          p_user_id: userId
        });
  
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('שגיאה בסימון צ\'אט כנקרא:', error);
      return { success: false, error };
    }
  }
};

export default privateChatService;
