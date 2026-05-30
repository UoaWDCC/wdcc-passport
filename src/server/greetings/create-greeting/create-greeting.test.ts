import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, returning } = vi.hoisted(() => {
  const returning = vi.fn();
  return {
    returning,
    db: { insert: vi.fn(() => ({ values: vi.fn(() => ({ returning })) })) },
  };
});

vi.mock("@/lib/db/client", () => ({ db }));

import { createGreeting } from "./create-greeting.service";

describe("createGreeting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts and returns the new greeting", async () => {
    const row = { id: 1, message: "hey", createdAt: new Date() };
    returning.mockResolvedValueOnce([row]);

    const result = await createGreeting({ message: "hey" });

    expect(db.insert).toHaveBeenCalledOnce();
    expect(result).toEqual(row);
  });
});
