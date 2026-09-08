import {
  createEventAction,
  deleteEventAction,
  getAllEventsAction,
  updateEventAction,
} from "@/server/events/action";

export const getEventsQuery = () => ({
  queryKey: ["get-events"],
  queryFn: getAllEventsAction,
});

export const createEventMutation = (options?: { onSuccess?: () => void }) => ({
  mutationFn: createEventAction,
  onSuccess: options?.onSuccess,
  onError: (createError: Error) => console.error(createError),
});

export const updateEventMutation = (options?: { onSuccess?: () => void }) => ({
  mutationFn: updateEventAction,
  onSuccess: options?.onSuccess,
  onError: (updateError: Error) => console.error(updateError),
});

export const deleteEventMutation = (options?: { onSuccess?: () => void }) => ({
  mutationFn: deleteEventAction,
  onSuccess: options?.onSuccess,
  onError: (deleteError: Error) => console.error(deleteError),
});
