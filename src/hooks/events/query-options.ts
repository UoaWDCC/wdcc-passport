import { createEventAction, getAllEventsAction } from "@/server/events/action";

export const getEventsQuery = () => ({
  queryKey: ["get-events"],
  queryFn: getAllEventsAction,
});

export const createEventMutation = (options?: { onSuccess?: () => void }) => ({
  mutationFn: createEventAction,
  onSuccess: options?.onSuccess,
  onError: (createError: Error) => console.error(createError),
});
