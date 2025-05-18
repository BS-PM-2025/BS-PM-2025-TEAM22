import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RoleSelection from '../auth/RoleSelection';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../utils/supabaseClient';

// Mock the auth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock supabase client
jest.mock('../../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: jest.fn()
    }
  }
}));

// Mock setTimeout
jest.useFakeTimers();

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('RoleSelection', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com'
  };

  const mockUserProfile = {
    name: 'Test User',
    role: 'user'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders guest section when no user is logged in', () => {
    useAuth.mockReturnValue({ user: null, userProfile: null });
    
    renderWithRouter(<RoleSelection />);
    
    expect(screen.getByText('מתקני כושר עירוניים')).toBeInTheDocument();
    expect(screen.getByText('הצטרף אלינו')).toBeInTheDocument();
    expect(screen.getByText('משתמש רגיל')).toBeInTheDocument();
    expect(screen.getByText('מנהל מתקן')).toBeInTheDocument();
  });

  test('renders user dashboard when user is logged in', () => {
    useAuth.mockReturnValue({ user: mockUser, userProfile: mockUserProfile });
    
    renderWithRouter(<RoleSelection />);
    
    expect(screen.getByText(/שלום,/)).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('משתמש רגיל')).toBeInTheDocument();
    expect(screen.getByText('ניווט מהיר')).toBeInTheDocument();
  });

  test('renders facility manager specific content', () => {
    useAuth.mockReturnValue({ 
      user: mockUser, 
      userProfile: { ...mockUserProfile, role: 'facility_manager' } 
    });
    
    renderWithRouter(<RoleSelection />);
    
    expect(screen.getByText('מנהל מתקן')).toBeInTheDocument();
    expect(screen.getByText('ניהול מתקן')).toBeInTheDocument();
  });

  test('renders admin specific content', () => {
    useAuth.mockReturnValue({ 
      user: mockUser, 
      userProfile: { ...mockUserProfile, role: 'admin' } 
    });
    
    renderWithRouter(<RoleSelection />);
    
    expect(screen.getByText('מנהל מערכת')).toBeInTheDocument();
  });

  test('handles sign out process', async () => {
    useAuth.mockReturnValue({ user: mockUser, userProfile: mockUserProfile });
    supabase.auth.signOut.mockResolvedValue({ error: null });
    
    renderWithRouter(<RoleSelection />);
    
    // Click sign out button
    fireEvent.click(screen.getByText('התנתק'));
    
    // Check if signing out message appears
    expect(screen.getByText('מתנתק...')).toBeInTheDocument();
    
    // Fast-forward timer
    jest.advanceTimersByTime(800);
    
    // Check if signOut was called
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  test('renders all quick links for regular user', () => {
    useAuth.mockReturnValue({ user: mockUser, userProfile: mockUserProfile });
    
    renderWithRouter(<RoleSelection />);
    
    // Check for all quick links
    expect(screen.getByText('מפת מתקנים')).toBeInTheDocument();
    expect(screen.getByText('המועדפים שלי')).toBeInTheDocument();
    expect(screen.getByText('פרופיל משתמש')).toBeInTheDocument();
    expect(screen.getByText('ספריית תרגילים')).toBeInTheDocument();
    expect(screen.getByText('מעקב אימונים')).toBeInTheDocument();
    expect(screen.getByText('מאמן אישי')).toBeInTheDocument();
    expect(screen.getByText('אתגרים קהילתיים')).toBeInTheDocument();
    expect(screen.getByText('אימונים קבוצתיים')).toBeInTheDocument();
  });

  test('renders additional quick link for facility manager', () => {
    useAuth.mockReturnValue({ 
      user: mockUser, 
      userProfile: { ...mockUserProfile, role: 'facility_manager' } 
    });
    
    renderWithRouter(<RoleSelection />);
    
    // Check for facility manager specific link
    expect(screen.getByText('ניהול מתקן')).toBeInTheDocument();
  });

  test('displays user email when name is not available', () => {
    useAuth.mockReturnValue({ 
      user: mockUser, 
      userProfile: { role: 'user' } // No name in profile
    });
    
    renderWithRouter(<RoleSelection />);
    
    expect(screen.getByText('test')).toBeInTheDocument(); // First part of email
  });

  test('renders login link for guests', () => {
    useAuth.mockReturnValue({ user: null, userProfile: null });
    
    renderWithRouter(<RoleSelection />);
    
    expect(screen.getByText('כבר רשום?')).toBeInTheDocument();
    expect(screen.getByText('התחבר כאן')).toBeInTheDocument();
  });
}); 