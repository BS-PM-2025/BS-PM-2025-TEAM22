import React from 'react';
import { render, screen } from '@testing-library/react';
import FacilityInfo from '../map/facility-details/FacilityInfo';

describe('FacilityInfo', () => {
  const mockFacility = {
    address: '123 Test Street',
    type: 'gym',
    rating: 4.5
  };

  it('should show Google source info when isGoogleSource is true', () => {
    render(<FacilityInfo facility={mockFacility} isGoogleSource={true} />);
    expect(screen.getByText('מקור: Google Maps')).toBeInTheDocument();
  });

  it('should not show Google source info when isGoogleSource is false', () => {
    render(<FacilityInfo facility={mockFacility} isGoogleSource={false} />);
    expect(screen.queryByText('מקור: Google Maps')).not.toBeInTheDocument();
  });

  it('should not show Google source info when isGoogleSource is not provided', () => {
    render(<FacilityInfo facility={mockFacility} />);
    expect(screen.queryByText('מקור: Google Maps')).not.toBeInTheDocument();
  });
}); 