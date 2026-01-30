export type PackCode = "DISCOVERY" | "ESSENTIAL" | "PREMIUM";

const PACK_PRICES: Record<PackCode, number> = {
  DISCOVERY: 550,
  ESSENTIAL: 600,
  PREMIUM: 650
};

export function getFinalPriceByPack(packCode?: PackCode): number {
  if (!packCode) {
    return 0;
  }
  return PACK_PRICES[packCode] ?? 0;
}
