import crypto from 'crypto';

function getSecret(): string | null {
  const secret = process.env.ADMIN_JWT_SECRET?.trim();
  return secret ? secret : null;
}

function getAdminEmail(): string | null {
  const email = process.env.ADMIN_EMAIL?.trim();
  return email ? email : null;
}

function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  return password && password.length > 0 ? password : null;
}

export function generateToken(email: string): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET is required');
  }

  const payload = JSON.stringify({
    email,
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });

  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(secret, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Format: iv:encrypted
  return iv.toString('hex') + ':' + encrypted;
}

export function verifyToken(token: string): { email: string; iat: number; exp: number } | null {
  try {
    const secret = getSecret();
    if (!secret) return null;

    const parts = token.split(':');
    if (parts.length !== 2) return null;

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const key = crypto.scryptSync(secret, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const payload = JSON.parse(decrypted);

    // Check expiry
    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function validateCredentials(email: string, password: string): boolean {
  const adminEmail = getAdminEmail();
  const adminPassword = getAdminPassword();
  if (!adminEmail || !adminPassword) return false;
  return email === adminEmail && password === adminPassword;
}

export function getTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.split('=');
    if (name.trim() === 'admin_token') {
      try {
        return decodeURIComponent(rest.join('=').trim());
      } catch {
        return rest.join('=').trim();
      }
    }
  }
  return null;
}

export function isAuthenticated(cookieHeader: string | null): boolean {
  const token = getTokenFromCookies(cookieHeader);
  if (!token) return false;
  return verifyToken(token) !== null;
}
