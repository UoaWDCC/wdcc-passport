"use client";

import { useQuery } from "@tanstack/react-query";

import { greetingsKeys } from "../_shared/greetings.keys";
import { listGreetingsAction } from "./list-greetings.actions";

export function useGreetings() {
  // `data` is inferred as Greeting[] from the action's return type.
  return useQuery({
    queryKey: greetingsKeys.list(),
    queryFn: () => listGreetingsAction(),
  });
}
