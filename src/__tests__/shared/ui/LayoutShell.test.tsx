import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/features/auth-login/ui/LogoutButton', () => ({
  LogoutButton: () => <button>로그아웃</button>,
}));

const mockAuth = vi.hoisted(() => vi.fn());

vi.mock('@/auth', () => ({
  auth: mockAuth,
}));

import LayoutShell from '@/shared/ui/LayoutShell';

describe('LayoutShell', () => {
  it('renders a navigation header', async () => {
    mockAuth.mockResolvedValue(null);
    render(await LayoutShell({ children: <div>content</div> }));
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders the service name in the header', async () => {
    mockAuth.mockResolvedValue(null);
    render(await LayoutShell({ children: <div>content</div> }));
    expect(screen.getByText(/AI 더빙/i)).toBeInTheDocument();
  });

  it('renders a main content area', async () => {
    mockAuth.mockResolvedValue(null);
    render(await LayoutShell({ children: <div>content</div> }));
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders children inside the main content area', async () => {
    mockAuth.mockResolvedValue(null);
    render(await LayoutShell({ children: <p>child content</p> }));
    const main = screen.getByRole('main');
    expect(main).toHaveTextContent('child content');
  });

  it('does not render logout button when not logged in', async () => {
    mockAuth.mockResolvedValue(null);
    render(await LayoutShell({ children: <div>content</div> }));
    expect(screen.queryByRole('button', { name: /로그아웃/i })).not.toBeInTheDocument();
  });

  it('renders logout button when logged in', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
    render(await LayoutShell({ children: <div>content</div> }));
    expect(screen.getByRole('button', { name: /로그아웃/i })).toBeInTheDocument();
  });

  it('최상위 컨테이너에 bg-background 클래스가 있다', async () => {
    mockAuth.mockResolvedValue(null);
    const { container } = render(await LayoutShell({ children: <div>content</div> }));
    expect(container.firstChild).toHaveClass('bg-background');
  });
});
