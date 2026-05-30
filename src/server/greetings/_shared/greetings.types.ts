// The greetings resource row type, shared by every operation that returns one.
// `import type` keeps this fully erasable — no schema code reaches the client.
import type { greetings } from "@/lib/db/schema";

export type Greeting = typeof greetings.$inferSelect;
