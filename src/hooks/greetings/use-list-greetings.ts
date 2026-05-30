"use client";

import { useQuery } from "@tanstack/react-query";

import { listGreetingsAction } from "@/server/greetings/list-greetings/list-greetings.actions";

import { greetingsKeys } from "./greetings.keys";

export function useGreetings() {
  // `data` is inferred as Greeting[] from the action's return type.
  return useQuery({
    queryKey: greetingsKeys.list(),
    queryFn: () => listGreetingsAction(),
  });
}
