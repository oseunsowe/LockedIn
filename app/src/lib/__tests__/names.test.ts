import { firstNameOf } from '../names';

describe('firstNameOf', () => {
  it('returns the first word of a full name', () => {
    expect(firstNameOf('Oseun Sowemimo')).toBe('Oseun');
  });

  it('trims surrounding and repeated whitespace', () => {
    expect(firstNameOf('  Ada   Lovelace ')).toBe('Ada');
  });

  it('returns a single name unchanged', () => {
    expect(firstNameOf('Ada')).toBe('Ada');
  });

  it('returns null for empty, blank, or non-string input', () => {
    expect(firstNameOf('')).toBeNull();
    expect(firstNameOf('   ')).toBeNull();
    expect(firstNameOf(undefined)).toBeNull();
    expect(firstNameOf(42)).toBeNull();
  });
});
