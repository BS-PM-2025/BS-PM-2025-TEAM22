import { render, screen } from '@testing-library/react';
import App from './App';

test('האפליקציה מרנדרת ללא שגיאות', () => {
  render(<App />);
  
  const titles = screen.getAllByText(/מתקני כושר עירוניים/i);
  expect(titles.length).toBeGreaterThan(0);
});
