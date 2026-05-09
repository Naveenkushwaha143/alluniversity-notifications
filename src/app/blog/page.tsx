import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { siteConfig } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type PublicBlogPost = Awaited<ReturnType<typeof db.blogPost.findMany>>[number] & {
  _count: { comments: number };
};

export const metadata: Metadata = {
  title: 'Student Blog - University Results, Admissions and Exam Guides',
  description:
    'Read helpful student guides about university results, admission forms, admit cards, exam dates, scholarships and latest education updates.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Student Blog - All University',
    description:
      'Helpful guides for university notices, results, admissions, admit cards and exams.',
    url: `${siteConfig.url}/blog`,
    type: 'website',
  },
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

export default async function BlogPage() {
  let posts: PublicBlogPost[] = [];
  let loadError = '';

  try {
    posts = await db.blogPost.findMany({
      where: { isPublished: true, isActive: true },
      include: {
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch (error) {
    console.error('Error loading blog page:', error);
    loadError = 'Blog posts abhi load nahi ho paaye. Page refresh karke dobara try karein.';
  }

  return (
    <section className="px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="text-xs font-medium text-cyan-300 hover:text-cyan-200">
              All University
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Student Blog</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              University results, admission forms, admit cards, exam dates and student guides.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-md border border-white/10 px-3 text-xs text-white/65 hover:bg-white/10 hover:text-white"
          >
            Home
          </Link>
        </header>

        {loadError ? (
          <section className="rounded-lg border border-red-400/20 bg-red-500/10 p-8 text-center">
            <h2 className="text-lg font-semibold text-white">Blog load error</h2>
            <p className="mt-2 text-sm text-white/55">{loadError}</p>
          </section>
        ) : posts.length === 0 ? (
          <section className="rounded-lg border border-white/10 bg-white/[0.03] p-8 text-center">
            <h2 className="text-lg font-semibold">No blog posts published yet</h2>
            <p className="mt-2 text-sm text-white/45">Published blog posts will appear here automatically.</p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.035] transition hover:border-cyan-300/30 hover:bg-white/[0.055]"
              >
                {post.coverImage ? (
                  <img src={post.coverImage} alt="" loading="lazy" decoding="async" className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-32 items-center justify-center bg-[#08111f] text-4xl">AU</div>
                )}
                <article className="p-4">
                  <div className="mb-3 flex items-center gap-2 text-[11px] text-white/35">
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-cyan-200/80">
                      {post.category}
                    </span>
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className="line-clamp-2 text-base font-semibold leading-6 group-hover:text-cyan-200">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/48">{post.excerpt}</p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/30">
                    <span>{formatDate(post.createdAt)}</span>
                    <span>{post.views} views</span>
                    <span>{post.likes} likes</span>
                    <span>{post._count.comments} comments</span>
                  </div>
                </article>
              </Link>
            ))}
          </section>
        )}
      </div>
    </section>
  );
}
