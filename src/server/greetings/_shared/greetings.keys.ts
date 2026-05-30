// Query keys for the greetings resource. Shared across every greetings
// operation so a mutation in one folder (create-greeting) can invalidate a
// query owned by another (list-greetings).
export const greetingsKeys = {
  all: ["example", "greetings"] as const,
  list: () => [...greetingsKeys.all, "list"] as const,
};
