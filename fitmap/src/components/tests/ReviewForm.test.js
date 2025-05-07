import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewForm from '../map/facility-details/ReviewForm';
import { supabase } from '../../utils/supabaseClient';

// Mock supabase client
jest.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn()
    }))
  }
}));

describe('ReviewForm', () => {
  const mockUserProfile = {
    id: 'user123',
    name: 'Test User'
  };

  const mockProps = {
    facilityId: 'facility123',
    userProfile: mockUserProfile,
    onSubmitted: jest.fn(),
    onCancel: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });


  it('updates comment when typing', () => {
    render(<ReviewForm {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText('כתוב ביקורת...');
    fireEvent.change(textarea, { target: { value: 'Great facility!' } });
    
    expect(textarea.value).toBe('Great facility!');
  });

  it('shows error message when trying to submit without being logged in', async () => {
    render(<ReviewForm {...mockProps} userProfile={null} />);
    
    const submitButton = screen.getByRole('button', { name: 'שלח ביקורת' });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('התחבר כדי לכתוב ביקורת')).toBeInTheDocument();
  });

  it('successfully submits a review', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    render(<ReviewForm {...mockProps} />);
    
    // Fill in the review
    const textarea = screen.getByPlaceholderText('כתוב ביקורת...');
    fireEvent.change(textarea, { target: { value: 'Great facility!' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'שלח ביקורת' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        facility_id: mockProps.facilityId,
        user_id: mockProps.userProfile.id,
        user_name: mockProps.userProfile.name,
        rating: 5, // Default rating
        comment: 'Great facility!',
        created_at: expect.any(String)
      });
      expect(mockProps.onSubmitted).toHaveBeenCalled();
    });
  });

  it('handles submission error', async () => {
    const mockError = new Error('Submission failed');
    supabase.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: mockError })
    });

    render(<ReviewForm {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: 'שלח ביקורת' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('שגיאה בשליחת הביקורת')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<ReviewForm {...mockProps} />);
    
    const cancelButton = screen.getByRole('button', { name: 'ביטול' });
    fireEvent.click(cancelButton);
    
    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('disables buttons while submitting', async () => {
    supabase.from.mockReturnValue({
      insert: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    });

    render(<ReviewForm {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: 'שלח ביקורת' });
    fireEvent.click(submitButton);

    expect(screen.getByText('שולח...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'שולח...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'ביטול' })).toBeDisabled();
  });
}); 