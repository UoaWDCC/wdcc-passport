import { RARITY_INFO_STYLES, RARITY_STYLES } from "@/lib/rarity";

export type CollectionCardDisplayData = {
  cardId: number;
  displayName: string;
  rarity: string;
  imageUrl: string | null;
  count?: number;
  eventTitle?: string | null;
};

export function CollectionCardDisplay({
  card,
  className = "",
}: {
  card: CollectionCardDisplayData;
  className?: string;
}) {
  const showCount = typeof card.count === "number" && card.count > 1;

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {showCount ? (
        <span
          aria-label={`Owned ${card.count} times`}
          className="absolute top-2 right-2 z-10 flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-950 px-1.5 text-[0.7rem] font-bold text-white shadow"
        >
          x{card.count}
        </span>
      ) : null}

      <div className="aspect-[3/4] bg-gradient-to-b from-gray-50 to-gray-100">
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.imageUrl}
            alt={card.displayName}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
            No image
          </div>
        )}
      </div>

      <div
        className={`flex flex-col gap-1 p-2 ${
          RARITY_INFO_STYLES[card.rarity] ?? "bg-gray-50"
        }`}
      >
        <p className="truncate text-sm font-semibold text-gray-950 capitalize">
          {card.displayName}
        </p>

        <span
          className={`w-fit rounded px-1.5 py-0.5 text-[0.65rem] font-medium ${
            RARITY_STYLES[card.rarity] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {card.rarity.replace("_", " ")}
        </span>

        {card.eventTitle ? (
          <p className="truncate text-[0.65rem] text-gray-400">
            {card.eventTitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
