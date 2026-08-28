import { createBadgeAction, getUserBadgesAction } from "@/server/badges/action";

export const getUserBadgesQuery = () => ({
  queryKey: ["get-user-badges"],
  queryFn: getUserBadgesAction,
});

export const createBadgeMutation = (options?: { onSuccess?: () => void }) => ({
  mutationFn: createBadgeAction,
  onSuccess: options?.onSuccess,
  onError: (createError: Error) => console.error(createError),
});
