import { openPackAction } from "@/server/packs/action";

export const openPackMutation = () => ({
    mutationFn: openPackAction,
});