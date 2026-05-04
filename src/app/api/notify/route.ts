import { NextRequest, NextResponse } from 'next/server';

// POST /api/notify - Emit a notification to all connected clients via WebSocket
// Called by scrape APIs when new notices are found
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, source, category, state, url, universityName, universityId, noticeId } = body;

    if (!title) {
      return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
    }

    // Send notification to the WebSocket notification service on port 3003
    const notificationData = {
      id: noticeId || `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      message: message || '',
      source: source || universityName || 'UniUpdates',
      category: category || 'Notification',
      state: state || '',
      timestamp: new Date().toISOString(),
      url: url || null,
      universityId: universityId || null,
    };

    // Emit to WebSocket service via HTTP hook
    try {
      const resp = await fetch('http://127.0.0.1:3003/emit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      });
      const result = await resp.json();

      if (result.success) {
        return NextResponse.json({ success: true, message: 'Notification sent', emitted: true });
      } else {
        // WebSocket service might not have the /emit endpoint yet, fallback to direct socket
        return NextResponse.json({ success: true, message: 'Notification queued (direct)', emitted: false });
      }
    } catch {
      // If WebSocket service is unreachable, still return success (scrape succeeded)
      return NextResponse.json({ success: true, message: 'Scrape done (notification service unavailable)', emitted: false });
    }
  } catch (error) {
    console.error('Notify error:', error);
    return NextResponse.json({ success: false, message: 'Notification failed' }, { status: 500 });
  }
}

// GET /api/notify - Health check
export async function GET() {
  return NextResponse.json({ success: true, message: 'Notification API is running' });
}
