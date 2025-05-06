import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PendingApproval from '../auth/PendingApproval';
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

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('PendingApproval', () => {
  const mockUser = {
    id: '123',
    email: 'test@example.com'
  };

  const mockUserProfile = {
    name: 'Test User',
    email: 'test@example.com',
    role: 'facility_manager',
    approval_status: 'pending',
    created_at: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocation.href = '';
  });

  test('shows loading state when auth is loading', () => {
    useAuth.mockReturnValue({ loading: true });
    
    renderWithRouter(<PendingApproval />);
    
    expect(screen.getByText('טוען פרטי משתמש...')).toBeInTheDocument();
  });

  test('shows rejected state when user is rejected', () => {
    useAuth.mockReturnValue({
      user: mockUser,
      userProfile: { ...mockUserProfile, approval_status: 'rejected' },
      loading: false
    });
    
    renderWithRouter(<PendingApproval />);
    
    expect(screen.getByText('בקשתך נדחתה')).toBeInTheDocument();
    expect(screen.getByText(/לצערנו, בקשתך לשמש כמנהל מתקן נדחתה/)).toBeInTheDocument();
  });

  test('handles logout process', async () => {
    useAuth.mockReturnValue({
      user: mockUser,
      userProfile: mockUserProfile,
      loading: false
    });
    
    supabase.auth.signOut.mockResolvedValue({ error: null });
    
    renderWithRouter(<PendingApproval />);
    
    // Click logout button
    fireEvent.click(screen.getByText('התנתק'));
    
    // Check if signOut was called
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
    
    // Check if redirected to home
    expect(mockLocation.href).toBe('/');
  });

  test('renders home button in all states', () => {
    useAuth.mockReturnValue({
      user: mockUser,
      userProfile: { ...mockUserProfile, approval_status: 'rejected' },
      loading: false
    });
    
    renderWithRouter(<PendingApproval />);
    
    expect(screen.getByText('חזרה לדף הבית')).toBeInTheDocument();
  });
}); 