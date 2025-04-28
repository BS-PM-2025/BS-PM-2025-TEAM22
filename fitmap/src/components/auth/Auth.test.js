// @jest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import Auth from './Auth';

// עושים mock ל-supabase בצורה שלא משתמשת ב-jest.fn בפנים
jest.mock('../../utils/supabaseClient', () => {
  const mockSupabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      signOut: () => Promise.resolve({}),
      signInWithPassword: () => Promise.resolve({ data: { user: { id: 'mock-user-id' } } }),
      signUp: () => Promise.resolve({ data: { user: { id: 'mock-user-id' } } }),
    },
    from: () => ({
      select: () => Promise.resolve({ data: { role: 'user', approval_status: 'approved' } }),
      insert: () => Promise.resolve({ data: {}, error: null }),
    }),
  };
  return { supabase: mockSupabase };
});

test('הקומפוננטה Auth מרונדרת ללא שגיאות', async () => {
  render(
    <MemoryRouter>
      <Auth />
    </MemoryRouter>
  );

  const form = await screen.findByRole('form', { name: /טופס התחברות/i });
  expect(form).toBeInTheDocument();
});
