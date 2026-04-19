export interface CorePack {
  cores: number;
  priceUsd: number;
  label: string;
}

export const CORE_PACKS: CorePack[] = [
  { cores: 100, priceUsd: 4.99, label: "Starter Pack" },
  { cores: 200, priceUsd: 8.99, label: "Boost Pack" },
  { cores: 500, priceUsd: 19.99, label: "Max Pack" },
];

export function getCorePack(cores: number) {
  return CORE_PACKS.find((pack) => pack.cores === cores) || null;
}
