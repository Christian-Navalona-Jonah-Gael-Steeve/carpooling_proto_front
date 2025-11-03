import { CONVERSATION_KEY, CONVERSATION_LIST_KEY } from "@/constants/query-keys.constants";
import { ConversationService } from "@/lib/api/conversation.service";
import { ConversationQueryParams } from "@/lib/types/conversation.types";
import { useQuery } from "@tanstack/react-query";

export const useGetUserConversations = (params?: ConversationQueryParams) => {
    return useQuery({
        queryKey: [CONVERSATION_KEY, CONVERSATION_LIST_KEY, params],
        queryFn: () => ConversationService.getUserConversations(params),
    });
};

export const useGetConversationMessages = (conversationId: number, params?: ConversationQueryParams) => {
    return useQuery({
        queryKey: [CONVERSATION_KEY, 'messages', conversationId, params],
        queryFn: () => ConversationService.getConversationMessages(conversationId, params),
        enabled: !!conversationId,
    });
};
