import { socialAnalyticsService } from '../../services/socialAnalyticsService';
import { supabase } from '../../utils/supabaseClient';

// Mock supabase client
jest.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }
}));

describe('socialAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserEngagementStats', () => {
    const mockUserId = '123';

    test('returns null when no userId is provided', async () => {
      const result = await socialAnalyticsService.getUserEngagementStats();
      expect(result).toBeNull();
    });

    test('makes correct database queries', async () => {
      const mockCounts = {
        posts: 5,
        comments: 10,
        post_likes: 15,
        likes_received: 20
      };

      supabase.from.mockImplementation((table) => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            count: mockCounts[table] || 0
          })
        })
      }));

      await socialAnalyticsService.getUserEngagementStats(mockUserId);

      // Check that all required tables were queried
      expect(supabase.from).toHaveBeenCalledWith('posts');
      expect(supabase.from).toHaveBeenCalledWith('comments');
      expect(supabase.from).toHaveBeenCalledWith('post_likes');
    });
  });

  describe('getTopUsersByFollowers', () => {
    const mockTopUsers = [
      { id: '1', name: 'User 1', avatar_url: 'url1', followers_count: 100 },
      { id: '2', name: 'User 2', avatar_url: 'url2', followers_count: 50 }
    ];

    test('returns top users when query succeeds', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: mockTopUsers, error: null })
          })
        })
      });

      const result = await socialAnalyticsService.getTopUsersByFollowers(2);

      expect(result).toEqual(mockTopUsers);
    });

    test('returns empty array when query fails', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: null, error: new Error('Query failed') })
          })
        })
      });

      const result = await socialAnalyticsService.getTopUsersByFollowers();

      expect(result).toEqual([]);
    });

    test('uses default limit of 10 when not specified', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      supabase.from.mockReturnValue(mockQuery);

      await socialAnalyticsService.getTopUsersByFollowers();

      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    test('uses custom limit when specified', async () => {
      const customLimit = 5;
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      supabase.from.mockReturnValue(mockQuery);

      await socialAnalyticsService.getTopUsersByFollowers(customLimit);

      expect(mockQuery.limit).toHaveBeenCalledWith(customLimit);
    });

    test('orders users by followers count in descending order', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      supabase.from.mockReturnValue(mockQuery);

      await socialAnalyticsService.getTopUsersByFollowers();

      expect(mockQuery.order).toHaveBeenCalledWith('followers_count', { ascending: false });
    });

    test('selects correct fields from profiles table', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      supabase.from.mockReturnValue(mockQuery);

      await socialAnalyticsService.getTopUsersByFollowers();

      expect(mockQuery.select).toHaveBeenCalledWith('id, name, avatar_url, followers_count');
    });
  });
}); 