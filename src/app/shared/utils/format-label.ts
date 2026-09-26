/** Turns an enum-style value like 'in-progress' or 'social-media' into 'In progress' / 'Social media'. */
export function formatEnumLabel(value: string): string {
  const words = value.split('-');
  return words[0].charAt(0).toUpperCase() + words[0].slice(1) + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '');
}
