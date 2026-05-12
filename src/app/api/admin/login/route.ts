import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, generateToken, verifyToken, getTokenFromCookies } from '@/lib/admin-auth';
import { noStoreHeaders, rateLimit } from '@/lib/api-guard';

// POST /api/admin/login - Login with email/password
export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { key: 'admin:login', limit: 8, windowMs: 15 * 60_000 });
    if (limited) return limited;

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!validateCredentials(email, password)) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = generateToken(email);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { email },
    }, { headers: noStoreHeaders() });

    // Set HTTP-only cookie with 24h expiry
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed', error: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/admin/login - Check if authenticated
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookies(cookieHeader);

    if (!token) {
      return NextResponse.json(
        { success: false, authenticated: false, message: 'No token found' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, authenticated: false, message: 'Token expired or invalid' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: { email: payload.email },
    }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { success: false, authenticated: false, message: 'Auth check failed' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/login - Logout (clear cookie)
export async function DELETE() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear the cookie
    response.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed', error: String(error) },
      { status: 500 }
    );
  }
}
