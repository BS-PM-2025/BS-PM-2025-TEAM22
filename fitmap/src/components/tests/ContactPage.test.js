// @jest-environment jsdom
import { render, screen } from '@testing-library/react';
import ContactPage from '../Contact/ContactPage';

test('ContactPage נטען ומציג את הכותרת "צור איתנו קשר"', () => {
  render(<ContactPage />);
  const title = screen.getByRole('heading', { name: /צור איתנו קשר/i });
  expect(title).toBeInTheDocument();
});

test('ContactPage כולל טופס יצירת קשר', () => {
  render(<ContactPage />);
  const form = screen.getByRole('form', { name: /טופס יצירת קשר/i });
  expect(form).toBeInTheDocument();
});
