export interface TrelloLabel {
  id: string;
  name: string;
  color: string | null;
}

export interface TrelloMember {
  id: string;
  fullName: string;
  username: string;
}

export interface TrelloBoard {
  id: string;
  name: string;
  url: string;
  closed: boolean;
}

export interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  pos: number;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  idList: string;
  idBoard: string;
  url: string;
  due: string | null;
  dueComplete: boolean;
  closed: boolean;
  labels: TrelloLabel[];
  idMembers: string[];
  pos: number;
}

export interface TrelloChecklistItem {
  id: string;
  name: string;
  state: "complete" | "incomplete";
  pos: number;
}

export interface TrelloChecklist {
  id: string;
  name: string;
  idCard: string;
  checkItems: TrelloChecklistItem[];
}

export interface TrelloComment {
  id: string;
  date: string;
  memberCreator: { id: string; fullName: string; username: string };
  data: { text: string };
}

export interface TrelloAttachment {
  id: string;
  name: string;
  url: string;
  date: string;
  mimeType: string;
  isUpload: boolean;
}
