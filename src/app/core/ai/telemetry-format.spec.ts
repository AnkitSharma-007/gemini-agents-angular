import { describe, expect, it } from 'vitest';
import { formatCostUsd, formatTokenCount } from './telemetry-format';

describe('formatTokenCount', () => {
  it('shows raw counts below 1000', () => {
    expect(formatTokenCount(0)).toBe('0');
    expect(formatTokenCount(42)).toBe('42');
    expect(formatTokenCount(999)).toBe('999');
  });

  it('uses one-decimal "k" for counts between 1k and 99.9k', () => {
    expect(formatTokenCount(1_000)).toBe('1.0k');
    expect(formatTokenCount(1_250)).toBe('1.3k');
    expect(formatTokenCount(12_500)).toBe('12.5k');
    expect(formatTokenCount(99_900)).toBe('99.9k');
  });

  it('rounds to whole "k" once we hit 100k+', () => {
    expect(formatTokenCount(100_000)).toBe('100k');
    expect(formatTokenCount(123_400)).toBe('123k');
    expect(formatTokenCount(999_000)).toBe('999k');
  });

  it('switches to "M" with two decimals at 1 million+', () => {
    expect(formatTokenCount(1_000_000)).toBe('1.00M');
    expect(formatTokenCount(2_500_000)).toBe('2.50M');
    expect(formatTokenCount(12_345_678)).toBe('12.35M');
  });
});

describe('formatCostUsd', () => {
  it('returns "$0" for zero and negative inputs', () => {
    expect(formatCostUsd(0)).toBe('$0');
    expect(formatCostUsd(-0.01)).toBe('$0');
  });

  it('returns "<$0.0001" for sub-tenth-of-a-cent costs', () => {
    expect(formatCostUsd(0.00001)).toBe('<$0.0001');
    expect(formatCostUsd(0.00009)).toBe('<$0.0001');
  });

  it('uses 4 decimals between $0.0001 and $0.01', () => {
    expect(formatCostUsd(0.0001)).toBe('$0.0001');
    expect(formatCostUsd(0.0034)).toBe('$0.0034');
    expect(formatCostUsd(0.0099)).toBe('$0.0099');
  });

  it('uses 3 decimals between $0.01 and $1', () => {
    expect(formatCostUsd(0.01)).toBe('$0.010');
    expect(formatCostUsd(0.125)).toBe('$0.125');
    expect(formatCostUsd(0.999)).toBe('$0.999');
  });

  it('uses 2 decimals at $1 and above', () => {
    expect(formatCostUsd(1)).toBe('$1.00');
    expect(formatCostUsd(12.345)).toBe('$12.35');
    expect(formatCostUsd(1234.5)).toBe('$1234.50');
  });
});
