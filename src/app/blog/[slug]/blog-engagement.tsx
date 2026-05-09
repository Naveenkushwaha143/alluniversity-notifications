'use client';

import { useEffect, useState } from 'react';

type BlogComment = {
  id: string;
  postId: string;
  name: string;
  email: string | null;
  message: string;
  createdAt: string | Date;
};

type BlogEngagementProps = {
  postId: string;
  initialLikes: number;
  initialComments: BlogComment[];
};

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function BlogEngagement({ postId, initialLikes, initialComments }: BlogEngagementProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const likedPosts = JSON.parse(localStorage.getItem('likedBlogPosts') || '[]');
      setLiked(Array.isArray(likedPosts) && likedPosts.includes(postId));
    } catch {
      setLiked(false);
    }
  }, [postId]);

  async function handleLike() {
    if (liked) return;

    setError('');
    const previousLikes = likes;
    setLikes((value) => value + 1);
    setLiked(true);

    try {
      const response = await fetch('/api/blog/posts/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Like failed');
      }

      setLikes(Number(data.data.likes || previousLikes + 1));
      const likedPosts = JSON.parse(localStorage.getItem('likedBlogPosts') || '[]');
      const nextLikedPosts = Array.isArray(likedPosts) ? likedPosts : [];
      localStorage.setItem('likedBlogPosts', JSON.stringify([...new Set([...nextLikedPosts, postId])]));
    } catch (err) {
      setLikes(previousLikes);
      setLiked(false);
      setError(err instanceof Error ? err.message : 'Like failed');
    }
  }

  async function handleCommentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    if (!cleanName) {
      setError('Name required');
      return;
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Valid email required');
      return;
    }
    if (cleanMessage.length < 3) {
      setError('Comment too short');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          name: cleanName,
          email: cleanEmail,
          message: cleanMessage,
        }),
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Comment failed');
      }

      setComments((items) => [data.data, ...items]);
      setName('');
      setEmail('');
      setMessage('');
      setNotice('Comment posted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comment failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-9 border-t border-white/10 pt-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Student reactions</h2>
          <p className="mt-1 text-xs text-white/38">{comments.length} comments</p>
        </div>
        <button
          type="button"
          onClick={handleLike}
          disabled={liked}
          className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium transition ${
            liked
              ? 'border-pink-300/25 bg-pink-300/10 text-pink-200'
              : 'border-white/10 bg-white/[0.035] text-white/68 hover:border-pink-300/30 hover:text-pink-200'
          }`}
        >
          <span aria-hidden="true">{liked ? 'Liked' : 'Like'}</span>
          <span>{likes}</span>
        </button>
      </div>

      <form onSubmit={handleCommentSubmit} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            className="h-10 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/35"
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email optional"
            className="h-10 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/35"
          />
        </div>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write a comment..."
          rows={4}
          className="mt-3 w-full resize-y rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-cyan-300/35"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className={`text-xs ${error ? 'text-red-300' : 'text-emerald-300'}`}>{error || notice}</p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-9 items-center justify-center rounded-md bg-cyan-400 px-4 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Posting...' : 'Post comment'}
          </button>
        </div>
      </form>

      <div className="mt-5 space-y-3">
        {comments.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-white/[0.025] p-4 text-sm text-white/38">
            No comments yet.
          </p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white/78">{comment.name}</p>
                <time className="shrink-0 text-[11px] text-white/28">{formatDate(comment.createdAt)}</time>
              </div>
              <p className="whitespace-pre-line text-sm leading-6 text-white/58">{comment.message}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
