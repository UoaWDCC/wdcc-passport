"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createGreetingAction } from "@/server/greetings/create-greeting/create-greeting.actions";

import { greetingsKeys } from "./greetings.keys";

export function useCreateGreeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGreetingAction,
    onSuccess: () => {
      // Invalidate the shared greetings keys so use-list-greetings refetches.
      queryClient.invalidateQueries({ queryKey: greetingsKeys.all });
    },
  });
}
