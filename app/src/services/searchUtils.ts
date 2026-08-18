// ============================================================
// Veterinaria La Plata — Search Utilities (tokens normalizados)
// ============================================================

export const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const buildSearchTokens = (pet: { name: string; breed?: string; ownerName?: string }): string[] => {
  const tokens = new Set<string>();
  const push = (text: string) => {
    const clean = normalizeText(text);
    if (!clean) return;
    clean.split(/\s+/).forEach((word) => {
      if (word.length >= 2) tokens.add(word);
      tokens.add(clean);
    });
  };
  push(pet.name);
  if (pet.breed) push(pet.breed);
  if (pet.ownerName) push(pet.ownerName);
  return Array.from(tokens);
};
