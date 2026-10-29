/** Shows a Peruvian mobile (51984123456 or 984123456) as +51 984 123 456; anything else as typed. */
export function formatPhone(value: string): string {
  const match = /^(?:51)?(9\d{2})(\d{3})(\d{3})$/.exec(value.replace(/\D/g, ''));
  return match ? `+51 ${match[1]} ${match[2]} ${match[3]}` : value;
}
