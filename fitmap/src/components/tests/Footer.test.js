// @jest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import Footer from '../shared/Footer'; // ✅ מתוקן

test('Footer מרונדר בהצלחה', () => {
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );
  expect(screen.getByText(/מתקני כושר עירוניים/i)).toBeInTheDocument();
});
