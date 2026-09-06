import { openPackAction } from "@/server/packs/action";

export const openPackMutation = (options?: { onSuccess?: () => void }) => ({
  mutationFn: openPackAction,
  onSuccess: options?.onSuccess,
});
