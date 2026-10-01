export type HeroModelMaterial = Readonly<{
  pbrMetallicRoughness: {
    baseColorFactor: readonly number[];
    setBaseColorFactor(color: string | number[]): void;
  };
}>;

export function applyHeroMaterialTint(materials: readonly HeroModelMaterial[], tint: string | null) {
  if (!tint || !/^#[0-9a-f]{6}$/i.test(tint)) return;
  const color = [0, 1, 2].map(channel => {
    const srgb = parseInt(tint.slice(1 + channel * 2, 3 + channel * 2), 16) / 255;
    return srgb <= .04045 ? srgb / 12.92 : Math.pow((srgb + .055) / 1.055, 2.4);
  });
  for (const material of materials) {
    const pbr = material.pbrMetallicRoughness;
    pbr.setBaseColorFactor([...color, pbr.baseColorFactor[3] ?? 1]);
  }
}
