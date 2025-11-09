import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  IPrivateMessagePayload,
  MessageStatusPayload,
} from '../types/chat.types';

type MessageHandler = (message: any) => void;

export class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private userId: string | null = null;
  private isConnecting = false;

  // Callbacks
  private onConnectedCallback?: () => void;
  private onDisconnectedCallback?: () => void;
  private onErrorCallback?: (error: any) => void;

  constructor() {
    this.client = null;
  }

  /**
   * Connect to WebSocket server
   * @param wsUrl WebSocket URL (e.g., 'http://192.168.1.1:8080/ws')
   * @param userId Current user ID
   * @param accessToken JWT access token for authentication
   */
  connect(wsUrl: string, userId: string, accessToken?: string, callbacks?: {
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (error: any) => void;
  }): Promise<void> {
    if (this.isConnecting || (this.client && this.client.connected)) {
      console.log('[WebSocket] Already connected or connecting');
      return Promise.resolve();
    }
    this.isConnecting = true;
    this.userId = userId;
    this.onConnectedCallback = callbacks?.onConnected;
    this.onDisconnectedCallback = callbacks?.onDisconnected;
    this.onErrorCallback = callbacks?.onError;

    return new Promise((resolve, reject) => {
      try {
        // Create STOMP client with SockJS
        this.client = new Client({
          webSocketFactory: () => new SockJS(wsUrl),
          connectHeaders: {},
          debug: (str) => {
            console.log('[STOMP Debug]', str);
          },
          reconnectDelay: this.reconnectDelay,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        // Connection success
        this.client.onConnect = () => {
          console.log('[WebSocket] Connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          console.log('trtrt', this.onConnectedCallback)
          if (this.onConnectedCallback) {
            this.onConnectedCallback();
          }

          resolve();
        };

        // Connection error
        this.client.onStompError = (frame) => {
          console.error('[WebSocket] STOMP error:', frame.headers['message']);
          console.error('Details:', frame.body);
          this.isConnecting = false;
          if (this.onErrorCallback) {
            this.onErrorCallback(frame);
          }
          reject(new Error(frame.headers['message']));
        };

        // Web socket error
        this.client.onWebSocketError = (event) => {
          console.error('[WebSocket] WebSocket error:', event);
          this.isConnecting = false;
          if (this.onErrorCallback) {
            this.onErrorCallback(event);
          }
        };

        // Disconnection
        this.client.onDisconnect = () => {
          console.log('[WebSocket] Disconnected');
          if (this.onDisconnectedCallback) {
            this.onDisconnectedCallback();
          }
        };

        // Activate connection
        this.client.activate();
      } catch (error) {
        console.error('[WebSocket] Connection failed:', error);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.client && this.client.connected) {
        // Unsubscribe all
        this.subscriptions.forEach((subscription) => {
          subscription.unsubscribe();
        });
        this.subscriptions.clear();

        this.client.deactivate();
        console.log('[WebSocket] Disconnected');
      }
      this.client = null;
      this.userId = null;
      resolve();
    });
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client?.connected || false;
  }

  /**
   * Send private message
   */
  sendPrivateMessage(message: IPrivateMessagePayload): void {
    if (!this.client || !this.client.connected) {
      console.error('[WebSocket] Cannot send message: not connected');
      throw new Error('WebSocket not connected');
    }

    this.client.publish({
      destination: '/app/private-message',
      body: JSON.stringify(message),
    });

    console.log('[WebSocket] Sent private message:', message.clientId);
  }

  /**
   * Update message status (DELIVERED, READ)
   */
  updateMessageStatus(statusUpdate: MessageStatusPayload): void {
    if (!this.client || !this.client.connected) {
      console.error('[WebSocket] Cannot update status: not connected');
      return;
    }

    this.client.publish({
      destination: '/app/message-status',
      body: JSON.stringify(statusUpdate),
    });

    console.log('[WebSocket] Sent status update:', statusUpdate);
  }

  /**
   * Subscribe to message acknowledgments
   */
  subscribeToAck(handler: MessageHandler): () => void {
    return this.subscribe(`/user/${this.userId}/ack`, handler, 'ack');
  }

  /**
   * Subscribe to private messages
   */
  subscribeToPrivateMessages(handler: MessageHandler): () => void {
    return this.subscribe(`/user/${this.userId}/private`, handler, 'private');
  }

  /**
   * Subscribe to conversation updates
   */
  subscribeToConversationUpdates(handler: MessageHandler): () => void {
    return this.subscribe(`/user/${this.userId}/conversation`, handler, 'conversation');
  }

  /**
   * Subscribe to message status updates
   */
  subscribeToStatusUpdates(handler: MessageHandler): () => void {
    return this.subscribe(`/user/${this.userId}/status`, handler, 'status');
  }

  /**
   * Subscribe to trip topic events
   */
  subscribeToTripEvents(handler: MessageHandler): () => void {
    return this.subscribe(`/topic/trips`, handler, 'trips');
  }

  /**
   * Generic subscribe method
   */
  private subscribe(destination: string, handler: MessageHandler, key: string): () => void {
    if (!this.client || !this.client.connected) {
      console.error('[WebSocket] Cannot subscribe: not connected');
      throw new Error('WebSocket not connected');
    }

    // Unsubscribe if already subscribed
    if (this.subscriptions.has(key)) {
      this.subscriptions.get(key)?.unsubscribe();
    }

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const data = JSON.parse(message.body);
        handler(data);
      } catch (error) {
        console.error(`[WebSocket] Error parsing ${key} message:`, error);
      }
    });

    this.subscriptions.set(key, subscription);
    console.log(`[WebSocket] Subscribed to ${destination}`);

    // Return unsubscribe function
    return () => {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
      console.log(`[WebSocket] Unsubscribed from ${destination}`);
    };
  }
}

export const webSocketService = new WebSocketService();
