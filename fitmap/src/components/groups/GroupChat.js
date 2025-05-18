// src/components/groups/GroupChat.js
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { FaPaperPlane, FaSmile, FaTimes, FaCrown } from 'react-icons/fa';
import styles from './styles/GroupChat.module.css';

function GroupChat({ workoutId, userId, userName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const simpleEmojis = ['👍', '👏', '❤️', '🔥', '💪', '🏃‍♂️', '🏋️‍♀️', '🧘‍♂️', '⚡', '✅'];

  useEffect(() => {
    if (!workoutId || !userId) return;
    fetchChatMessages();
    fetchParticipants();
    const subscription = supabase.channel('workout_chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workout_messages',
          filter: `workout_id=eq.${workoutId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [workoutId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workout_messages')
        .select('*')
        .eq('workout_id', workoutId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data);
    } catch (err) {
      console.error('שגיאה בטעינת הודעות:', err);
      setError('שגיאה בטעינת הודעות');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const { data: rawParticipants, error: participantsError } = await supabase
        .from('group_participants')
        .select('user_id, status')
        .eq('workout_id', workoutId);
  
      if (participantsError || !rawParticipants) throw participantsError;
  
      const enrichedParticipants = await Promise.all(
        rawParticipants.map(async (p) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', p.user_id)
            .single();
  
          return {
            user_id: p.user_id,
            name: profileData?.name || 'משתמש',
            status: p.status,
          };
        })
      );
  
      setParticipants(enrichedParticipants);
    } catch (err) {
      console.error('שגיאה בטעינת משתתפים:', err);
      setParticipants([]); // טיפול במקרה של כשל
    }
  };
  

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message = {
      workout_id: workoutId,
      user_id: userId,
      user_name: userName,
      content: newMessage,
      created_at: new Date().toISOString(),
      is_system_message: false,
    };

    const { error } = await supabase.from('workout_messages').insert(message);
    if (error) {
      console.error('שגיאה בשליחה:', error);
      setError('שגיאה בשליחת הודעה');
    } else {
      setNewMessage('');
      messageInputRef.current?.focus();
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isCreator = (uid) => {
    return participants.some((p) => p.user_id === uid && p.status === 'creator');
  };

  return (
  <div className={styles.chatContainer}>
    {/* כותרת הצ'אט */}
    <div className={styles.chatHeader}>
      <h3 className={styles.chatTitle}>צ'אט קבוצתי</h3>
      <div className={styles.participantsCount}>
        {participants.length} משתתפים
      </div>
    </div>

    {/* אזור ההודעות */}
    <div className={styles.messagesContainer}>
      {loading ? (
        <div className={styles.loading}>טוען הודעות...</div>
      ) : messages.length === 0 ? (
        <div className={styles.emptyChat}>אין עדיין הודעות</div>
      ) : (
        <div className={styles.messagesList}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.messageItem} ${
                msg.user_id === userId ? styles.myMessage : styles.otherMessage
              } ${msg.is_system_message ? styles.systemMessage : ''}`}
            >
              {msg.is_system_message ? (
                <div className={styles.systemMessageContent}>{msg.content}</div>
              ) : (
                <>
                  <div className={styles.messageHeader}>
                    <span className={styles.userName}>
                      {isCreator(msg.user_id) && <FaCrown className={styles.creatorIcon} />}
                      {msg.user_name}
                    </span>
                    <span className={styles.messageTime}>
                      {formatMessageTime(msg.created_at)}
                    </span>
                  </div>
                  <div className={styles.messageContent}>{msg.content}</div>
                </>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>

    {/* הודעות שגיאה */}
    {error && (
      <div className={styles.errorMessage}>
        <span>{error}</span>
        <button onClick={() => setError(null)} className={styles.closeError}>
          <FaTimes />
        </button>
      </div>
    )}

    {/* אזור הקלדה */}
    <div className={styles.inputArea}>
      <div className={styles.inputControls}>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={styles.iconButton}
        >
          <FaSmile />
        </button>

        {showEmojiPicker && (
          <div className={styles.emojiPicker}>
            {simpleEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className={styles.emojiOption}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="הקלד הודעה..."
          className={styles.textInput}
          ref={messageInputRef}
        />

        <button
          onClick={sendMessage}
          className={styles.sendButton}
          disabled={!newMessage.trim()}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  </div>
);
}

export default GroupChat;