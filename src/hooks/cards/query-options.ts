import { normalizeEntry } from "@/cards/manifest";
import { getUserCardsAction } from "@/server/cards/actions";

type UserCardRow = Awaited<ReturnType<typeof getUserCardsAction>>[number];

const toEntries = (rows: UserCardRow[]) =>
  rows.map((row) => ({ ...normalizeEntry(row), quantity: row.quantity }));

const toOwnedEntries = (rows: UserCardRow[]) => toEntries(rows.filter((row) => row.quantity > 0));

/** Every card in the set; `quantity` is 0 for the ones not collected yet. */
export const getUserCardsQuery = () => ({
  //same query key as getOwnedCardsQuery, so it uses the same cached fetch
  queryKey: ["get-user-cards"],
  queryFn: getUserCardsAction,
  select: toEntries,
});

/** Only the cards the user owns. Same cached fetch as the full set, a different view of it. */
export const getOwnedCardsQuery = () => ({
  //same query key as getUserCardsQuery, so it uses the same cached fetch
  queryKey: ["get-user-cards"],
  queryFn: getUserCardsAction,
  select: toOwnedEntries,
});
