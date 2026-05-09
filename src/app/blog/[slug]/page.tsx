import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import { db } from '@/lib/db';
import { siteConfig } from '@/lib/seo';
import { BlogEngagement } from './blog-engagement';

export const dynamic = 'force-dynamic';

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(value);
}

function getTags(tags: string) {
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function getPost(slug: string) {
  return db.blogPost.findFirst({
    where: { slug, isPublished: true, isActive: true },
  });
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: 'Blog Post Not Found',
    };
  }

  const description =
    post.excerpt ||
    post.content
      .replace(/[#*_`>\[\]()]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 155);

  const url = `${siteConfig.url}/blog/${post.slug}`;

  return {
    title: post.title,
    description,
    keywords: getTags(post.tags),
    authors: [{ name: post.author }],
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description,
      url,
      type: 'article',
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author],
      images: post.coverImage
        ? [
            {
              url: post.coverImage,
              alt: post.title,
            },
          ]
        : [{ url: '/logo.svg', alt: siteConfig.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [post.coverImage || '/logo.svg'],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  db.blogPost.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  }).catch((error) => console.error('Error incrementing blog views:', error));

  const tags = getTags(post.tags);
  const comments = await db.blogComment.findMany({
    where: { postId: post.id, isApproved: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  }).catch((error) => {
    console.error('Error loading blog comments:', error);
    return [];
  });
  const postUrl = `${siteConfig.url}/blog/${post.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.coverImage ? [post.coverImage] : [`${siteConfig.url}/logo.svg`],
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.svg`,
      },
    },
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: postUrl,
  };

  return (
    <section className="px-4 py-8 sm:px-6 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-4xl">
        <nav className="mb-6 flex items-center justify-between gap-3 text-xs">
          <Link href="/blog" className="text-cyan-300 hover:text-cyan-200">
            Blog
          </Link>
          <Link href="/" className="text-white/45 hover:text-white">
            Home
          </Link>
        </nav>

        {post.coverImage && (
          <img src={post.coverImage} alt="" loading="eager" decoding="async" className="mb-7 max-h-[420px] w-full rounded-lg object-cover" />
        )}

        <header className="border-b border-white/10 pb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-white/35">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-200">
              {post.category}
            </span>
            <span>{post.readTime} read</span>
            <span>{post.views + 1} views</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-base leading-7 text-white/58">{post.excerpt}</p>}
          <div className="mt-5 flex items-center gap-3 text-xs text-white/35">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/75">
              {post.author.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-white/65">{post.author}</p>
              <p>Published {formatDate(post.createdAt)}</p>
            </div>
          </div>
        </header>

        <div className="mt-7 max-w-none space-y-5 text-[15px] leading-7 text-white/78">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h2 className="mt-8 text-2xl font-bold text-white">{children}</h2>,
              h2: ({ children }) => <h2 className="mt-8 text-xl font-bold text-white">{children}</h2>,
              h3: ({ children }) => <h3 className="mt-6 text-lg font-semibold text-white">{children}</h3>,
              p: ({ children }) => <p className="leading-7 text-white/78">{children}</p>,
              ul: ({ children }) => <ul className="list-disc space-y-2 pl-5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal space-y-2 pl-5">{children}</ol>,
              li: ({ children }) => <li className="leading-7">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-cyan-300/50 pl-4 text-white/62">{children}</blockquote>
              ),
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noreferrer" className="text-cyan-300 underline underline-offset-2">
                  {children}
                </a>
              ),
              code: ({ children }) => (
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-cyan-100">{children}</code>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {tags.length > 0 && (
          <footer className="mt-8 flex flex-wrap gap-2 border-t border-white/10 pt-5">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs text-white/42">
                #{tag}
              </span>
            ))}
          </footer>
        )}

        <BlogEngagement
          postId={post.id}
          initialLikes={post.likes}
          initialComments={comments}
        />

      </article>
    </section>
  );
}
