import { Timestamp } from 'firebase/firestore';

export interface ConversationRecord {
  id: string;
  propertyId: string;
  propertyLocation: string;
  propertyImage?: string;
  buyerId: string;
  sellerId: string;
  buyerDisplayName?: string;
  sellerDisplayName?: string;
  participantIds: string[];
  lastMessage?: string;
  lastMessageSenderId?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface ChatMessageRecord {
  id: string;
  text: string;
  senderId: string;
  senderDisplayName?: string;
  createdAt?: Timestamp | null;
}

export const buildConversationId = (propertyId: string, buyerId: string, sellerId: string) =>
  `${propertyId}__${buyerId}__${sellerId}`;

export const timestampToDate = (value: Timestamp | null | undefined) =>
  value instanceof Timestamp ? value.toDate() : null;
