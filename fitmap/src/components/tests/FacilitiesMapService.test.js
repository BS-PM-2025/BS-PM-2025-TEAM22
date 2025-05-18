import FacilitiesMapService from '../../services/FacilitiesMapService';
import { supabase } from '../../utils/supabaseClient';
import GooglePlacesService from '../../utils/GooglePlacesService';

// Mock dependencies
jest.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}));

jest.mock('../../utils/GooglePlacesService', () => {
  return jest.fn().mockImplementation(() => ({
    searchFacilitiesNearby: jest.fn().mockResolvedValue([]),
    getFacilityDetails: jest.fn().mockResolvedValue({})
  }));
});

describe('FacilitiesMapService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInternalFacilities', () => {
    test('returns internal facilities with source field', async () => {
      const mockFacilities = [
        { id: 1, name: 'Facility 1' },
        { id: 2, name: 'Facility 2' }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: mockFacilities, error: null })
      });

      const result = await FacilitiesMapService.getInternalFacilities();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('source', 'internal');
      expect(result[1]).toHaveProperty('source', 'internal');
    });

    test('returns empty array on error', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') })
      });

      const result = await FacilitiesMapService.getInternalFacilities();

      expect(result).toEqual([]);
    });
  });

  describe('getFacilityById', () => {
    test('returns internal facility by id', async () => {
      const mockFacility = { id: 1, name: 'Test Facility' };
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockFacility, error: null })
      });

      const result = await FacilitiesMapService.getFacilityById(1);

      expect(result).toEqual({
        ...mockFacility,
        source: 'internal'
      });
    });
  });

  describe('getFilteredFacilities', () => {
    test('filters facilities by type', async () => {
      const mockFacilities = [
        { id: 1, type: 'gym', name: 'Gym 1' },
        { id: 2, type: 'pool', name: 'Pool 1' }
      ];

      // Mock getAllFacilities
      FacilitiesMapService.getAllFacilities = jest.fn().mockResolvedValue(mockFacilities);

      const filters = {
        types: ['gym']
      };

      const result = await FacilitiesMapService.getFilteredFacilities(filters);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('gym');
    });

    test('filters facilities by rating', async () => {
      const mockFacilities = [
        { id: 1, rating: 4.5, name: 'Facility 1' },
        { id: 2, rating: 3.0, name: 'Facility 2' }
      ];

      FacilitiesMapService.getAllFacilities = jest.fn().mockResolvedValue(mockFacilities);

      const filters = {
        minRating: 4.0
      };

      const result = await FacilitiesMapService.getFilteredFacilities(filters);

      expect(result).toHaveLength(1);
      expect(result[0].rating).toBeGreaterThanOrEqual(4.0);
    });
  });
}); 