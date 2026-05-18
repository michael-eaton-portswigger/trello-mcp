import type {
  TrelloAttachment,
  TrelloBoard,
  TrelloCard,
  TrelloChecklist,
  TrelloChecklistItem,
  TrelloComment,
  TrelloLabel,
  TrelloList,
  TrelloMember,
} from "./types.js";

export class TrelloApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "TrelloApiError";
  }
}

export class TrelloClient {
  private readonly base = "https://api.trello.com/1";

  constructor(
    private readonly apiKey: string,
    private readonly token: string,
    public readonly boardId: string,
  ) {}

  private async request<T>(
    path: string,
    options: RequestInit & { params?: Record<string, string> } = {},
  ): Promise<T> {
    const { params = {}, ...init } = options;
    const qs = new URLSearchParams({ ...params, key: this.apiKey, token: this.token });
    const url = `${this.base}${path}?${qs}`;
    const res = await fetch(url, init);
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new TrelloApiError(res.status, text);
    }
    return res.json() as Promise<T>;
  }

  // Boards

  async listBoards(): Promise<TrelloBoard[]> {
    return this.request<TrelloBoard[]>("/members/me/boards", {
      params: { filter: "open" },
    });
  }

  async getBoard(): Promise<TrelloBoard> {
    return this.request<TrelloBoard>(`/boards/${this.boardId}`);
  }

  async getLists(): Promise<TrelloList[]> {
    return this.request<TrelloList[]>(`/boards/${this.boardId}/lists`, {
      params: { filter: "open" },
    });
  }

  async getBoardLabels(): Promise<TrelloLabel[]> {
    return this.request<TrelloLabel[]>(`/boards/${this.boardId}/labels`);
  }

  async getBoardMembers(): Promise<TrelloMember[]> {
    return this.request<TrelloMember[]>(`/boards/${this.boardId}/members`);
  }

  async getBoardCards(): Promise<TrelloCard[]> {
    return this.request<TrelloCard[]>(`/boards/${this.boardId}/cards`, {
      params: { filter: "open" },
    });
  }

  // Lists

  async getListCards(listId: string): Promise<TrelloCard[]> {
    return this.request<TrelloCard[]>(`/lists/${listId}/cards`, {
      params: { filter: "open" },
    });
  }

  // Cards

  async getCard(cardId: string): Promise<TrelloCard> {
    return this.request<TrelloCard>(`/cards/${cardId}`);
  }

  async searchCards(query: string): Promise<TrelloCard[]> {
    const results = await this.request<{ cards: TrelloCard[] }>("/search", {
      params: {
        query,
        idBoards: this.boardId,
        modelTypes: "cards",
        cards_limit: "1000",
        card_fields: "id,name,desc,idList,idBoard,url,due,dueComplete,closed,idLabels,idMembers,pos",
      },
    });
    return results.cards;
  }

  async createCard(params: {
    idList: string;
    name: string;
    desc?: string;
    due?: string;
    idLabels?: string[];
  }): Promise<TrelloCard> {
    const body = new URLSearchParams({
      idList: params.idList,
      name: params.name,
      ...(params.desc && { desc: params.desc }),
      ...(params.due && { due: params.due }),
      ...(params.idLabels?.length && { idLabels: params.idLabels.join(",") }),
    });
    return this.request<TrelloCard>("/cards", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  }

  async updateCard(
    cardId: string,
    fields: Partial<{ name: string; desc: string; due: string | null; idList: string; closed: boolean }>,
  ): Promise<TrelloCard> {
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) body.set(k, v === null ? "" : String(v));
    }
    return this.request<TrelloCard>(`/cards/${cardId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  }

  async addLabelToCard(cardId: string, labelId: string): Promise<void> {
    const body = new URLSearchParams({ value: labelId });
    await this.request(`/cards/${cardId}/idLabels`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  }

  async removeLabelFromCard(cardId: string, labelId: string): Promise<void> {
    await this.request(`/cards/${cardId}/idLabels/${labelId}`, {
      method: "DELETE",
    });
  }

  // Checklists

  async getChecklists(cardId: string): Promise<TrelloChecklist[]> {
    return this.request<TrelloChecklist[]>(`/cards/${cardId}/checklists`);
  }

  async createChecklist(cardId: string, name: string): Promise<TrelloChecklist> {
    const body = new URLSearchParams({ idCard: cardId, name });
    return this.request<TrelloChecklist>("/checklists", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  }

  async addChecklistItem(checklistId: string, name: string): Promise<TrelloChecklistItem> {
    const body = new URLSearchParams({ name });
    return this.request<TrelloChecklistItem>(`/checklists/${checklistId}/checkItems`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  }

  async updateChecklistItem(
    cardId: string,
    checklistItemId: string,
    fields: Partial<{ name: string; state: "complete" | "incomplete" }>,
  ): Promise<TrelloChecklistItem> {
    const body = new URLSearchParams({ ...fields });
    return this.request<TrelloChecklistItem>(`/cards/${cardId}/checkItem/${checklistItemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  }

  // Comments

  async getComments(cardId: string): Promise<TrelloComment[]> {
    return this.request<TrelloComment[]>(`/cards/${cardId}/actions`, {
      params: { filter: "commentCard" },
    });
  }

  async addComment(cardId: string, text: string): Promise<TrelloComment> {
    const body = new URLSearchParams({ text });
    return this.request<TrelloComment>(`/cards/${cardId}/actions/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  }

  // Members

  async assignMember(cardId: string, memberId: string): Promise<void> {
    const body = new URLSearchParams({ value: memberId });
    await this.request(`/cards/${cardId}/idMembers`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  }

  async unassignMember(cardId: string, memberId: string): Promise<void> {
    await this.request(`/cards/${cardId}/idMembers/${memberId}`, {
      method: "DELETE",
    });
  }

  // Attachments

  async getAttachments(cardId: string): Promise<TrelloAttachment[]> {
    return this.request<TrelloAttachment[]>(`/cards/${cardId}/attachments`);
  }

  async addUrlAttachment(cardId: string, url: string, name?: string): Promise<TrelloAttachment> {
    const body = new URLSearchParams({ url });
    if (name) body.set("name", name);
    return this.request<TrelloAttachment>(`/cards/${cardId}/attachments`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  }
}
