import { ConversationType } from "../enums/conversation.enums";
import { MessageStatus } from "../enums/message.enum";
import { IUser } from "./user.types";

export interface IConversation {
  conversationId: number;
  type: ConversationType;
  groupName?: string;
  participants: IUser[];
  lastMessage?: IChatMessage;
  unreadCount: number;
  lastMessageAt?: string;
}

export interface IChatMessage {
  id: number;
  sender: IUser;
  content: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  status: MessageStatus;
}

export interface IConversationMessage {
  id: number;
  conversationId: number;
  sender: IUser;
  content: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  status: MessageStatus;
  isPending?: boolean;
  isFailed?: boolean;
}

export interface ConversationQueryParams {
  page?: number;
  size?: number;
}
