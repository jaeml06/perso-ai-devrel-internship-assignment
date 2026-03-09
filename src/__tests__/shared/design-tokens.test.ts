import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const globalsPath = path.resolve(__dirname, '../../app/globals.css');

describe('Design Tokens', () => {
  let cssContent: string;

  beforeAll(() => {
    cssContent = fs.readFileSync(globalsPath, 'utf-8');
  });

  it('defines a @theme block', () => {
    expect(cssContent).toContain('@theme');
  });

  it('defines color tokens (primary, secondary, background, foreground, muted, accent, destructive)', () => {
    const requiredColors = [
      '--color-primary',
      '--color-secondary',
      '--color-background',
      '--color-foreground',
      '--color-muted',
      '--color-accent',
      '--color-destructive',
    ];
    for (const token of requiredColors) {
      expect(cssContent).toContain(token);
    }
  });

  it('defines typography tokens (font-family, font-size scale)', () => {
    expect(cssContent).toContain('--font-sans');
    expect(cssContent).toContain('--text-');
  });

  it('defines spacing scale tokens', () => {
    expect(cssContent).toContain('--spacing-');
  });
});
