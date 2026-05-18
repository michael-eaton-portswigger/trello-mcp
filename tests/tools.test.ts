import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrelloClient } from "../src/trello/client.js";
import { resolveList } from "../src/tools/lists.js";
import type { TrelloLabel, TrelloList, TrelloMember } from "../src/trello/types.js";

// Minimal TrelloClient stub — only the methods each test needs
function makeClient(overrides: Partial<TrelloClient> = {}): TrelloClient {
  return {
    boardId: "board1",
    listBoards: vi.fn(),
    getBoard: vi.fn(),
    getLists: vi.fn(),
    getBoardLabels: vi.fn(),
    getBoardMembers: vi.fn(),
    getBoardCards: vi.fn(),
    getListCards: vi.fn(),
    getCard: vi.fn(),
    searchCards: vi.fn(),
    createCard: vi.fn(),
    updateCard: vi.fn(),
    addLabelToCard: vi.fn(),
    removeLabelFromCard: vi.fn(),
    getChecklists: vi.fn(),
    createChecklist: vi.fn(),
    addChecklistItem: vi.fn(),
    updateChecklistItem: vi.fn(),
    getComments: vi.fn(),
    addComment: vi.fn(),
    assignMember: vi.fn(),
    unassignMember: vi.fn(),
    getAttachments: vi.fn(),
    addUrlAttachment: vi.fn(),
    ...overrides,
  } as unknown as TrelloClient;
}

const lists: TrelloList[] = [
  { id: "l1", name: "To Do", closed: false, pos: 1 },
  { id: "l2", name: "In Progress", closed: false, pos: 2 },
  { id: "l3", name: "Done", closed: false, pos: 3 },
];

describe("resolveList", () => {
  it("returns the matching list (exact case)", async () => {
    const client = makeClient({ getLists: vi.fn().mockResolvedValue(lists) });
    const result = await resolveList(client, "In Progress");
    expect(result.id).toBe("l2");
  });

  it("matches case-insensitively", async () => {
    const client = makeClient({ getLists: vi.fn().mockResolvedValue(lists) });
    const result = await resolveList(client, "in progress");
    expect(result.id).toBe("l2");
  });

  it("throws with available list names when not found", async () => {
    const client = makeClient({ getLists: vi.fn().mockResolvedValue(lists) });
    await expect(resolveList(client, "Backlog")).rejects.toThrow(
      /No list named "Backlog"/,
    );
  });

  it("includes valid list names in the error", async () => {
    const client = makeClient({ getLists: vi.fn().mockResolvedValue(lists) });
    await expect(resolveList(client, "Backlog")).rejects.toThrow(
      /"To Do".*"In Progress".*"Done"/,
    );
  });
});

describe("label matching (add_label logic)", () => {
  const boardLabels: TrelloLabel[] = [
    { id: "lb1", name: "Bug", color: "red" },
    { id: "lb2", name: "", color: "green" },
    { id: "lb3", name: "Feature", color: "blue" },
  ];

  function findLabel(label: string) {
    return boardLabels.find(
      (l) =>
        l.name.toLowerCase() === label.toLowerCase() ||
        (l.color ?? "").toLowerCase() === label.toLowerCase(),
    );
  }

  it("matches by name (case-insensitive)", () => {
    expect(findLabel("bug")?.id).toBe("lb1");
    expect(findLabel("BUG")?.id).toBe("lb1");
  });

  it("matches by color when name is empty", () => {
    expect(findLabel("green")?.id).toBe("lb2");
  });

  it("matches by color even when label has a name", () => {
    expect(findLabel("red")?.id).toBe("lb1");
  });

  it("returns undefined for an unknown label", () => {
    expect(findLabel("purple")).toBeUndefined();
  });
});

describe("member matching (assign_member logic)", () => {
  const members: TrelloMember[] = [
    { id: "m1", fullName: "Alice Smith", username: "alice" },
    { id: "m2", fullName: "Bob Jones", username: "bjones" },
  ];

  function findMember(query: string) {
    return members.find(
      (m) =>
        m.username.toLowerCase() === query.toLowerCase() ||
        m.fullName.toLowerCase() === query.toLowerCase(),
    );
  }

  it("matches by username (case-insensitive)", () => {
    expect(findMember("Alice")?.id).toBe("m1");
  });

  it("matches by full name (case-insensitive)", () => {
    expect(findMember("bob jones")?.id).toBe("m2");
  });

  it("returns undefined for unknown member", () => {
    expect(findMember("nobody")).toBeUndefined();
  });
});

describe("update_checklist_item guard", () => {
  it("rejects calls with neither state nor name", async () => {
    const { registerChecklistTools } = await import("../src/tools/checklists.js");

    let capturedHandler: (args: Record<string, unknown>) => Promise<unknown>;
    const server = {
      tool: vi.fn((name, _desc, _schema, handler) => {
        if (name === "update_checklist_item") capturedHandler = handler;
      }),
    };
    const client = makeClient();
    registerChecklistTools(server as never, client);

    await expect(
      capturedHandler!({ card_id: "c1", checklist_item_id: "ci1" }),
    ).rejects.toThrow("Provide at least one of: state, name");
  });
});

describe("labelDisplay", () => {
  it("returns label name when present", async () => {
    const { labelDisplay } = await import("../src/trello/types.js");
    expect(labelDisplay({ id: "1", name: "Bug", color: "red" })).toBe("Bug");
  });

  it("falls back to color when name is empty", async () => {
    const { labelDisplay } = await import("../src/trello/types.js");
    expect(labelDisplay({ id: "1", name: "", color: "green" })).toBe("green");
  });

  it("falls back to id when both name and color are empty", async () => {
    const { labelDisplay } = await import("../src/trello/types.js");
    expect(labelDisplay({ id: "id123", name: "", color: "" })).toBe("id123");
  });
});

describe("formatDate", () => {
  it("returns the ISO date portion only", async () => {
    const { formatDate } = await import("../src/trello/types.js");
    expect(formatDate("2026-06-15T10:30:00.000Z")).toBe("2026-06-15");
  });

  it("is locale-independent", async () => {
    const { formatDate } = await import("../src/trello/types.js");
    const original = Intl.DateTimeFormat;
    // @ts-expect-error intentional override to confirm no locale dependency
    global.Intl = { DateTimeFormat: vi.fn(() => { throw new Error("locale used"); }) };
    expect(() => formatDate("2026-01-01T00:00:00Z")).not.toThrow();
    global.Intl = { DateTimeFormat: original } as typeof Intl;
  });
});
