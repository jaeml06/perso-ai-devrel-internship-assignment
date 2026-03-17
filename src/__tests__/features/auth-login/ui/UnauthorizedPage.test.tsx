import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnauthorizedPage } from '@/features/auth-login/ui/UnauthorizedPage';

describe('UnauthorizedPage', () => {
  it('renders fallback 차단 안내 메시지 (no errorType)', () => {
    render(<UnauthorizedPage />);
    expect(screen.getByText(/접근이 제한/i)).toBeInTheDocument();
    expect(screen.getByText(/허가된 사용자만/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /로그인 페이지로 돌아가기/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });

  it('renders not_whitelisted 메시지', () => {
    render(<UnauthorizedPage errorType="not_whitelisted" />);
    expect(screen.getByText(/접근이 제한/i)).toBeInTheDocument();
    expect(screen.getByText(/이 서비스는 허가된 사용자만/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /로그인 페이지로 돌아가기/i })).toHaveAttribute('href', '/login');
  });

  it('renders server_error 메시지', () => {
    render(<UnauthorizedPage errorType="server_error" />);
    expect(screen.getByText(/일시적인 서비스 오류/i)).toBeInTheDocument();
    expect(screen.getByText(/서비스에 일시적 문제가 발생했습니다/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /다시 시도하기/i })).toHaveAttribute('href', '/login');
  });

  it('renders no_email 메시지', () => {
    render(<UnauthorizedPage errorType="no_email" />);
    expect(screen.getByText(/이메일 정보를 확인할 수 없습니다/i)).toBeInTheDocument();
    expect(screen.getByText(/이메일 정보를 가져올 수 없습니다/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /로그인 페이지로 돌아가기/i })).toHaveAttribute('href', '/login');
  });

  it('renders fallback for unknown errorType', () => {
    render(<UnauthorizedPage errorType="unknown_value" />);
    expect(screen.getByText(/접근이 제한/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /로그인 페이지로 돌아가기/i })).toBeInTheDocument();
  });
});
