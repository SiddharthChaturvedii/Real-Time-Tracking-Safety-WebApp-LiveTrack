// frontend/lib/types.ts

export interface PartyUser {
  id: string;
  username: string;
}

export interface PartyJoinedPayload {
  partyCode: string;
  users: PartyUser[];
}

export interface LocationPayload {
  id: string;
  username: string;
  latitude: number;
  longitude: number;
}
