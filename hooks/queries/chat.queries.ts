import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { ConversationService } from '@/lib/api/conversation.service';
import { CONVERSATION_KEY, CONVERSATION_LIST_KEY } from '@/constants/query-keys.constants';
import { IConversation, IConversationMessage } from '@/lib/types/conversation.types';

const PAGE_SIZE = 20;

/**
 * Hook to fetch user conversations with infinite scroll
 * Always fetches fresh data on mount
 */
export const useGetInfiniteConversations = () => {
  return useInfiniteQuery<IConversation[], Error>({
    queryKey: [CONVERSATION_KEY, CONVERSATION_LIST_KEY],
    queryFn: async ({ pageParam = 0 }) => {
      const data = await ConversationService.getUserConversations({
        page: pageParam as number,
        size: PAGE_SIZE,
      });
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      // If last page has less items than PAGE_SIZE, we reached the end
      if (lastPage.length < PAGE_SIZE) {
        return undefined;
      }
      return allPages.length;
    },
    initialPageParam: 0,
    staleTime: 0, // Data is immediately stale
    refetchOnMount: 'always', // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });
};

/**
 * Hook to fetch conversation messages with infinite scroll
 * Always fetches fresh data on mount
 */
export const useGetInfiniteConversationMessages = (conversationId: number | null) => {
  return useInfiniteQuery<IConversationMessage[], Error>({
    queryKey: [CONVERSATION_KEY, 'messages', conversationId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!conversationId) return [];

      const data = await ConversationService.getConversationMessages(conversationId, {
        page: pageParam as number,
        size: PAGE_SIZE,
      });
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) {
        return undefined;
      }
      return allPages.length;
    },
    initialPageParam: 0,
    enabled: !!conversationId,
    staleTime: 0, // Data is immediately stale
    refetchOnMount: 'always', // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });
};

/**
 * Hook to get single conversation details
 * Always fetches fresh data from cache
 */
export const useGetConversation = (conversationId: number | null) => {
  const queryClient = useQueryClient();

  return useQuery<IConversation | undefined, Error>({
    queryKey: [CONVERSATION_KEY, conversationId],
    queryFn: async () => {
      // Try to get from conversations list cache first
      const conversationsData = queryClient.getQueryData<{
        pages: IConversation[][];
        pageParams: number[];
      }>([CONVERSATION_KEY, CONVERSATION_LIST_KEY]);

      if (conversationsData) {
        const allConversations = conversationsData.pages.flat();
        const conversation = allConversations.find((c) => c.conversationId === conversationId);
        if (conversation) {
          return conversation;
        }
      }

      return undefined;
    },
    enabled: !!conversationId,
    staleTime: 0, // Data is immediately stale
    refetchOnMount: 'always', // Always refetch on mount
  });
};
