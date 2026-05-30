"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { greetingsKeys } from "../_shared/greetings.keys";
import { createGreetingAction } from "./create-greeting.actions";

export function useCreateGreeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGreetingAction,
    onSuccess: () => {
      // Invalidate the shared greetings keys so list-greetings refetches.
      queryClient.invalidateQueries({ queryKey: greetingsKeys.all });
    },
  });
}
