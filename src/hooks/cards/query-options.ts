import { normalizeEntry } from "@/cards/manifest";
import { getUserCardsAction } from "@/server/cards/actions";

type UserCardRow = Awaited<ReturnType<typeof getUserCardsAction>>[number];

const toEntries = (rows: UserCardRow[]) => rows.map(normalizeEntry);

export const getUserCardsQuery = () => ({
  queryKey: ["get-user-cards"],
  queryFn: getUserCardsAction,
  select: toEntries,
});
