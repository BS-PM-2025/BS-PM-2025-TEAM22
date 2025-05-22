// src/components/workouts/__tests__/ExerciseLibrary.test.js

import React from 'react';
import { render, screen } from '@testing-library/react';
import ExerciseLibrary from '../workouts/ExerciseLibrary';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';

// Mock useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

// Mock supabase client
jest.mock('../../utils/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          then: (res) => res({ data: [], error: null }),
        }),
      }),
    }),
  },
}));

// Helper: render component with router
const renderWithRouter = (ui) => {
  return render(<Router>{ui}</Router>);
};

describe('ExerciseLibrary', () => {
  test('renders main header', () => {
    renderWithRouter(<ExerciseLibrary />);
    const header = screen.getByText('ספריית תרגילים');
    expect(header).toBeInTheDocument();
  });

  test('search input is initially empty', () => {
    renderWithRouter(<ExerciseLibrary />);
    const searchInput = screen.getByPlaceholderText('חפש תרגילים...');
    expect(searchInput.value).toBe('');
  });

  test('filter toggle button is present', () => {
    renderWithRouter(<ExerciseLibrary />);
    const filterButton = screen.getByRole('button', { name: /סנן תרגילים/i });
    expect(filterButton).toBeInTheDocument();
  });

  test('shows loading message initially', () => {
    renderWithRouter(<ExerciseLibrary />);
    expect(screen.getByText('טוען תרגילים...')).toBeInTheDocument();
  });
});
