import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateChallengeForm from '../challenges/CreateChallengeForm';
import { BrowserRouter } from 'react-router-dom';
import * as useAuthHook from '../../hooks/useAuth';
import { supabase } from '../../utils/supabaseClient';

jest.mock('../../hooks/useAuth');
jest.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

const adminUser = { id: 'admin1', role: 'admin' };
const regularUser = { id: 'user1', role: 'user' };

describe('CreateChallengeForm component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. Renders form fields for admin', () => {
    useAuthHook.useAuth.mockReturnValue({ userProfile: adminUser });
    renderWithRouter(<CreateChallengeForm />);
    expect(screen.getByText(/יצירת אתגר חדש/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/כותרת האתגר/i)).toBeInTheDocument();
  });

  test('2. Shows access denied for non-admin users', () => {
    useAuthHook.useAuth.mockReturnValue({ userProfile: regularUser });
    renderWithRouter(<CreateChallengeForm />);
    expect(screen.getByText(/אין גישה/i)).toBeInTheDocument();
  });

  test('3. Handles required field validation', async () => {
    useAuthHook.useAuth.mockReturnValue({ userProfile: adminUser });
    renderWithRouter(<CreateChallengeForm />);
    fireEvent.click(screen.getByRole('button', { name: /שמור אתגר/i }));
    await waitFor(() => {
      expect(screen.getByText(/יש להזין כותרת לאתגר/i)).toBeInTheDocument();
    });
  });

  test('4. Updates form fields', () => {
    useAuthHook.useAuth.mockReturnValue({ userProfile: adminUser });
    renderWithRouter(<CreateChallengeForm />);
    const titleInput = screen.getByLabelText(/כותרת האתגר/i);
    fireEvent.change(titleInput, { target: { value: 'New Challenge' } });
    expect(titleInput.value).toBe('New Challenge');
  });

  test('5. Validates date range logic', async () => {
    useAuthHook.useAuth.mockReturnValue({ userProfile: adminUser });
    renderWithRouter(<CreateChallengeForm />);
    fireEvent.change(screen.getByLabelText(/כותרת האתגר/i), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByLabelText(/תיאור האתגר/i), {
      target: { value: 'desc' },
    });
    fireEvent.change(screen.getByLabelText(/תאריך התחלה/i), {
      target: { value: '2025-05-10' },
    });
    fireEvent.change(screen.getByLabelText(/תאריך סיום/i), {
      target: { value: '2025-05-01' },
    });
    fireEvent.change(screen.getByLabelText(/ערך יעד/i), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByRole('button', { name: /שמור אתגר/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/תאריך ההתחלה חייב להיות לפני תאריך הסיום/i)
      ).toBeInTheDocument();
    });
  });

  test('7. Handles image upload preview', async () => {
    useAuthHook.useAuth.mockReturnValue({ userProfile: adminUser });
    renderWithRouter(<CreateChallengeForm />);

    const file = new File(['image-content'], 'challenge.jpg', {
      type: 'image/jpeg',
    });
    const fileInput = screen.getByLabelText(/בחר תמונה/i);

    Object.defineProperty(fileInput, 'files', {
      value: [file],
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByAltText(/תצוגה מקדימה/i)).toBeInTheDocument();
    });
  });
});
