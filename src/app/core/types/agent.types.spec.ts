import { describe, expect, it } from 'vitest';
import { classifyApiError, MissingApiKeyError } from './agent.types';

describe('classifyApiError', () => {
  it('classifies MissingApiKeyError as auth', () => {
    expect(classifyApiError(new MissingApiKeyError())).toBe('auth');
  });

  it('classifies "API key not valid" as auth', () => {
    expect(classifyApiError(new Error('API key not valid'))).toBe('auth');
  });

  it('classifies 401 responses as auth', () => {
    expect(classifyApiError(new Error('Request failed with 401 Unauthorized'))).toBe('auth');
  });

  it('classifies 403 / permission denied as auth', () => {
    expect(classifyApiError(new Error('403 permission denied'))).toBe('auth');
  });

  it('classifies quota / rate-limit errors as quota', () => {
    expect(classifyApiError(new Error('Quota exceeded for project'))).toBe('quota');
    expect(classifyApiError(new Error('Rate limit hit, try again later'))).toBe('quota');
    expect(classifyApiError(new Error('429 Too Many Requests'))).toBe('quota');
    expect(classifyApiError(new Error('RESOURCE_EXHAUSTED'))).toBe('quota');
  });

  it('classifies network / fetch / timeout errors as network', () => {
    expect(classifyApiError(new Error('network request failed'))).toBe('network');
    expect(classifyApiError(new Error('fetch error: ECONNREFUSED'))).toBe('network');
    expect(classifyApiError(new Error('Request timeout after 30s'))).toBe('network');
    expect(classifyApiError(new Error('aborted'))).toBe('network');
  });

  it('falls through to "other" for unrecognised messages', () => {
    expect(classifyApiError(new Error('Something weird happened'))).toBe('other');
    expect(classifyApiError('plain string error')).toBe('other');
    expect(classifyApiError(undefined)).toBe('other');
  });

  it('is case-insensitive', () => {
    expect(classifyApiError(new Error('UNAUTHORIZED access'))).toBe('auth');
    expect(classifyApiError(new Error('QUOTA Exceeded'))).toBe('quota');
  });
});
