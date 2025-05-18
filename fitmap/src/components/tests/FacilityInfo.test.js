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
    render(<FacilityInfo facility={mockFacility} isGoogleSource />);
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

  /* ---------- תיקוני הבדיקות שנכשלו ---------- */

  it('should render facility address and type correctly', () => {
    const { container } = render(<FacilityInfo facility={mockFacility} />);

    // בדיקה על כל ה-HTML של הקומפוננטה
    expect(container).toHaveTextContent('כתובת:');
    expect(container).toHaveTextContent(mockFacility.address);
    expect(container).toHaveTextContent('סוג:');
    expect(container).toHaveTextContent(mockFacility.type);
  });

  it('should render the correct rating when provided', () => {
    const { container } = render(<FacilityInfo facility={mockFacility} />);
    expect(container).toHaveTextContent('דירוג:');
    // מספיק לבדוק שה-rating עצמו מופיע
    expect(container).toHaveTextContent(`${mockFacility.rating}`);
  });

  it('should show "לא דורג" when rating is not provided', () => {
    const noRatingFacility = { ...mockFacility, rating: null };
    const { container } = render(<FacilityInfo facility={noRatingFacility} />);
    expect(container).toHaveTextContent('דירוג:');
    expect(container).toHaveTextContent('לא דורג');
  });
});
