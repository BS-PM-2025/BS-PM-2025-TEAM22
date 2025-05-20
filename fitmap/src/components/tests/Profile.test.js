import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../user/Profile/Profile';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../utils/supabaseClient';

// Mock dependencies
jest.mock('../../hooks/useAuth');
jest.mock('../../utils/supabaseClient');
jest.mock('../user/Favorites', () => () => <div data-testid="favorites-component" />);

describe('Profile Component', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com'
  };

  const mockUserProfile = {
    name: 'Test User',
    phone: '0501234567',
    fitness_level: 'intermediate',
    preferred_workouts: ['cardio', 'strength']
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock useAuth hook
    useAuth.mockReturnValue({ 
      user: mockUser, 
      userProfile: mockUserProfile,
      loading: false 
    });

    // Mock supabase query
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      single: jest.fn().mockResolvedValue({ data: mockUserProfile, error: null })
    });
  });

  test('renders loading state', () => {
    useAuth.mockReturnValue({ user: null, userProfile: null, loading: true });
    
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );
    
    expect(screen.getByText('טוען נתוני פרופיל...')).toBeInTheDocument();
  });

  test('handles workout preferences selection', () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    // Enter edit mode
    const editButton = screen.getByText('ערוך פרופיל');
    fireEvent.click(editButton);

    // Find and click a workout checkbox
    const cardioCheckbox = screen.getByLabelText('אירובי');
    fireEvent.click(cardioCheckbox);

    // Submit form
    const saveButton = screen.getByText('שמור שינויים');
    fireEvent.click(saveButton);

    expect(supabase.from().update).toHaveBeenCalled();
  });

  test('displays error message when update fails', async () => {
    // Mock error response
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: new Error('Update failed') })
    });

    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    // Enter edit mode and submit
    const editButton = screen.getByText('ערוך פרופיל');
    fireEvent.click(editButton);
    const saveButton = screen.getByText('שמור שינויים');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('אירעה שגיאה בעדכון הפרופיל')).toBeInTheDocument();
    });
  });
}); 