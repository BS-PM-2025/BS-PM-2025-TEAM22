import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FitnessMap from '../map/FitnessMap';
import styles from '../../styles/FitnessMap.module.css';

// Mock child components
jest.mock('../map/PlaceSearch', () => {
  return function MockPlaceSearch() {
    return <div data-testid="place-search">Place Search</div>;
  };
});

jest.mock('../map/UserLocationControl', () => {
  return function MockUserLocationControl() {
    return <div data-testid="user-location-control">User Location Control</div>;
  };
});

jest.mock('../map/FilterToggle', () => {
  return function MockFilterToggle({ showFilters, setShowFilters }) {
    return (
      <button 
        data-testid="filter-toggle" 
        onClick={() => setShowFilters(!showFilters)}
      >
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </button>
    );
  };
});

jest.mock('../map/FitnessFilters', () => {
  return function MockFitnessFilters({ onFiltersChange }) {
    return (
      <div data-testid="fitness-filters">
        <button onClick={() => onFiltersChange({ types: [], equipment: [], features: [], distance: 5 })}>
          Change Filters
        </button>
      </div>
    );
  };
});

jest.mock('../map/FacilityList', () => {
  return function MockFacilityList() {
    return <div data-testid="facility-list">Facility List</div>;
  };
});

jest.mock('../map/FacilityMarkers', () => {
  return function MockFacilityMarkers() {
    return <div data-testid="facility-markers">Facility Markers</div>;
  };
});

jest.mock('../map/facility-details/FitnessDetails', () => {
  return function MockFitnessDetails({ facility, onClose }) {
    return (
      <div data-testid="fitness-details">
        <div>{facility?.name}</div>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock('../map/Navigation/StreetView', () => {
  return function MockStreetView({ onClose }) {
    return (
      <div data-testid="street-view">
        <button onClick={onClose}>Close Street View</button>
      </div>
    );
  };
});

jest.mock('../map/Navigation/StartWalkingButton', () => {
  return function MockStartWalkingButton({ onClick, isVisible, disabled }) {
    if (!isVisible) return null;
    return (
      <button 
        data-testid="start-walking-button" 
        onClick={onClick}
        disabled={disabled}
      >
        Start Walking
      </button>
    );
  };
});

// Mock the hooks
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    userProfile: { id: 'test-user' }
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

  test('renders all control components', () => {
    render(<FitnessMap />);
    expect(screen.getByTestId('place-search')).toBeInTheDocument();
    expect(screen.getByTestId('user-location-control')).toBeInTheDocument();
    expect(screen.getByTestId('filter-toggle')).toBeInTheDocument();
  });

  test('toggles filters panel when filter toggle is clicked', () => {
    render(<FitnessMap />);
    const filterToggle = screen.getByTestId('filter-toggle');
    
    // Initially filters should not be visible
    expect(screen.queryByTestId('fitness-filters')).not.toBeInTheDocument();
    
    // Click to show filters
    fireEvent.click(filterToggle);
    expect(screen.getByTestId('fitness-filters')).toBeInTheDocument();
    
    // Click to hide filters
    fireEvent.click(filterToggle);
    expect(screen.queryByTestId('fitness-filters')).not.toBeInTheDocument();
  });

  test('renders facility list', () => {
    render(<FitnessMap />);
    expect(screen.getByTestId('facility-list')).toBeInTheDocument();
  });

  test('does not show start walking button when no user location', () => {
    render(<FitnessMap />);
    expect(screen.queryByTestId('start-walking-button')).not.toBeInTheDocument();
  });
}); 