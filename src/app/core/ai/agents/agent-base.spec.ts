import { describe, expect, it } from 'vitest';
import type { GroundingChunk } from '@google/genai';
import { mapCitations, parseJsonResponse } from './agent-base';

describe('parseJsonResponse', () => {
  it('parses well-formed JSON in strict mode', () => {
    const result = parseJsonResponse<{ name: string }>(
      '{"name":"Maestro"}',
      false,
    );
    expect(result).toEqual({ name: 'Maestro' });
  });

  it('trims surrounding whitespace before parsing', () => {
    const result = parseJsonResponse<{ ok: boolean }>(
      '   \n  {"ok": true}   \n  ',
      false,
    );
    expect(result).toEqual({ ok: true });
  });

  it('throws in strict mode when the response is wrapped in prose', () => {
    expect(() =>
      parseJsonResponse<unknown>('Sure! Here you go: {"x": 1}', false),
    ).toThrowError();
  });

  it('strips ```json fences when tolerant mode is on', () => {
    const result = parseJsonResponse<{ x: number }>(
      '```json\n{"x": 42}\n```',
      true,
    );
    expect(result).toEqual({ x: 42 });
  });

  it('strips plain triple-backtick fences when tolerant', () => {
    const result = parseJsonResponse<{ x: number }>(
      '```\n{"x": 7}\n```',
      true,
    );
    expect(result).toEqual({ x: 7 });
  });

  it('carves the outermost object from leading/trailing prose when tolerant', () => {
    const raw =
      'Here is the answer based on my search:\n{"name":"Acme","capacity":1200}\nLet me know if you need more.';
    const result = parseJsonResponse<{ name: string; capacity: number }>(
      raw,
      true,
    );
    expect(result).toEqual({ name: 'Acme', capacity: 1200 });
  });

  it('rethrows when tolerant cleanup still leaves invalid JSON', () => {
    expect(() => parseJsonResponse<unknown>('not even a json-ish thing', true)).toThrowError();
  });
});

describe('mapCitations', () => {
  it('returns an empty array for an empty input', () => {
    expect(mapCitations([])).toEqual([]);
  });

  it('extracts title and uri from web grounding chunks', () => {
    const chunks: GroundingChunk[] = [
      { web: { uri: 'https://a.example', title: 'Source A' } },
      { web: { uri: 'https://b.example', title: 'Source B' } },
    ];
    expect(mapCitations(chunks)).toEqual([
      { title: 'Source A', uri: 'https://a.example' },
      { title: 'Source B', uri: 'https://b.example' },
    ]);
  });

  it('deduplicates by uri (first occurrence wins)', () => {
    const chunks: GroundingChunk[] = [
      { web: { uri: 'https://dup.example', title: 'Original' } },
      { web: { uri: 'https://dup.example', title: 'Duplicate' } },
      { web: { uri: 'https://other.example', title: 'Other' } },
    ];
    const result = mapCitations(chunks);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ title: 'Original', uri: 'https://dup.example' });
    expect(result[1]).toEqual({ title: 'Other', uri: 'https://other.example' });
  });

  it('skips chunks missing a uri or title', () => {
    const chunks: GroundingChunk[] = [
      { web: { uri: 'https://nourl.example' } },
      { web: { title: 'Title only' } },
      {},
      { web: { uri: 'https://good.example', title: 'Good' } },
    ];
    expect(mapCitations(chunks)).toEqual([
      { title: 'Good', uri: 'https://good.example' },
    ]);
  });
});
