'use client';

import { MessageSquare, SendHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { ErrorAlert } from '@/components/ErrorAlert';
import type {
  LiveClassroomChatConnectionState,
  LiveClassroomChatMessage,
} from '@/features/live-classroom/hooks/useLiveClassroomChat';

type LiveChatPanelProps = {
  messages: LiveClassroomChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  supportsChat: boolean;
  connectionState: LiveClassroomChatConnectionState;
  error: string | null;
  onClearError: () => void;
  onSendMessage: (message: string) => Promise<void>;
};

const getConnectionMeta = (state: LiveClassroomChatConnectionState) => {
  switch (state) {
    case 'connected':
      return {
        label: 'Connected',
        className: 'bg-emerald-50 text-emerald-700',
      };
    case 'connecting':
      return {
        label: 'Connecting',
        className: 'bg-blue-50 text-blue-700',
      };
    case 'disconnected':
      return {
        label: 'Disconnected',
        className: 'bg-amber-50 text-amber-700',
      };
    case 'idle':
    default:
      return {
        label: 'Unavailable',
        className: 'bg-slate-100 text-slate-600',
      };
  }
};

const formatMessageTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Now';
  }

  return parsed.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export function LiveChatPanel({
  messages,
  isLoading,
  isSending,
  supportsChat,
  connectionState,
  error,
  onClearError,
  onSendMessage,
}: LiveChatPanelProps) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const connectionMeta = getConnectionMeta(connectionState);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextMessage = draft.trim();
    if (!nextMessage || !supportsChat || isSending) {
      return;
    }

    await onSendMessage(nextMessage);
    setDraft('');
  };

  return (
    <section className="flex h-full min-h-[32rem] flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Chat</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Classroom conversation</h2>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${connectionMeta.className}`}
        >
          {connectionMeta.label}
        </span>
      </div>

      <div className="px-5 pt-4">
        <ErrorAlert message={error ?? ''} />
        {error ? (
          <button
            type="button"
            onClick={onClearError}
            className="mt-2 text-xs font-semibold text-slate-500 transition hover:text-slate-700"
          >
            Dismiss
          </button>
        ) : null}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Loading classroom chat…
          </div>
        ) : !supportsChat ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm">
              <MessageSquare className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">Chat unavailable</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              This live session does not have an ACS chat thread configured yet.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No chat messages yet. Start the classroom conversation here.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-sm ${
                  message.isMine
                    ? 'bg-[#1B3B8B] text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span>{message.isMine ? 'You' : message.senderDisplayName}</span>
                  <span className={message.isMine ? 'text-white/70' : 'text-slate-400'}>
                    {formatMessageTime(message.createdOn)}
                  </span>
                </div>
                <p
                  className={`mt-2 text-sm leading-6 ${
                    message.isMine ? 'text-white/95' : 'text-slate-700'
                  }`}
                >
                  {message.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-100 px-5 py-4">
        <div className="flex items-end gap-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder={supportsChat ? 'Write a message…' : 'Chat is unavailable'}
            disabled={!supportsChat || isSending}
            className="min-h-[5.25rem] flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!supportsChat || isSending || !draft.trim()}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1B3B8B] text-white shadow-md transition hover:bg-[#17306f] disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label="Send message"
          >
            <SendHorizontal className="h-4 w-4" />
          </button>
        </div>
      </form>
    </section>
  );
}
