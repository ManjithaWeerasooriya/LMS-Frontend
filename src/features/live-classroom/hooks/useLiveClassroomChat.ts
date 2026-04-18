'use client';

import type {
  ChatClient,
  ChatMessage,
  ChatMessageReceivedEvent,
  ChatThreadClient,
} from '@azure/communication-chat';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { LiveClassroomJoinToken } from '@/features/live-classroom/api';
import { getLiveClassroomErrorMessage } from '@/features/live-classroom/api';
import { getParticipantLabel, readCommunicationRawId } from '@/features/live-classroom/utils';

export type LiveClassroomChatConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected';

export type LiveClassroomChatMessage = {
  id: string;
  senderDisplayName: string;
  senderRawId: string;
  content: string;
  createdOn: string;
  type: string;
  isMine: boolean;
};

type UseLiveClassroomChatOptions = {
  joinToken: LiveClassroomJoinToken | null;
};

type UseLiveClassroomChatResult = {
  messages: LiveClassroomChatMessage[];
  isInitializing: boolean;
  isSending: boolean;
  connectionState: LiveClassroomChatConnectionState;
  supportsChat: boolean;
  error: string | null;
  clearError: () => void;
  sendMessage: (message: string) => Promise<void>;
};

type ChatSdkModule = typeof import('@azure/communication-chat');
type CommonSdkModule = typeof import('@azure/communication-common');

