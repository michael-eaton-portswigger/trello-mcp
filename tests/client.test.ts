import { beforeEach, describe, expect, it, vi } from "vitest";
import { TrelloApiError, TrelloClient } from "../src/trello/client.js";

const BOARD_ID = "board123";

let client: TrelloClient;

function mockFetch(body: unknown, status = 200) {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(String(body)),
  } as unknown as Response);
}

function lastCall() {
  return (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
}

function lastUrl(): string {
  return lastCall()[0] as string;
}

function lastBody(): string {
  return lastCall()[1].body as string;
}

beforeEach(() => {
  vi.restoreAllMocks();
  client = new TrelloClient("test-key", "test-token", BOARD_ID);
});

describe("TrelloClient", () => {
  describe("authentication", () => {
    it("includes auth params on every request", async () => {
      mockFetch([]);
      await client.listBoards();
      expect(lastUrl()).toContain("key=test-key");
      expect(lastUrl()).toContain("token=test-token");
    });

    it("does not include credentials in POST body", async () => {
      mockFetch({ id: "c1", name: "New card" });
      await client.createCard({ idList: "l1", name: "New card" });
      expect(lastBody()).not.toContain("key=");
      expect(lastBody()).not.toContain("token=");
    });
  });

  describe("boards", () => {
    it("listBoards returns board array", async () => {
      const boards = [{ id: "b1", name: "My Board", url: "http://trello.com/b/1", closed: false }];
      mockFetch(boards);
      const result = await client.listBoards();
      expect(result).toEqual(boards);
    });

    it("getBoard targets the configured board", async () => {
      mockFetch({ id: BOARD_ID, name: "Test Board", url: "http://trello.com/b/x", closed: false });
      await client.getBoard();
      expect(lastUrl()).toContain(`/boards/${BOARD_ID}`);
    });

    it("getLists targets the configured board", async () => {
      mockFetch([]);
      await client.getLists();
      expect(lastUrl()).toContain(`/boards/${BOARD_ID}/lists`);
    });

    it("getBoardLabels targets the configured board", async () => {
      mockFetch([]);
      await client.getBoardLabels();
      expect(lastUrl()).toContain(`/boards/${BOARD_ID}/labels`);
    });

    it("getBoardMembers targets the configured board", async () => {
      mockFetch([]);
      await client.getBoardMembers();
      expect(lastUrl()).toContain(`/boards/${BOARD_ID}/members`);
    });

    it("getBoardCards fetches open cards for the configured board", async () => {
      mockFetch([]);
      await client.getBoardCards();
      expect(lastUrl()).toContain(`/boards/${BOARD_ID}/cards`);
      expect(lastUrl()).toContain("filter=open");
    });
  });

  describe("cards", () => {
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
      const call = lastCall();
      expect(call[1].method).toBe("POST");
      expect(lastBody()).toContain("name=New+card");
      expect(lastBody()).toContain("idList=l1");
      expect(lastBody()).toContain("desc=Details");
    });

    it("updateCard PUTs the correct fields", async () => {
      mockFetch({ id: "c1", name: "Updated" });
      await client.updateCard("c1", { name: "Updated", desc: "New desc" });
      expect(lastCall()[1].method).toBe("PUT");
      expect(lastUrl()).toContain("/cards/c1");
      expect(lastBody()).toContain("name=Updated");
      expect(lastBody()).toContain("desc=New+desc");
    });

    it("updateCard clears due date when passed null", async () => {
      mockFetch({ id: "c1", name: "Card" });
      await client.updateCard("c1", { due: null });
      expect(lastBody()).toContain("due=");
      // null serialises to empty string to clear the field
      expect(lastBody()).toMatch(/due=(&|$)/);
    });

    it("searchCards scopes results to configured board", async () => {
      mockFetch({ cards: [] });
      await client.searchCards("bug");
      expect(lastUrl()).toContain(`idBoards=${BOARD_ID}`);
      expect(lastUrl()).toContain("query=bug");
    });

    it("searchCards requests up to 1000 results", async () => {
      mockFetch({ cards: [] });
      await client.searchCards("anything");
      expect(lastUrl()).toContain("cards_limit=1000");
    });
  });

  describe("labels", () => {
    it("addLabelToCard POSTs to the correct endpoint", async () => {
      mockFetch([]);
      await client.addLabelToCard("c1", "label1");
      expect(lastCall()[1].method).toBe("POST");
      expect(lastUrl()).toContain("/cards/c1/idLabels");
      expect(lastBody()).toContain("value=label1");
    });

    it("removeLabelFromCard DELETEs the correct endpoint", async () => {
      mockFetch({});
      await client.removeLabelFromCard("c1", "label1");
      expect(lastCall()[1].method).toBe("DELETE");
      expect(lastUrl()).toContain("/cards/c1/idLabels/label1");
    });
  });

  describe("checklists", () => {
    it("getChecklists fetches from the correct card", async () => {
      mockFetch([]);
      await client.getChecklists("c1");
      expect(lastUrl()).toContain("/cards/c1/checklists");
    });

    it("createChecklist POSTs with card and name", async () => {
      mockFetch({ id: "cl1", name: "Todo", idCard: "c1", checkItems: [] });
      await client.createChecklist("c1", "Todo");
      expect(lastCall()[1].method).toBe("POST");
      expect(lastBody()).toContain("idCard=c1");
      expect(lastBody()).toContain("name=Todo");
    });

    it("addChecklistItem POSTs to the correct checklist", async () => {
      mockFetch({ id: "ci1", name: "Item", state: "incomplete", pos: 1 });
      await client.addChecklistItem("cl1", "Item");
      expect(lastCall()[1].method).toBe("POST");
      expect(lastUrl()).toContain("/checklists/cl1/checkItems");
      expect(lastBody()).toContain("name=Item");
    });

    it("updateChecklistItem PUTs state to the correct endpoint", async () => {
      mockFetch({ id: "ci1", name: "Item", state: "complete", pos: 1 });
      await client.updateChecklistItem("c1", "ci1", { state: "complete" });
      expect(lastCall()[1].method).toBe("PUT");
      expect(lastUrl()).toContain("/cards/c1/checkItem/ci1");
      expect(lastBody()).toContain("state=complete");
    });
  });

  describe("comments", () => {
    it("getComments filters to commentCard actions", async () => {
      mockFetch([]);
      await client.getComments("c1");
      expect(lastUrl()).toContain("/cards/c1/actions");
      expect(lastUrl()).toContain("filter=commentCard");
    });

    it("addComment POSTs to the comments endpoint", async () => {
      mockFetch({ id: "a1" });
      await client.addComment("c1", "Hello");
      expect(lastUrl()).toContain("/cards/c1/actions/comments");
      expect(lastCall()[1].method).toBe("POST");
      expect(lastBody()).toContain("text=Hello");
    });
  });

  describe("members", () => {
    it("assignMember POSTs member id to the correct card", async () => {
      mockFetch([]);
      await client.assignMember("c1", "m1");
      expect(lastCall()[1].method).toBe("POST");
      expect(lastUrl()).toContain("/cards/c1/idMembers");
      expect(lastBody()).toContain("value=m1");
    });

    it("unassignMember DELETEs from the correct card", async () => {
      mockFetch({});
      await client.unassignMember("c1", "m1");
      expect(lastCall()[1].method).toBe("DELETE");
      expect(lastUrl()).toContain("/cards/c1/idMembers/m1");
    });
  });

  describe("attachments", () => {
    it("getAttachments fetches from the correct card", async () => {
      mockFetch([]);
      await client.getAttachments("c1");
      expect(lastUrl()).toContain("/cards/c1/attachments");
    });

    it("addUrlAttachment POSTs with url", async () => {
      mockFetch({ id: "at1", name: "Link", url: "https://example.com", date: "", mimeType: "", isUpload: false });
      await client.addUrlAttachment("c1", "https://example.com");
      expect(lastCall()[1].method).toBe("POST");
      expect(lastUrl()).toContain("/cards/c1/attachments");
      expect(lastBody()).toContain("url=https");
    });

    it("addUrlAttachment includes optional name when provided", async () => {
      mockFetch({ id: "at1", name: "My Link", url: "https://example.com", date: "", mimeType: "", isUpload: false });
      await client.addUrlAttachment("c1", "https://example.com", "My Link");
      expect(lastBody()).toContain("name=My+Link");
    });
  });

  describe("error handling", () => {
    it("throws TrelloApiError on non-2xx response", async () => {
      mockFetch("not found", 404);
      await expect(client.getCard("missing")).rejects.toBeInstanceOf(TrelloApiError);
    });

    it("TrelloApiError carries the status code", async () => {
      mockFetch("unauthorized", 401);
      await expect(client.listBoards()).rejects.toMatchObject({ status: 401 });
    });
  });
});
