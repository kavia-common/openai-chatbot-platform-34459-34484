import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app header brand', () => {
  render(<App />);
  const brand = screen.getByText(/KAVIA Chat/i);
  expect(brand).toBeInTheDocument();
});
