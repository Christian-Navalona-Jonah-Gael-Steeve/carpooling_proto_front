import { MessageStatus, MessageUpdateType } from "../enums/message.enum";

export interface IPrivateMessagePayload {
  clientId?: string;
  id?: number;
  conversationId?: number;
  senderId: string;
  recipientId: string;
  content: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  status: MessageStatus;
  isPending?: boolean;
  isFailed?: boolean;
}

export interface MessageAckPayload {
  clientId: string;
  messageId: number;
  conversationId: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface MessageStatusPayload {
  messageId: number;
  conversationId: number;
  status: MessageStatus;
  timestamp: string;
}

export interface ConversationUpdatePayload {
  conversationId: number;
  lastMessage: IPrivateMessagePayload;
  lastMessageAt: string;
  updateType: MessageUpdateType;
}
