export interface Chat {
    id: string;
    participantName: string;
    participantType: "driver" | "passenger";
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    rideInfo: string;
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
    isOwn: boolean;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
}