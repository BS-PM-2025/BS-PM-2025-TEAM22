import React from 'react';
import { render, screen } from '@testing-library/react';
import FitnessMap from '../map/FitnessMap';
import styles from '../../styles/FitnessMap.module.css';

// Mock the hooks
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    userProfile: null
  })
}));

jest.mock('../../hooks/useUserLocation', () => ({
  useUserLocation: () => ({
    userLocation: null,
    setUserLocation: jest.fn(),
    centerOnUser: jest.fn()
  })
}));

jest.mock('../../hooks/useCombinedFacilities', () => ({
  useCombinedFacilities: () => ({
    facilities: [],
    loading: false,
    isSearchingGoogle: false,
    searchNearbyFitnessFacilities: jest.fn(),
    hasGoogleResults: true
  })
}));

jest.mock('../../hooks/useGoogleMaps', () => ({
  useGoogleMaps: () => ({
    isLoaded: false,
    setMapRef: jest.fn(),
    map: null,
    loadError: null
  })
}));

describe('FitnessMap', () => {
  test('renders map container', () => {
    render(<FitnessMap />);
    const mapContainer = document.querySelector(`.${styles.mapContainer}`);
    expect(mapContainer).toBeInTheDocument();
  });

  test('shows loading message when map is not loaded', () => {
    render(<FitnessMap />);
    expect(screen.getByText('טוען מפה...')).toBeInTheDocument();
  });
}); 