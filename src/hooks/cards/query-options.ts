import { getUserCardsAction } from "@/server/cards/actions";

export const getUserCardsQuery = () => ({
  queryKey: ["get-user-cards"],
  queryFn: getUserCardsAction,
});
