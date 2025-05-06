import { notificationService } from '../../services/notificationService';
import { supabase } from '../../utils/supabaseClient';

// Mock supabase client
jest.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn().mockReturnThis()
          }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn().mockReturnThis()
        })),
        insert: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        }))
      })),
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis()
      })),
      removeChannel: jest.fn()
    }))
  }
}));

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    const userId = 'user1';
    const mockNotifications = [
      {
        id: 'notif1',
        user_id: userId,
        content: 'Test notification',
        is_read: false,
        created_at: '2024-01-01'
      }
    ];

    test('returns notifications when user ID is provided', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({ data: mockNotifications, error: null })
            })
          })
        })
      });

      const result = await notificationService.getNotifications(userId);

      expect(result.data).toEqual(mockNotifications);
      expect(result.error).toBeNull();
    });

    test('returns empty array when no user ID is provided', async () => {
      const result = await notificationService.getNotifications();

      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
      expect(result.error.message).toBe('מזהה משתמש חסר');
    });
  });

  describe('getUnreadCount', () => {
    const userId = 'user1';

    test('returns unread count when user ID is provided', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: 5, error: null })
          })
        })
      });

      const result = await notificationService.getUnreadCount(userId);

      expect(result.count).toBe(5);
      expect(result.error).toBeNull();
    });

    test('returns zero when no user ID is provided', async () => {
      const result = await notificationService.getUnreadCount();

      expect(result.count).toBe(0);
      expect(result.error.message).toBe('מזהה משתמש חסר');
    });
  });

  describe('markAsRead', () => {
    const userId = 'user1';
    const notificationId = 'notif1';

    test('marks notification as read successfully', async () => {
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        })
      });

      const result = await notificationService.markAsRead(userId, notificationId);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    test('returns error when parameters are missing', async () => {
      const result = await notificationService.markAsRead();

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('פרמטרים חסרים');
    });
  });

  describe('markAllAsRead', () => {
    const userId = 'user1';

    test('marks all notifications as read successfully', async () => {
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        })
      });

      const result = await notificationService.markAllAsRead(userId);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    test('returns error when user ID is missing', async () => {
      const result = await notificationService.markAllAsRead();

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('מזהה משתמש חסר');
    });
  });

  describe('deleteNotification', () => {
    const userId = 'user1';
    const notificationId = 'notif1';

    test('deletes notification successfully', async () => {
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null })
          })
        })
      });

      const result = await notificationService.deleteNotification(userId, notificationId);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    test('returns error when parameters are missing', async () => {
      const result = await notificationService.deleteNotification();

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('פרמטרים חסרים');
    });
  });

  describe('deleteAllNotifications', () => {
    const userId = 'user1';

    test('deletes all notifications successfully', async () => {
      supabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      const result = await notificationService.deleteAllNotifications(userId);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    test('returns error when user ID is missing', async () => {
      const result = await notificationService.deleteAllNotifications();

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('מזהה משתמש חסר');
    });
  });

  describe('createNotification', () => {
    const mockNotification = {
      user_id: 'user1',
      content: 'Test notification',
      type: 'info'
    };

    test('creates notification successfully', async () => {
      const mockCreatedNotification = { ...mockNotification, id: 'notif1' };
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: [mockCreatedNotification], error: null })
        })
      });

      const result = await notificationService.createNotification(mockNotification);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreatedNotification);
      expect(result.error).toBeNull();
    });

    test('returns error when notification is missing user ID', async () => {
      const result = await notificationService.createNotification({ content: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('מזהה משתמש חסר בהתראה');
    });
  });
}); 