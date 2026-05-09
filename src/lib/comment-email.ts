const COMMENT_EMAIL_TO = 'naveen.python143@gmail.com';

type BlogCommentEmailInput = {
  postTitle: string;
  postSlug: string;
  name: string;
  email?: string | null;
  message: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function sendBlogCommentEmail(input: BlogCommentEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'All University <onboarding@resend.dev>';
  const to = process.env.BLOG_COMMENT_EMAIL_TO || COMMENT_EMAIL_TO;

  if (!apiKey) {
    return { sent: false, reason: 'RESEND_API_KEY is not configured' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.alluniversity.org';
  const postUrl = `${siteUrl}/?blog=${encodeURIComponent(input.postSlug)}`;
  const safeName = escapeHtml(input.name);
  const safeEmail = input.email ? escapeHtml(input.email) : 'Not provided';
  const safeTitle = escapeHtml(input.postTitle);
  const safeMessage = escapeHtml(input.message).replace(/\n/g, '<br />');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: `New blog comment: ${input.postTitle}`.slice(0, 120),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <h2>New blog comment</h2>
          <p><strong>Post:</strong> ${safeTitle}</p>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Comment:</strong></p>
          <div style="padding:12px;border-left:4px solid #06b6d4;background:#f8fafc">${safeMessage}</div>
          <p><a href="${postUrl}">Open blog post</a></p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    return { sent: false, reason: await response.text() };
  }

  return { sent: true };
}
