import { addUserBadgeAction, createBadgeAction, getUserBadgesAction } from "@/server/badges/action";

export const getUserBadgesQuery = () => ({
  queryKey: ["get-user-badges"],
  queryFn: getUserBadgesAction,
});

export const createBadgeMutation = (options?: { onSuccess?: () => void }) => ({
  mutationFn: createBadgeAction,
  onSuccess: options?.onSuccess,
  onError: (createError: Error) => console.error(createError),
});

export const addUserBadgeMutation = (options?: { onSuccess?: () => void }) => ({
  mutationFn: addUserBadgeAction,
  onSuccess: options?.onSuccess,
  onError: (addError: Error) => console.error(addError),
});
