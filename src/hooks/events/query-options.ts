import { createEventAction } from "@/server/events/create-event/create-event.action";
import { getEventsAction } from "@/server/events/get-events/get-events.action";

export const getEventsQuery = () => ({
  queryKey: ["get-events"],
  queryFn: getEventsAction,
});

export const createEventMutation = (options?: { onSuccess?: () => void }) => ({
  mutationFn: createEventAction,
  onSuccess: options?.onSuccess,
  onError: (createError: Error) => console.error(createError),
});
