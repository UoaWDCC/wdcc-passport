import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, orderBy } = vi.hoisted(() => {
  const orderBy = vi.fn();
  return {
    orderBy,
    db: { select: vi.fn(() => ({ from: vi.fn(() => ({ orderBy })) })) },
  };
});

vi.mock("@/lib/db/client", () => ({ db }));

import { listGreetings } from "./list-greetings.service";

describe("listGreetings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns greetings newest first", async () => {
    const rows = [
      { id: 2, message: "hi", createdAt: new Date() },
      { id: 1, message: "hello", createdAt: new Date() },
    ];
    orderBy.mockResolvedValueOnce(rows);

    const result = await listGreetings();

    expect(db.select).toHaveBeenCalledOnce();
    expect(result).toBe(rows);
  });
});
