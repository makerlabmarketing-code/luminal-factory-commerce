export type HeroModelMaterial = Readonly<{
  pbrMetallicRoughness: {
    baseColorFactor: readonly number[];
    setBaseColorFactor(color: string | number[]): void;
    roughnessFactor?: number;
    setRoughnessFactor?: (roughness: number) => void;
  };
}>;

export function applyHeroMaterialTint(materials: readonly HeroModelMaterial[], tint: string | null) {
  // Tone down very sharp specular highlights that exaggerate low-poly facets.
  // This does not modify GLB geometry or replace the artist's existing roughness
  // when it is already soft enough. Match ERP preview's lighting behavior.
  for (const material of materials) {
    const pbr = material.pbrMetallicRoughness;
    if (typeof pbr.roughnessFactor === "number" && pbr.roughnessFactor < 0.42) {
      pbr.setRoughnessFactor?.(0.42);
    }
  }
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
