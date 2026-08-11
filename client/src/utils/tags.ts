export function parseTags(tags?: string) {
  return Array.from(
    new Set(
      (tags ?? '')
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}
