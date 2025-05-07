import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FitnessDetails from '../map/facility-details/FitnessDetails';

// Mock all child components
jest.mock('../map/facility-details/ImageGallery', () => {
  return function MockImageGallery({ name }) {
    return <div data-testid="mock-gallery">Gallery for {name}</div>;
  };
});

jest.mock('../map/facility-details/FacilityInfo', () => {
  return function MockFacilityInfo() {
    return <div data-testid="mock-facility-info">Facility Info</div>;
  };
});

jest.mock('../map/facility-details/EquipmentList', () => {
  return function MockEquipmentList() {
    return <div data-testid="mock-equipment-list">Equipment List</div>;
  };
});

jest.mock('../map/facility-details/FeaturesList', () => {
  return function MockFeaturesList() {
    return <div data-testid="mock-features-list">Features List</div>;
  };
});

jest.mock('../map/facility-details/ActionButtons', () => {
  return function MockActionButtons() {
    return <div data-testid="mock-action-buttons">Action Buttons</div>;
  };
});

jest.mock('../map/facility-details/ReviewForm', () => {
  return function MockReviewForm() {
    return <div data-testid="mock-review-form">Review Form</div>;
  };
});

jest.mock('../map/facility-details/ReviewsList', () => {
  return function MockReviewsList() {
    return <div data-testid="mock-reviews-list">Reviews List</div>;
  };
});

jest.mock('../map/facility-details/ShareFacility', () => {
  return function MockShareFacility() {
    return <div data-testid="mock-share-facility">Share Facility</div>;
  };
});

jest.mock('../map/facility-details/FacilityTraffic', () => {
  return function MockFacilityTraffic() {
    return <div data-testid="mock-facility-traffic">Facility Traffic</div>;
  };
});

jest.mock('../map/facility-details/EmbeddedMap', () => {
  return function MockEmbeddedMap() {
    return <div data-testid="mock-embedded-map">Embedded Map</div>;
  };
});

describe('FitnessDetails', () => {
  const mockFacility = {
    id: '1',
    name: 'Test Gym',
    description: 'A test gym description',
    images: ['image1.jpg', 'image2.jpg'],
    equipment: ['equipment1', 'equipment2'],
    features: ['feature1', 'feature2'],
    review_count: 5
  };

  const mockUserProfile = {
    id: 'user1'
  };

  const mockOnClose = jest.fn();

  it('should render facility details tab by default', () => {
    render(
      <FitnessDetails 
        facility={mockFacility}
        userProfile={mockUserProfile}
        onClose={mockOnClose}
      />
    );

    // Check header
    expect(screen.getByText('Test Gym')).toBeInTheDocument();
    
    // Check default tab content
    expect(screen.getByTestId('mock-facility-info')).toBeInTheDocument();
    expect(screen.getByTestId('mock-equipment-list')).toBeInTheDocument();
    expect(screen.getByTestId('mock-features-list')).toBeInTheDocument();
    expect(screen.getByTestId('mock-embedded-map')).toBeInTheDocument();
  });

  it('should switch to traffic tab when clicked', () => {
    render(
      <FitnessDetails 
        facility={mockFacility}
        userProfile={mockUserProfile}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('עומס'));
    expect(screen.getByTestId('mock-facility-traffic')).toBeInTheDocument();
  });

  it('should switch to reviews tab when clicked', () => {
    render(
      <FitnessDetails 
        facility={mockFacility}
        userProfile={mockUserProfile}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('ביקורות'));
    expect(screen.getByTestId('mock-reviews-list')).toBeInTheDocument();
  });

  it('should show review form when write review button is clicked', () => {
    render(
      <FitnessDetails 
        facility={mockFacility}
        userProfile={mockUserProfile}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('ביקורות'));
    fireEvent.click(screen.getByText('כתוב ביקורת'));
    expect(screen.getByTestId('mock-review-form')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <FitnessDetails 
        facility={mockFacility}
        userProfile={mockUserProfile}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('×'));
    expect(mockOnClose).toHaveBeenCalled();
  });
}); 