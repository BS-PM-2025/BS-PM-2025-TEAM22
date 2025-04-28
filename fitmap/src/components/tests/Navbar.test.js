// @jest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import Navbar from '../shared/Navbar';

test('Navbar מרונדר בהצלחה', () => {
  render(
    <MemoryRouter>
      <Navbar toggleTheme={() => {}} theme="light" />
    </MemoryRouter>
  );
  expect(screen.getByText(/FitMap/i)).toBeInTheDocument();
});
