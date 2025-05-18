import React from 'react';
import { render, screen } from '@testing-library/react';
import EmbeddedMap from '../map/facility-details/EmbeddedMap';

describe('EmbeddedMap', () => {
  const mockFacility = {
    name: 'Test Gym',
    latitude: 32.0853,
    longitude: 34.7818
  };

  it('should render map when facility has coordinates', () => {
    render(<EmbeddedMap facility={mockFacility} />);
    
    const iframe = screen.getByTitle(`מפה של ${mockFacility.name}`);
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 
      `https://maps.google.com/maps?q=${mockFacility.latitude},${mockFacility.longitude}&z=15&output=embed`
    );
  });

  it('should show placeholder when facility is null', () => {
    render(<EmbeddedMap facility={null} />);
    expect(screen.getByText('לא ניתן להציג מפה - מיקום חסר')).toBeInTheDocument();
  });

  it('should show placeholder when facility has no coordinates', () => {
    render(<EmbeddedMap facility={{ name: 'Test Gym' }} />);
    expect(screen.getByText('לא ניתן להציג מפה - מיקום חסר')).toBeInTheDocument();
  });

  it('should show placeholder when facility has missing latitude', () => {
    render(<EmbeddedMap facility={{ name: 'Test Gym', longitude: 34.7818 }} />);
    expect(screen.getByText('לא ניתן להציג מפה - מיקום חסר')).toBeInTheDocument();
  });

  it('should show placeholder when facility has missing longitude', () => {
    render(<EmbeddedMap facility={{ name: 'Test Gym', latitude: 32.0853 }} />);
    expect(screen.getByText('לא ניתן להציג מפה - מיקום חסר')).toBeInTheDocument();
  });
}); 