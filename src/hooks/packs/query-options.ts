import { getUserPackCountAction, openPackAction } from "@/server/packs/action";

export const getUserPackCountQuery = () => ({
  queryKey: ["get-user-pack-count"],
  queryFn: getUserPackCountAction,
});

export const openPackMutation = (options?: { onSuccess?: () => void }) => ({
  mutationFn: openPackAction,
  onSuccess: options?.onSuccess,
});
