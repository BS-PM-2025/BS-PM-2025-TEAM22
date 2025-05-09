// src/components/workouts/__tests__/WorkoutCalendar.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkoutCalendar from '../workouts/workouts/WorkoutCalendar';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';

// Mock useAuth hook
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    userProfile: null,
  }),
}));

// Mock supabase
jest.mock('../../../utils/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({ data: [], error: null }),
        }),
      }),
      delete: () => ({
        eq: () => ({ error: null }),
      }),
      update: () => ({
        eq: () => ({ error: null }),
      }),
    }),
  },
}));

const renderWithRouter = (ui) => render(<Router>{ui}</Router>);

describe('WorkoutCalendar - Basic Rendering', () => {
  test('renders login prompt when user is not logged in', () => {
    renderWithRouter(<WorkoutCalendar />);
    expect(screen.getByText(/יש להתחבר כדי לצפות בלוח אימונים/)).toBeInTheDocument();
  });

  test('renders calendar header if user is not logged in (but container loads)', () => {
    renderWithRouter(<WorkoutCalendar />);
    expect(screen.queryByText(/לוח אימונים/)).not.toBeNull();
  });

  test('renders loading message when loading', () => {
    renderWithRouter(<WorkoutCalendar />);
    expect(screen.getByText(/טוען נתוני אימונים/)).toBeInTheDocument();
  });

  test('renders calendar container element', () => {
    renderWithRouter(<WorkoutCalendar />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('renders export button (disabled)', () => {
    renderWithRouter(<WorkoutCalendar />);
    const exportBtn = screen.getByRole('button', { name: /ייצא נתוני אימונים/ });
    expect(exportBtn).toBeDisabled();
  });

  test('renders add workout button', () => {
    renderWithRouter(<WorkoutCalendar />);
    const addBtn = screen.getByRole('button', { name: /הוסף אימון חדש/ });
    expect(addBtn).toBeInTheDocument();
  });

  test('renders view toggle buttons (month/week/day)', () => {
    renderWithRouter(<WorkoutCalendar />);
    expect(screen.getByLabelText('תצוגת חודש')).toBeInTheDocument();
    expect(screen.getByLabelText('תצוגת שבוע')).toBeInTheDocument();
    expect(screen.getByLabelText('תצוגת יום')).toBeInTheDocument();
  });
});
