import {
  calculateDistance,
  mapGoogleTypeToLocalType,
  extractFeaturesFromGooglePlace,
  extractEquipmentFromGooglePlace,
  extractImagesFromGooglePlace,
  createFacilityFromGooglePlace
} from '../../utils/geoUtils';

describe('geoUtils', () => {
  describe('calculateDistance', () => {
    it('should handle invalid coordinates', () => {
      const distance = calculateDistance('invalid', 34.7818, 31.7683, 35.2137);
      expect(distance).toBe(99999);
    });
  });

  describe('mapGoogleTypeToLocalType', () => {
    it('should map gym related types to gym', () => {
      expect(mapGoogleTypeToLocalType(['gym'])).toBe('gym');
      expect(mapGoogleTypeToLocalType(['health'])).toBe('gym');
      expect(mapGoogleTypeToLocalType(['fitness_center'])).toBe('gym');
    });

    it('should map specific facility types correctly', () => {
      expect(mapGoogleTypeToLocalType(['stadium'])).toBe('stadium');
      expect(mapGoogleTypeToLocalType(['swimming_pool'])).toBe('pool');
      expect(mapGoogleTypeToLocalType(['park'])).toBe('fitness_park');
    });

    it('should return gym for empty or invalid input', () => {
      expect(mapGoogleTypeToLocalType([])).toBe('gym');
      expect(mapGoogleTypeToLocalType(null)).toBe('gym');
    });
  });

  describe('extractFeaturesFromGooglePlace', () => {
    it('should extract features from operational place', () => {
      const place = {
        business_status: 'OPERATIONAL',
        rating: 4.5,
        opening_hours: true,
        types: ['park']
      };

      const features = extractFeaturesFromGooglePlace(place);
      expect(features).toContain('accessible');
      expect(features).toContain('lit');
      expect(features).toContain('benches');
      expect(features).toContain('restrooms');
      expect(features).toContain('water_fountain');
      expect(features).toContain('shaded');
    });

    it('should handle place with minimal information', () => {
      const place = {
        business_status: 'OPERATIONAL'
      };

      const features = extractFeaturesFromGooglePlace(place);
      expect(features).toContain('accessible');
      expect(features).toContain('lit');
    });
  });

  describe('extractEquipmentFromGooglePlace', () => {
    it('should extract gym equipment', () => {
      const place = {
        types: ['gym', 'fitness_center']
      };

      const equipment = extractEquipmentFromGooglePlace(place);
      expect(equipment).toContain('cardio_machines');
      expect(equipment).toContain('weight_machines');
    });

    it('should extract park equipment', () => {
      const place = {
        types: ['park', 'recreation']
      };

      const equipment = extractEquipmentFromGooglePlace(place);
      expect(equipment).toContain('pullup_bars');
      expect(equipment).toContain('parallel_bars');
    });
  });

  describe('extractImagesFromGooglePlace', () => {
    it('should extract image URLs from place photos', () => {
      const mockPhoto = {
        getUrl: jest.fn().mockReturnValue('https://example.com/photo.jpg')
      };

      const place = {
        photos: [mockPhoto, mockPhoto, mockPhoto]
      };

      const images = extractImagesFromGooglePlace(place);
      expect(images).toHaveLength(3);
      expect(images[0]).toBe('https://example.com/photo.jpg');
    });

    it('should handle place without photos', () => {
      const place = {};
      const images = extractImagesFromGooglePlace(place);
      expect(images).toHaveLength(0);
    });
  });

  describe('createFacilityFromGooglePlace', () => {
    it('should create facility from valid Google place', () => {
      const mockPlace = {
        place_id: '123',
        name: 'Test Gym',
        vicinity: 'Test Address',
        geometry: {
          location: {
            lat: () => 32.0853,
            lng: () => 34.7818
          }
        },
        types: ['gym'],
        rating: 4.5,
        user_ratings_total: 100,
        business_status: 'OPERATIONAL',
        opening_hours: true
      };

      const facility = createFacilityFromGooglePlace(mockPlace);
      expect(facility).toEqual(expect.objectContaining({
        id: 'google_123',
        name: 'Test Gym',
        address: 'Test Address',
        latitude: 32.0853,
        longitude: 34.7818,
        type: 'gym',
        rating: 4.5,
        review_count: 100,
        source: 'google',
        google_place_id: '123'
      }));
    });

    it('should return null for invalid place', () => {
      const invalidPlace = {
        name: 'Invalid Place'
      };

      const facility = createFacilityFromGooglePlace(invalidPlace);
      expect(facility).toBeNull();
    });
  });
}); 