export const RARITY_ORDER: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  event_rare: 3,
};

export const RARITY_LABEL: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  event_rare: "Event Rare",
};

export const RARITY_STYLES: Record<string, string> = {
  common: "bg-gray-100 text-gray-700",
  uncommon: "bg-green-100 text-green-700",
  rare: "bg-blue-100 text-blue-700",
  event_rare: "bg-amber-100 text-amber-800",
};

export const RARITY_INFO_STYLES: Record<string, string> = {
  common: "bg-gray-50",
  uncommon: "bg-green-50",
  rare: "bg-blue-50",
  event_rare: "bg-amber-50",
};

export const RARITY_BACKDROP_STYLES: Record<string, string> = {
  common: "bg-gray-300",
  uncommon: "bg-green-300",
  rare: "bg-blue-400",
  event_rare: "bg-amber-400",
};

export const RARITY_BORDER_STYLES: Record<string, string> = {
  common: "border-gray-500",
  uncommon: "border-green-600",
  rare: "border-blue-700",
  event_rare: "border-amber-700",
};
