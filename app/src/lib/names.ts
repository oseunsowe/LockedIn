/** First whitespace-separated word of a typed/provided name, or null if there isn't one. The
 * greeting is "Good Morning, <first name>", so a user who types a full name still gets that. */
export function firstNameOf(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const first = raw.trim().split(/\s+/)[0];
  return first ? first : null;
}
