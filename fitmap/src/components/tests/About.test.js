// @jest-environment jsdom
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import About from '../shared/About';

test('About מרונדר בהצלחה', () => {
  render(
    <MemoryRouter>
      <About />
    </MemoryRouter>
  );
  expect(screen.getByText(/אודות/i)).toBeInTheDocument();
});
