import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActionButtons from '../map/facility-details/ActionButtons';
import { supabase } from '../../utils/supabaseClient';

// Mock supabase client
jest.mock('../../utils/supabaseClient');

// Mock window.open
const mockOpen = jest.fn();
window.open = mockOpen;

// Mock window.alert
const mockAlert = jest.fn();
window.alert = mockAlert;

describe('ActionButtons', () => {
  const mockFacility = {
    name: 'Test Gym',
    address: '123 Test St',
    type: 'gym',
    rating: 4.5,
    latitude: 32.0853,
    longitude: 34.7818,
    google_place_id: 'test-place-id'
  };

  const mockUserProfile = {
    id: 'user-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful Supabase responses
    supabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: () => Promise.resolve({ data: [], error: null })
    }));
  });

  it('should render navigation button', () => {
    render(<ActionButtons facility={mockFacility} />);
    expect(screen.getByText('נווט')).toBeInTheDocument();
  });

  it('should open Google Maps when navigation button is clicked', () => {
    render(<ActionButtons facility={mockFacility} />);
    fireEvent.click(screen.getByText('נווט'));
    expect(mockOpen).toHaveBeenCalledWith(
      'https://www.google.com/maps/dir/?api=1&destination=32.0853,34.7818',
      '_blank'
    );
  });

  it('should show save button when user is logged in', () => {
    render(<ActionButtons facility={mockFacility} userProfile={mockUserProfile} />);
    expect(screen.getByText('שמור')).toBeInTheDocument();
  });

  it('should not show save button when user is not logged in', () => {
    render(<ActionButtons facility={mockFacility} />);
    expect(screen.queryByText('שמור')).not.toBeInTheDocument();
  });

  it('should show error when adding to favorites fails', async () => {
    render(<ActionButtons facility={mockFacility} userProfile={mockUserProfile} />);
    
    // Mock failed insert
    supabase.from.mockImplementation(() => ({
      insert: jest.fn().mockReturnThis(),
      then: () => Promise.resolve({ error: new Error('Test error') })
    }));

    fireEvent.click(screen.getByText('שמור'));
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('שגיאה בהוספה למועדפים');
    });
  });
}); 