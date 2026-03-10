import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockSignIn = vi.hoisted(() => vi.fn());

vi.mock('next-auth/react', () => ({
  signIn: mockSignIn,
}));

import { GoogleLoginButton } from '@/features/auth-login/ui/GoogleLoginButton';

describe('GoogleLoginButton', () => {
  it('renders Google login button', () => {
    render(<GoogleLoginButton />);
    expect(screen.getByRole('button', { name: /Google/i })).toBeInTheDocument();
  });

  it('calls signIn("google", { callbackUrl: "/dashboard" }) when clicked', async () => {
    render(<GoogleLoginButton />);
    const button = screen.getByRole('button', { name: /Google/i });
    await userEvent.click(button);
    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/dashboard' });
  });
});
