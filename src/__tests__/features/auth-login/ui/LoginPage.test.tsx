import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/features/auth-login/ui/GoogleLoginButton', () => ({
  GoogleLoginButton: () => <button>Google로 로그인</button>,
}));

import { LoginPage } from '@/features/auth-login/ui/LoginPage';

describe('LoginPage', () => {
  it('renders Google login button', () => {
    render(<LoginPage />);
    expect(screen.getByText(/Google로 로그인/i)).toBeInTheDocument();
  });
});
