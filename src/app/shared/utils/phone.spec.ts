import { describe, expect, it } from 'vitest';
import { dialNumber, telHref } from './phone';

describe('dialNumber', () => {
  it('leaves a clean 10-digit number alone', () => {
    expect(dialNumber('9155772255')).toBe('9155772255');
  });

  it('drops a leading 0 (trunk prefix)', () => {
    expect(dialNumber('09155772255')).toBe('9155772255');
  });

  it('keeps only the last 10 digits when a country code is present', () => {
    expect(dialNumber('919155772255')).toBe('9155772255');
    expect(dialNumber('+91 91557 72255')).toBe('9155772255');
    expect(dialNumber('+91-9155-772255')).toBe('9155772255');
  });

  it('handles 00-style international prefixes', () => {
    expect(dialNumber('0091 9155772255')).toBe('9155772255');
    expect(dialNumber('00919155772255')).toBe('9155772255');
  });

  it('ignores spaces, dashes, dots and brackets', () => {
    expect(dialNumber('(091) 55-77.22 55')).toBe('9155772255');
  });

  it('leaves shorter numbers as typed (minus leading zeros)', () => {
    expect(dialNumber('0120 2345678')).toBe('1202345678');
    expect(dialNumber('2345678')).toBe('2345678');
  });

  it('returns an empty string when there is nothing to dial', () => {
    expect(dialNumber('')).toBe('');
    expect(dialNumber(null)).toBe('');
    expect(dialNumber(undefined)).toBe('');
    expect(dialNumber('n/a')).toBe('');
    expect(dialNumber('000')).toBe('');
  });
});

describe('telHref', () => {
  it('builds a tel: link from the cleaned number', () => {
    expect(telHref('+91 91557 72255')).toBe('tel:9155772255');
  });

  it('is null when there is no number, so the button can be hidden', () => {
    expect(telHref('')).toBeNull();
    expect(telHref('abc')).toBeNull();
  });
});
