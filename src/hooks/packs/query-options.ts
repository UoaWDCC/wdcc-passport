import { addUserPackAction } from "@/server/packs/action";

export const addUserPackMutation = (options?: { onSuccess?: () => void }) => ({
    mutationFn: addUserPackAction,
    onSuccess: options?.onSuccess,
});