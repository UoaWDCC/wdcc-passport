import { normalizeEntry } from "@/cards/manifest";
import { getUserPackCountAction, openPackAction } from "@/server/packs/action";

export const getUserPackCountQuery = () => ({
  queryKey: ["get-user-pack-count"],
  queryFn: getUserPackCountAction,
});

export const openPackMutation = (options?: { onSuccess?: () => void }) => ({
  mutationFn: async () => (await openPackAction()).map(normalizeEntry),
  onSuccess: options?.onSuccess,
});
