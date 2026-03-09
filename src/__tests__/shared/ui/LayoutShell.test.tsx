import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LayoutShell from '@/shared/ui/LayoutShell';

describe('LayoutShell', () => {
  it('renders a navigation header', () => {
    render(<LayoutShell><div>content</div></LayoutShell>);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders the service name in the header', () => {
    render(<LayoutShell><div>content</div></LayoutShell>);
    expect(screen.getByText(/AI 더빙/i)).toBeInTheDocument();
  });

  it('renders a main content area', () => {
    render(<LayoutShell><div>content</div></LayoutShell>);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders children inside the main content area', () => {
    render(<LayoutShell><p>child content</p></LayoutShell>);
    const main = screen.getByRole('main');
    expect(main).toHaveTextContent('child content');
  });
});
