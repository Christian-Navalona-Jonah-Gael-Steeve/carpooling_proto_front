import { ConversationQueryParams, IConversation, IConversationMessage } from "../types/conversation.types";
import { api } from "./base/api";

export const ConversationService = {
    /**
     * Get user conversations
     */
    getUserConversations: async (params?: ConversationQueryParams): Promise<IConversation[]> => {
        const response = await api.get<IConversation[]>('/conversations', {
            params: {
                page: params?.page ?? 0,
                size: params?.size ?? 10
            }
        });
        return response.data;
    },

    /**
     * Get conversation messages
     */
    getConversationMessages: async (
        conversationId: number,
        params?: ConversationQueryParams
    ): Promise<IConversationMessage[]> => {
        const response = await api.get<IConversationMessage[]>(`/conversations/${conversationId}/messages`, {
            params: {
                page: params?.page ?? 0,
                size: params?.size ?? 10
            }
        });
        return response.data;
    },

    /**
     * Find existing conversation between current user and another user
     */
    findConversationWith: async (otherUserId: string): Promise<IConversation | null> => {
        try {
            const response = await api.get<IConversation>(`/conversations/with/${otherUserId}`);
            return response.data;
        } catch (error: any) {
            // Return null if conversation not found (404)
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }
};
