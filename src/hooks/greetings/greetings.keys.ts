// Query keys for the greetings resource. Shared by every greetings hook so a
// mutation (use-create-greeting) can invalidate a query (use-list-greetings).
export const greetingsKeys = {
  all: ["greetings"] as const,
  list: () => [...greetingsKeys.all, "list"] as const,
};