const toIsoString = (value: Date | string | null | undefined) => {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const normalizeHistoryMessage = (
  message: ChatMessage,
  ownUserId: string,
): LiveClassroomChatMessage | null => {
  const content = message.content?.message?.trim();
  if (!content) {
    return null;
  }

  const senderRawId = readCommunicationRawId(message.sender);

  return {
    id: message.id,
    senderDisplayName: getParticipantLabel(message.senderDisplayName, 'Participant'),
    senderRawId,
    content,
    createdOn: toIsoString(message.createdOn),
    type: message.type,
    isMine: Boolean(ownUserId && senderRawId === ownUserId),
  };
};

const normalizeRealtimeMessage = (
  event: ChatMessageReceivedEvent,
  ownUserId: string,
): LiveClassroomChatMessage | null => {
  const content = event.message?.trim();
  if (!content) {
    return null;
  }

  const senderRawId = readCommunicationRawId(event.sender);

  return {
    id: event.id,
    senderDisplayName: getParticipantLabel(event.senderDisplayName, 'Participant'),
    senderRawId,
    content,
    createdOn: toIsoString(event.createdOn),
    type: event.type,
    isMine: Boolean(ownUserId && senderRawId === ownUserId),
  };
};

const upsertMessage = (
  current: LiveClassroomChatMessage[],
  nextMessage: LiveClassroomChatMessage,
) => {
  const index = current.findIndex((message) => message.id === nextMessage.id);

  if (index === -1) {
    return [...current, nextMessage].sort(
      (left, right) =>
        new Date(left.createdOn).getTime() - new Date(right.createdOn).getTime(),
    );
  }

  const next = [...current];
  next[index] = nextMessage;
  return next.sort(
    (left, right) =>
      new Date(left.createdOn).getTime() - new Date(right.createdOn).getTime(),
  );
};

export function useLiveClassroomChat({
  joinToken,
}: UseLiveClassroomChatOptions): UseLiveClassroomChatResult {
  const sdkRef = useRef<ChatSdkModule | null>(null);
  const commonSdkRef = useRef<CommonSdkModule | null>(null);
  const clientRef = useRef<ChatClient | null>(null);
  const threadClientRef = useRef<ChatThreadClient | null>(null);
  const disposedRef = useRef(false);

  const [messages, setMessages] = useState<LiveClassroomChatMessage[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [connectionState, setConnectionState] =
    useState<LiveClassroomChatConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const supportsChat = useMemo(
    () => Boolean(joinToken?.token && joinToken?.acsEndpoint && joinToken?.chatThreadId),
    [joinToken],
  );

  const ensureSdkLoaded = useCallback(async () => {
    if (sdkRef.current && commonSdkRef.current) {
      return;
    }

    const [chatSdk, commonSdk] = await Promise.all([
      import('@azure/communication-chat'),
      import('@azure/communication-common'),
    ]);

    sdkRef.current = chatSdk;
    commonSdkRef.current = commonSdk;
  }, []);

  useEffect(() => {
    disposedRef.current = false;

    if (!joinToken) {
      setMessages([]);
      setConnectionState('idle');
      setError(null);
      return;
    }

    const acsEndpoint = joinToken.acsEndpoint;
    const chatThreadId = joinToken.chatThreadId;

    if (!acsEndpoint || !chatThreadId) {
      setMessages([]);
      setConnectionState('idle');
      setError(null);
      return;
    }

    let isMounted = true;

    const initialize = async () => {
      setIsInitializing(true);
      setError(null);
      setConnectionState('connecting');

      try {
        await ensureSdkLoaded();

        if (!sdkRef.current || !commonSdkRef.current) {
          throw new Error('Azure Communication Services chat failed to load.');
        }

        const { ChatClient } = sdkRef.current;
        const { AzureCommunicationTokenCredential } = commonSdkRef.current;
        const credential = new AzureCommunicationTokenCredential(joinToken.token);
        const client = new ChatClient(acsEndpoint, credential);
        const threadClient = client.getChatThreadClient(chatThreadId);

        clientRef.current = client;
        threadClientRef.current = threadClient;

        const history: LiveClassroomChatMessage[] = [];
        let count = 0;
        for await (const message of threadClient.listMessages()) {
          const normalized = normalizeHistoryMessage(message, joinToken.acsUserId);
          if (normalized) {
            history.push(normalized);
          }
          count += 1;
          if (count >= 100) {
            break;
          }
        }

        history.sort(
          (left, right) =>
            new Date(left.createdOn).getTime() - new Date(right.createdOn).getTime(),
        );

        if (isMounted && !disposedRef.current) {
          setMessages(history);
        }

        const handleConnected = () => {
          if (!disposedRef.current) {
            setConnectionState('connected');
          }
        };

        const handleDisconnected = () => {
          if (!disposedRef.current) {
            setConnectionState('disconnected');
          }
        };

        const handleMessageReceived = (event: ChatMessageReceivedEvent) => {
          if (disposedRef.current || event.threadId !== chatThreadId) {
            return;
          }

          const normalized = normalizeRealtimeMessage(event, joinToken.acsUserId);
          if (!normalized) {
            return;
          }

          setMessages((current) => upsertMessage(current, normalized));
        };

        client.on('realTimeNotificationConnected', handleConnected);
        client.on('realTimeNotificationDisconnected', handleDisconnected);
        client.on('chatMessageReceived', handleMessageReceived);

        try {
          await client.startRealtimeNotifications();
          if (isMounted && !disposedRef.current) {
            setConnectionState('connected');
          }
        } catch (notificationError) {
          if (isMounted && !disposedRef.current) {
            setConnectionState('disconnected');
            setError(
              getLiveClassroomErrorMessage(
                notificationError,
                'Realtime chat updates are unavailable right now.',
              ),
            );
          }
        }

        return () => {
          const typedClient = client as unknown as {
            off(event: 'realTimeNotificationConnected', listener: () => void): void;
            off(event: 'realTimeNotificationDisconnected', listener: () => void): void;
            off(
              event: 'chatMessageReceived',
              listener: (event: ChatMessageReceivedEvent) => void,
            ): void;
          };

          typedClient.off('realTimeNotificationConnected', handleConnected);
          typedClient.off('realTimeNotificationDisconnected', handleDisconnected);
          typedClient.off('chatMessageReceived', handleMessageReceived);
        };
      } catch (chatError) {
        if (isMounted && !disposedRef.current) {
          setConnectionState('disconnected');
          setError(
            getLiveClassroomErrorMessage(chatError, 'Unable to load the classroom chat.'),
          );
        }
      } finally {
        if (isMounted && !disposedRef.current) {
          setIsInitializing(false);
        }
      }

      return undefined;
    };

    let removeListeners: (() => void) | undefined;
    void initialize().then((cleanup) => {
      removeListeners = cleanup;
    });

    return () => {
      isMounted = false;
      disposedRef.current = true;
      removeListeners?.();

      const client = clientRef.current;
      clientRef.current = null;
      threadClientRef.current = null;

      if (client) {
        void client.stopRealtimeNotifications().catch(() => undefined);
      }
    };
  }, [ensureSdkLoaded, joinToken]);

  const sendMessage = useCallback(
    async (message: string) => {
      const content = message.trim();
      const threadClient = threadClientRef.current;

      if (!content || !threadClient || !joinToken) {
        return;
      }

      setIsSending(true);
      setError(null);

      try {
        const response = await threadClient.sendMessage(
          { content },
          { senderDisplayName: joinToken.displayName },
        );

        setMessages((current) =>
          upsertMessage(current, {
            id: response.id,
            senderDisplayName: getParticipantLabel(joinToken.displayName, 'You'),
            senderRawId: joinToken.acsUserId,
            content,
            createdOn: new Date().toISOString(),
            type: 'text',
            isMine: true,
          }),
        );
      } catch (sendError) {
        setError(
          getLiveClassroomErrorMessage(sendError, 'Unable to send the classroom message.'),
        );
      } finally {
        setIsSending(false);
      }
    },
    [joinToken],
  );

  return {
    messages,
    isInitializing,
    isSending,
    connectionState,
    supportsChat,
    error,
    clearError,
    sendMessage,
  };
}
