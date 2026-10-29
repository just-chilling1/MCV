export function localTerritorySuggestions(hobby: string): string[] {
  const h = hobby.trim();
  if (!h) return [];

  return [
    `Beginner ${h} guide`,
    `Best ${h} equipment`,
    `${h} tips and tricks`,
    `${h} for side income`,
    `Advanced ${h} strategies`,
    `${h} mistakes to avoid`,
  ];
}
