import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

describe('HomePage', () => {
  it('renders the service title', () => {
    render(<HomePage />);
    expect(screen.getByText(/AI 더빙/i)).toBeInTheDocument();
  });
});
