'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import type { CourseDiscussionMessage } from '@/lib/student';
import {
  getTeacherCourseDiscussion,
  postTeacherCourseDiscussionMessage,
} from '@/lib/teacher';

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function TeacherCourseDiscussionPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const courseId = params?.courseId;

  const [threads, setThreads] = useState<CourseDiscussionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [replyForId, setReplyForId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingId, setSubmittingId] = useState<string | 'root' | null>(
    null,
  );

  const loadDiscussion = async () => {
    if (!courseId || typeof courseId !== 'string') return;

    try {
      setLoading(true);
      setError(null);
      const data = await getTeacherCourseDiscussion(courseId);
      setThreads(data);
    } catch {
      setError('Unable to load discussion for this course.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDiscussion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handlePostNew = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!courseId || !newMessage.trim()) return;

    try {
      setSubmittingId('root');
      setError(null);
      await postTeacherCourseDiscussionMessage(courseId, newMessage.trim());
      setNewMessage('');
      await loadDiscussion();
    } catch {
      setError('Unable to post message. Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReplySubmit = async (
    event: React.FormEvent,
    parentId: string,
  ) => {
    event.preventDefault();
    if (!courseId || !replyContent.trim()) return;

    try {
      setSubmittingId(parentId);
      setError(null);
      await postTeacherCourseDiscussionMessage(
        courseId,
        replyContent.trim(),
        parentId,
      );
      setReplyContent('');
      setReplyForId(null);
      await loadDiscussion();
    } catch {
      setError('Unable to post reply. Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  const renderMessage = (message: CourseDiscussionMessage) => {
    return (
      <article
        key={message.id}
        className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            {message.authorInitials}
          </div>
          <div className="flex-1">
            <header className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                {message.authorName}
              </h3>
              <p className="text-xs text-slate-400">
                {formatTime(message.createdAt)} ·{' '}
                <span>{formatDate(message.createdAt)}</span>
              </p>
            </header>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {message.content}
            </p>
            <button
              type="button"
              onClick={() => {
                setReplyForId(
                  replyForId === message.id ? null : message.id,
                );
                setReplyContent('');
              }}
              className="mt-3 text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              Reply
            </button>

            {replyForId === message.id ? (
              <form
                onSubmit={(event) => handleReplySubmit(event, message.id)}
                className="mt-3 space-y-2"
              >
                <textarea
                  value={replyContent}
                  onChange={(event) => setReplyContent(event.target.value)}
                  rows={2}
                  placeholder="Write a reply as the instructor..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={submittingId === message.id}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#163170] disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {submittingId === message.id ? 'Posting...' : 'Post Reply'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyForId(null);
                      setReplyContent('');
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            {message.replies.length > 0 ? (
              <div className="mt-4 space-y-3 border-l border-slate-100 pl-4">
                {message.replies.map((reply) => (
                  <article key={reply.id} className="space-y-1">
                    <div className="flex items-start gap-2">
                      <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-700">
                        {reply.authorInitials}
                      </div>
                      <div className="flex-1">
                        <header className="flex flex-wrap items-baseline justify-between gap-2">
                          <h4 className="text-xs font-semibold text-slate-900">
                            {reply.authorName}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {formatTime(reply.createdAt)} ·{' '}
                            <span>{formatDate(reply.createdAt)}</span>
                          </p>
                        </header>
                        <p className="mt-1 text-xs leading-relaxed text-slate-700">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="self-start text-xs font-semibold text-blue-700 hover:text-blue-900"
        >
          ← Back to My Courses
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Course Discussions
          </h1>
          <p className="text-sm text-slate-500">
            Review and participate in conversations with your students.
          </p>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          Start a new announcement or question
        </h2>
        <form onSubmit={handlePostNew} className="mt-3 space-y-3">
          <textarea
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            rows={3}
            placeholder="Share an update, question, or guidance with your class..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">
              Students enrolled in this course can see and reply to your
              messages.
            </p>
            <button
              type="submit"
              disabled={!newMessage.trim() || submittingId === 'root'}
              className="inline-flex items-center justify-center rounded-2xl bg-[#1B3B8B] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#163170] disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submittingId === 'root' ? 'Posting...' : 'Post Message'}
            </button>
          </div>
        </form>
      </section>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      ) : threads.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No discussion messages yet for this course.
        </p>
      ) : (
        <section className="space-y-4">
          {threads.map((message) => renderMessage(message))}
        </section>
      )}
    </div>
  );
}

