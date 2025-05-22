// src/components/workouts/__tests__/FavoriteExercises.test.js

import React from 'react';
import { render, screen } from '@testing-library/react';
import FavoriteExercises from '../workouts/FavoriteExercises';
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
        eq: () => ({
          in: () => ({
            then: (res) => res({ data: [], error: null }),
          }),
        }),
      }),
    }),
  },
}));

// Helper: render component with router
const renderWithRouter = (ui) => render(<Router>{ui}</Router>);

describe('FavoriteExercises', () => {
  test('renders header correctly', () => {
    renderWithRouter(<FavoriteExercises />);
    expect(screen.getByText('תרגילים שמורים')).toBeInTheDocument();
    expect(screen.getByText('כאן תמצא את כל התרגילים שסימנת כמועדפים')).toBeInTheDocument();
  });

  test('shows empty message when user is not logged in and no favorites', async () => {
    renderWithRouter(<FavoriteExercises />);
    expect(await screen.findByText('אין תרגילים שמורים')).toBeInTheDocument();
  });

  test('renders navigation button to exercise library', async () => {
    renderWithRouter(<FavoriteExercises />);
    const button = await screen.findByRole('button', { name: /לספריית התרגילים/i });
    expect(button).toBeInTheDocument();
  });

  test('does not crash when user is null', () => {
    expect(() => renderWithRouter(<FavoriteExercises />)).not.toThrow();
  });
});
