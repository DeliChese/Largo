export function searchable(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();
}

export function compactPhonetic(text: string): string {
  return searchable(text).replace(/[\s'’‘-]/gu, '');
}
