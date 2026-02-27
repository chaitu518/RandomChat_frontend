export type Gender = 'MALE' | 'FEMALE';
export type Preference = 'MALE' | 'FEMALE' | 'BOTH';

export interface HelloMessage {
  clientId: string;
}

export interface HelloResponse {
  clientId: string;
  sessionId: string;
}

export interface JoinRequest {
  gender: Gender;
  preference: Preference;
}

export interface MatchResponse {
  type: 'MATCHED' | 'PARTNER_LEFT' | 'SEARCHING';
  roomId?: string;
  message?: string;
}

export interface SystemMessage {
  type: 'IDENTITY' | 'ERROR' | 'INFO';
  message: string;
}

export interface ChatMessage {
  senderId?: string;
  message: string;
  type?: 'SYSTEM' | 'USER_LEFT' | 'USER_JOINED';
}

export interface MessageRequest {
  roomId: string;
  message: string;
}

export interface ChatBubble {
  id: string;
  text: string;
  type: 'me' | 'other' | 'system';
  sender?: string;
  timestamp: Date;
}

export interface ConnectionState {
  connected: boolean;
  sessionId: string | null;
  roomId: string | null;
  anonId: string | null;
}
