import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Favorites from '../user/Favorites';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../utils/supabaseClient';

// Mock dependencies
jest.mock('../../hooks/useAuth');
jest.mock('../../utils/supabaseClient');

describe('Favorites Component', () => {
  const mockUserProfile = {
    id: '123',
    email: 'test@example.com'
  };

  const mockFavorites = [
    {
      id: 1,
      name: 'Test Gym',
      address: '123 Test St',
      type: 'gym',
      rating: 4.5,
      latitude: 32.0853,
      longitude: 34.7818,
      google_place_id: 'abc123'
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock useAuth hook
    useAuth.mockReturnValue({ userProfile: mockUserProfile });

    // Mock supabase query
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockFavorites, error: null })
    });
  });

  test('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <Favorites />
      </BrowserRouter>
    );
    
    expect(screen.getByText('טוען מועדפים...')).toBeInTheDocument();
  });

  test('renders empty state when no favorites', async () => {
    // Mock empty favorites
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null })
    });

    render(
      <BrowserRouter>
        <Favorites />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('אין מתקנים שמורים')).toBeInTheDocument();
      expect(screen.getByText('הוסף מתקנים דרך דף המפה')).toBeInTheDocument();
    });
  });

  test('renders favorites list when data is loaded', async () => {
    render(
      <BrowserRouter>
        <Favorites />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Gym')).toBeInTheDocument();
      expect(screen.getByText('123 Test St')).toBeInTheDocument();
      expect(screen.getByText('סוג: gym')).toBeInTheDocument();
    });
  });

  test('handles error state', async () => {
    // Mock error response
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: new Error('Test error') })
    });

    render(
      <BrowserRouter>
        <Favorites />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('שגיאה בטעינת מתקנים מועדפים')).toBeInTheDocument();
    });
  });
}); 