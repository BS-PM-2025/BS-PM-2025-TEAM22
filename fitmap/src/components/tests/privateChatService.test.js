import { privateChatService } from '../../services/privateChatService';
import { supabase } from '../../utils/supabaseClient';

// Mock supabase client
jest.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          or: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                range: jest.fn(() => Promise.resolve({ data: [], error: null }))
              }))
            }))
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        })),
        rpc: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }
}));

describe('privateChatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensurePrivateChatExists', () => {
    const user1Id = 'user1';
    const user2Id = 'user2';

    test('returns existing chat when found', async () => {
      const mockChat = { id: 'chat1', user1_id: user1Id, user2_id: user2Id };
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: mockChat, error: null })
            })
          })
        })
      });

      const result = await privateChatService.ensurePrivateChatExists(user1Id, user2Id);

      expect(result).toEqual({ data: mockChat, error: null });
    });

    test('creates new chat when none exists', async () => {
      const mockNewChat = { id: 'newChat', user1_id: user1Id, user2_id: user2Id };
      
      // Mock no existing chat
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        })
      });

      // Mock chat creation
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockNewChat, error: null })
          })
        })
      });

      const result = await privateChatService.ensurePrivateChatExists(user1Id, user2Id);

      expect(result).toEqual({ data: mockNewChat, error: null });
    });
  });

  describe('getUserChats', () => {
    const userId = 'user1';
    const mockChats = [
      {
        id: 'chat1',
        created_at: '2024-01-01',
        user1: { id: 'user1', name: 'User 1', avatar_url: 'url1' },
        user2: { id: 'user2', name: 'User 2', avatar_url: 'url2' },
        private_messages: [
          { id: 'msg1', content: 'Hello', created_at: '2024-01-02', sender_id: 'user1' }
        ]
      }
    ];

    test('returns processed chats with unread counts', async () => {
      // Mock chat data
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: mockChats, error: null })
            })
          })
        })
      });

      // Mock unread count
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              neq: jest.fn().mockResolvedValue({ count: 2, error: null })
            })
          })
        })
      });

      const result = await privateChatService.getUserChats(userId);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('unread_count', 2);
    });
  });

  describe('getChatMessages', () => {
    const chatId = 'chat1';
    const mockMessages = [
      { id: 'msg1', content: 'Hello', created_at: '2024-01-01', sender_id: 'user1' }
    ];

    test('returns messages for chat', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({ data: mockMessages, error: null })
            })
          })
        })
      });

      const result = await privateChatService.getChatMessages(chatId);

      expect(result).toEqual({ data: mockMessages, error: null });
    });
  });

  describe('sendMessage', () => {
    const chatId = 'chat1';
    const senderId = 'user1';
    const content = 'Hello';

    test('sends message successfully', async () => {
      const mockMessage = { id: 'msg1', content, sender_id: senderId };
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockMessage, error: null })
          })
        })
      });

      const result = await privateChatService.sendMessage(chatId, senderId, content);

      expect(result).toEqual({ data: mockMessage, error: null });
    });
  });

  describe('isUserInChat', () => {
    const chatId = 'chat1';
    const userId = 'user1';

    test('returns true when user is in chat', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: chatId }, error: null })
            })
          })
        })
      });

      const result = await privateChatService.isUserInChat(chatId, userId);

      expect(result).toBe(true);
    });

    test('returns false when user is not in chat', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        })
      });

      const result = await privateChatService.isUserInChat(chatId, userId);

      expect(result).toBe(false);
    });
  });
}); 