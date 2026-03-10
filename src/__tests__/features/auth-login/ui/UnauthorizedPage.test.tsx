import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnauthorizedPage } from '@/features/auth-login/ui/UnauthorizedPage';

describe('UnauthorizedPage', () => {
  it('renders 차단 안내 메시지', () => {
    render(<UnauthorizedPage />);
    expect(screen.getByText(/접근이 제한/i)).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    render(<UnauthorizedPage />);
    const link = screen.getByRole('link', { name: /로그인/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });
});
