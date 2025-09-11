import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useReducer,
} from "react";
import { Chat, Message } from "../../lib/types/chat.types";

interface ChatState {
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  selectedChatId: string | null;
  isLoading: boolean;
  error: string | null;
}

type ChatAction =
  | { type: "SET_CHATS"; payload: Chat[] }
  | { type: "SET_MESSAGES"; payload: { chatId: string; messages: Message[] } }
  | { type: "ADD_MESSAGE"; payload: { chatId: string; message: Message } }
  | { type: "SELECT_CHAT"; payload: string | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | {
      type: "UPDATE_CHAT_LAST_MESSAGE";
      payload: { chatId: string; message: string; timestamp: string };
    };

const initialState: ChatState = {
  chats: [],
  messages: {},
  selectedChatId: null,
  isLoading: false,
  error: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_CHATS":
      return { ...state, chats: action.payload };

    case "SET_MESSAGES":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: action.payload.messages,
        },
      };

    case "ADD_MESSAGE":
      const existingMessages = state.messages[action.payload.chatId] || [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: [
            ...existingMessages,
            action.payload.message,
          ],
        },
      };

    case "SELECT_CHAT":
      return { ...state, selectedChatId: action.payload };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "UPDATE_CHAT_LAST_MESSAGE":
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.payload.chatId
            ? {
                ...chat,
                lastMessage: action.payload.message,
                lastMessageTime: action.payload.timestamp,
              }
            : chat
        ),
      };

    default:
      return state;
  }
}

interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  selectChat: (chatId: string | null) => void;
  sendMessage: (chatId: string, text: string) => void;
  loadChats: () => void;
  loadMessages: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const loadMessages = useCallback((chatId: string) => {
    const mockMessages: Message[] = [
      {
        id: "1",
        senderId: "1",
        text: "Hi! I'm on my way to pick you up",
        timestamp: "14:25",
        isOwn: false,
      },
      {
        id: "2",
        senderId: "me",
        text: "Great! I'm waiting at the entrance",
        timestamp: "14:26",
        isOwn: true,
      },
      {
        id: "3",
        senderId: "1",
        text: "I'll be there in 5 minutes",
        timestamp: "14:28",
        isOwn: false,
      },
    ];

    dispatch({
      type: "SET_MESSAGES",
      payload: { chatId, messages: mockMessages },
    });
  }, []);

  const selectChat = useCallback(
    (chatId: string | null) => {
      dispatch({ type: "SELECT_CHAT", payload: chatId });
      if (chatId) {
        loadMessages(chatId);
      }
    },
    [loadMessages]
  );

  const sendMessage = useCallback((chatId: string, text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "me",
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOwn: true,
    };

    dispatch({ type: "ADD_MESSAGE", payload: { chatId, message: newMessage } });
    dispatch({
      type: "UPDATE_CHAT_LAST_MESSAGE",
      payload: {
        chatId,
        message: text,
        timestamp: "now",
      },
    });
  }, []);

  const loadChats = useCallback(() => {
    const mockChats: Chat[] = [
      {
        id: "1",
        participantName: "Sarah Johnson",
        participantType: "driver",
        lastMessage: "I'll be there in 5 minutes",
        lastMessageTime: "2m ago",
        unreadCount: 2,
        rideInfo: "Downtown → Airport",
      },
      {
        id: "2",
        participantName: "Mike Chen",
        participantType: "passenger",
        lastMessage: "Thanks for the ride!",
        lastMessageTime: "1h ago",
        unreadCount: 0,
        rideInfo: "University → Mall",
      },
      {
        id: "3",
        participantName: "Lisa Wang",
        participantType: "driver",
        lastMessage: "Meet you at the entrance",
        lastMessageTime: "3h ago",
        unreadCount: 1,
        rideInfo: "Business District → Home",
      },
    ];

    dispatch({ type: "SET_CHATS", payload: mockChats });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        state,
        dispatch,
        selectChat,
        sendMessage,
        loadChats,
        loadMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
