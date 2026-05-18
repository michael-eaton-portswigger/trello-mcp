import { beforeEach, describe, expect, it, vi } from "vitest";
import { TrelloApiError, TrelloClient } from "../src/trello/client.js";

const BOARD_ID = "board123";
const client = new TrelloClient("test-key", "test-token", BOARD_ID);

function mockFetch(body: unknown, status = 200) {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(String(body)),
  } as unknown as Response);
}

function lastUrl(): string {
  return (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("TrelloClient", () => {
  it("includes auth params on every request", async () => {
    mockFetch([]);
    await client.listBoards();
    expect(lastUrl()).toContain("key=test-key");
    expect(lastUrl()).toContain("token=test-token");
  });

  it("listBoards returns board array", async () => {
    const boards = [{ id: "b1", name: "My Board", url: "http://trello.com/b/1", closed: false }];
    mockFetch(boards);
    const result = await client.listBoards();
    expect(result).toEqual(boards);
  });

  it("getLists targets the configured board", async () => {
    mockFetch([]);
    await client.getLists();
    expect(lastUrl()).toContain(`/boards/${BOARD_ID}/lists`);
  });

  it("getCard targets the correct card", async () => {
    const card = { id: "c1", name: "Test card" };
    mockFetch(card);
    const result = await client.getCard("c1");
    expect(result).toEqual(card);
    expect(lastUrl()).toContain("/cards/c1");
  });

  it("createCard POSTs with correct fields", async () => {
    mockFetch({ id: "c2", name: "New card" });
    await client.createCard({ idList: "l1", name: "New card", desc: "Details" });
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1].method).toBe("POST");
    const body = call[1].body as string;
    expect(body).toContain("name=New+card");
    expect(body).toContain("idList=l1");
    expect(body).toContain("desc=Details");
  });

  it("addComment POSTs to the comments endpoint", async () => {
    mockFetch({ id: "a1" });
    await client.addComment("c1", "Hello");
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toContain("/cards/c1/actions/comments");
    expect(call[1].method).toBe("POST");
  });

  it("throws TrelloApiError on non-2xx response", async () => {
    mockFetch("not found", 404);
    await expect(client.getCard("missing")).rejects.toBeInstanceOf(TrelloApiError);
  });

  it("TrelloApiError carries the status code", async () => {
    mockFetch("unauthorized", 401);
    try {
      await client.listBoards();
    } catch (e) {
      expect(e).toBeInstanceOf(TrelloApiError);
      expect((e as TrelloApiError).status).toBe(401);
    }
  });
});
