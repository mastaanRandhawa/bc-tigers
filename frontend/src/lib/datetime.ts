export function toDatetimeLocal(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocal(value: string): string {
  return new Date(value).toISOString();
}

export function toDateInput(iso?: string): string {
  if (!iso) return '';
  return iso.split('T')[0];
}

export function fromDateInput(value: string): string {
  return new Date(`${value}T12:00:00`).toISOString();
}
