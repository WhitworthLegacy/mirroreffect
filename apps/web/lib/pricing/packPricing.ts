type PackCode = "DISCOVERY" | "ESSENTIAL" | "PREMIUM";

const PACK_PRICES: Record<PackCode, number> = {
  DISCOVERY: 480,
  ESSENTIAL: 530,
  PREMIUM: 580
};

export function getFinalPriceByPack(packCode?: PackCode): number {
  if (!packCode) {
    return 0;
  }
  return PACK_PRICES[packCode] ?? 0;
}

