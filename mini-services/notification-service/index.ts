import { createServer } from 'http';
import { Server } from 'socket.io';
import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const COOLDOWN_FILE = join(tmpdir(), '.notification-cooldown');
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  source: string;
  category: string;
  state: string;
  timestamp: string;
  url?: string;
  universityId?: string;
}

// In-memory notification store
const recentNotifications: NotificationItem[] = [];
const MAX_STORED = 100;

const httpServer = createServer((req, res) => {
  // Handle POST /emit and POST /emit-batch BEFORE socket.io
  if (req.method === 'POST' && req.url === '/emit') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const notification = JSON.parse(body);
        recentNotifications.unshift(notification);
        while (recentNotifications.length > MAX_STORED) recentNotifications.pop();
        io.emit('new-notification', notification);
        console.log(`[NS] /emit: ${notification.title?.slice(0, 60)}`);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: true, broadcast: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/emit-batch') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const notifications = JSON.parse(body);
        if (!Array.isArray(notifications)) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: false, error: 'Expected array' }));
          return;
        }
        for (const n of notifications) {
          recentNotifications.unshift(n);
          io.emit('new-notification', n);
        }
        while (recentNotifications.length > MAX_STORED) recentNotifications.pop();
        console.log(`[NS] /emit-batch: ${notifications.length} notifications`);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: true, broadcast: true, count: notifications.length }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // Let socket.io handle other requests
  res.writeHead(404);
  res.end('Not Found');
});

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function checkCooldown(): boolean {
  try {
    if (existsSync(COOLDOWN_FILE)) {
      const content = readFileSync(COOLDOWN_FILE, 'utf-8');
      const lastRun = parseInt(content, 10);
      if (Date.now() - lastRun < COOLDOWN_MS) {
        return false;
      }
    }
  } catch { /* ignore */ }
  return true;
}

function setCooldown(): void {
  try {
    writeFileSync(COOLDOWN_FILE, Date.now().toString());
  } catch { /* ignore */ }
}

// ══════════════════════════════════════════════════════════════
// BOARD NOTIFICATION QUERIES — All 24 Boards
// ══════════════════════════════════════════════════════════════
const BOARD_QUERIES = [
  // National Boards
  { state: 'National', board: 'CBSE Board', query: 'CBSE board latest notice result 2025' },
  { state: 'National', board: 'CISCE (ICSE/ISC)', query: 'CISCE ICSE ISC board latest notice 2025' },
  { state: 'National', board: 'NIOS Board', query: 'NIOS board latest admission notice 2025' },
  // Bihar
  { state: 'Bihar', board: 'Bihar Board (BSEB)', query: 'Bihar Board BSEB matric inter latest notice result 2025' },
  { state: 'Bihar', board: 'Bihar Open Board', query: 'Bihar Open Board BBOSE latest notice 2025' },
  { state: 'Bihar', board: 'Bihar Sanskrit Board', query: 'Bihar Sanskrit Board latest exam notice 2025' },
  { state: 'Bihar', board: 'Bihar Madrasa Board', query: 'Bihar Madrasa Board BSMEB latest notice 2025' },
  // Haryana
  { state: 'Haryana', board: 'Haryana Board (BSEH)', query: 'Haryana Board BSEH latest notice result 2025' },
  // Delhi
  { state: 'Delhi', board: 'Delhi Board', query: 'Delhi Board secondary education latest notice 2025' },
  // UP
  { state: 'UP', board: 'UP Board (UPMSP)', query: 'UP Board UPMSP high school intermediate latest notice result 2025' },
  { state: 'UP', board: 'UP Sanskrit Board', query: 'UP Sanskrit Board Parishad latest notice 2025' },
  // Other Major States
  { state: 'MP', board: 'MP Board (MPBSE)', query: 'MP Board MPBSE latest notice result 2025' },
  { state: 'Rajasthan', board: 'Rajasthan Board (RBSE)', query: 'Rajasthan Board RBSE latest notice result 2025' },
  { state: 'Gujarat', board: 'Gujarat Board (GSEB)', query: 'Gujarat Board GSEB SSC HSC latest notice 2025' },
  { state: 'Maharashtra', board: 'Maharashtra Board (MSBSHSE)', query: 'Maharashtra Board SSC HSC latest notice result 2025' },
  { state: 'Karnataka', board: 'Karnataka Board (KSEEB)', query: 'Karnataka Board KSEEB SSLC PUC latest notice 2025' },
  { state: 'Tamil Nadu', board: 'Tamil Nadu Board (TNBSE)', query: 'Tamil Nadu Board SSLC HSC latest notice 2025' },
  { state: 'West Bengal', board: 'West Bengal Board (WBBSE)', query: 'West Bengal Board WBBSE madhyamik latest notice 2025' },
  { state: 'Kerala', board: 'Kerala Board (DHSE)', query: 'Kerala Board SSLC HSE DHSE latest notice result 2025' },
  { state: 'Punjab', board: 'Punjab Board (PSEB)', query: 'Punjab Board PSEB latest notice result 2025' },
  { state: 'Telangana', board: 'Telangana Board (BSE)', query: 'Telangana Board SSC intermediate latest notice 2025' },
  { state: 'AP', board: 'AP Board (BIEAP)', query: 'Andhra Pradesh Board BIEAP intermediate latest notice 2025' },
  { state: 'Odisha', board: 'Odisha Board (BSE)', query: 'Odisha Board BSE HSC CHSE latest notice 2025' },
  { state: 'Jharkhand', board: 'Jharkhand Board (JAC)', query: 'Jharkhand Board JAC latest notice result 2025' },
  { state: 'Chhattisgarh', board: 'Chhattisgarh Board (CGBSE)', query: 'Chhattisgarh Board CGBSE latest notice result 2025' },
  { state: 'Uttarakhand', board: 'Uttarakhand Board (UBSE)', query: 'Uttarakhand Board UBSE latest notice result 2025' },
  { state: 'Himachal Pradesh', board: 'Himachal Board (HPBOSE)', query: 'Himachal Pradesh Board HPBOSE latest notice 2025' },
];

// ══════════════════════════════════════════════════════════════
// UNIVERSITY NOTIFICATION QUERIES
// ══════════════════════════════════════════════════════════════
const UNIVERSITY_QUERIES = [
  { state: 'Bihar', query: 'Bihar university latest notice notification 2025' },
  { state: 'Haryana', query: 'Haryana university latest notice notification 2025' },
  { state: 'Delhi', query: 'Delhi university latest notice notification 2025' },
  { state: 'Uttar Pradesh', query: 'Uttar Pradesh university latest notice notification 2025' },
];

function fetchWebSearch(query: string, num: number = 3): any[] {
  try {
    const tmpFile = join(tmpdir(), `.ws-${Date.now()}.json`);
    const args = JSON.stringify({ query, num, recency_days: 3 });
    execSync(
      `z-ai function --name "web_search" --args '${args}' --output "${tmpFile}"`,
      { timeout: 45000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    if (!existsSync(tmpFile)) {
      console.error(`[NS] No output file created`);
      return [];
    }
    const raw = readFileSync(tmpFile, 'utf-8');
    unlinkSync(tmpFile);
    const data = JSON.parse(raw);
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return [];
  } catch (err) {
    console.error(`[NS] Web search error:`, (err as Error).message?.slice(0, 80));
    return [];
  }
}

function detectCategory(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('result') || t.includes('merit') || t.includes('marksheet') || t.includes('topper')) return 'Result';
  if (t.includes('exam') || t.includes('date sheet') || t.includes('schedule') || t.includes('timetable') || t.includes('admit card')) return 'Exam';
  if (t.includes('admission') || t.includes('enrollment') || t.includes('registration') || t.includes('counselling') || t.includes('allotment')) return 'Admission';
  if (t.includes('holiday') || t.includes('vacation') || t.includes('calendar')) return 'Holiday';
  if (t.includes('fee') || t.includes('payment') || t.includes('scholarship')) return 'Fee';
  if (t.includes('recruitment') || t.includes('job') || t.includes('vacancy') || t.includes('walk-in')) return 'Recruitment';
  if (t.includes('tender')) return 'Tender';
  if (t.includes('syllabus') || t.includes('curriculum') || t.includes('pattern')) return 'Syllabus';
  if (t.includes('compartment') || t.includes('re-evaluation') || t.includes('recheck') || t.includes('back paper')) return 'Exam';
  return 'Notification';
}

// ══════════════════════════════════════════════════════════════
// FETCH BOARD NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
async function fetchBoardNotificationsBatch(queries: typeof BOARD_QUERIES): Promise<NotificationItem[]> {
  const notifications: NotificationItem[] = [];
  console.log(`[NS] Fetching ${queries.length} boards in this batch...`);

  for (const { state, board, query } of queries) {
    try {
      const results = fetchWebSearch(query, 2);
      for (const item of results.slice(0, 2)) {
        const title = item.name || 'New Board Notice';
        const snippet = item.snippet || '';
        const source = board;
        notifications.push({
          id: generateId(),
          title: `[${board}] ${title}`,
          message: snippet,
          source: source,
          category: detectCategory(title + ' ' + snippet),
          state: state,
          timestamp: new Date().toISOString(),
          url: item.url,
        });
      }
      console.log(`[NS]   ✓ ${board}`);
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`[NS] Board search error for ${board}:`, err);
    }
  }

  console.log(`[NS] Found ${notifications.length} board notifications in batch`);
  return notifications;
}

// ══════════════════════════════════════════════════════════════
// FETCH UNIVERSITY NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
async function fetchUniversityNotifications(): Promise<NotificationItem[]> {
  const notifications: NotificationItem[] = [];
  console.log(`[NS] Fetching university notifications for 4 states...`);

  for (const { state, query } of UNIVERSITY_QUERIES) {
    try {
      const results = fetchWebSearch(query, 3);
      for (const item of results) {
        const title = item.name || 'New Notice';
        const snippet = item.snippet || '';
        notifications.push({
          id: generateId(),
          title: title,
          message: snippet,
          source: item.domain || '',
          category: detectCategory(title + ' ' + snippet),
          state: state,
          timestamp: new Date().toISOString(),
          url: item.url,
        });
      }
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`[NS] University search error for ${state}:`, err);
    }
  }

  console.log(`[NS] Found ${notifications.length} university notifications`);
  return notifications;
}

// ══════════════════════════════════════════════════════════════
// BACKGROUND FETCH LOOP
// ══════════════════════════════════════════════════════════════
let fetchCycle = 0;
const BOARD_BATCH_SIZE = 8;

async function backgroundFetch() {
  console.log(`[NS] Starting background notification check (cycle ${++fetchCycle})...`);

  if (!checkCooldown()) {
    console.log('[NS] Cooldown active, skipping. Will retry in 60s.');
    setTimeout(backgroundFetch, 60000);
    return;
  }

  try {
    setCooldown();

    // Fetch boards in batches to avoid timeout — rotate through all boards
    const startIdx = ((fetchCycle - 1) * BOARD_BATCH_SIZE) % BOARD_QUERIES.length;
    const endIdx = Math.min(startIdx + BOARD_BATCH_SIZE, BOARD_QUERIES.length);
    const batchQueries = BOARD_QUERIES.slice(startIdx, endIdx);

    console.log(`[NS] Fetching board batch ${startIdx}-${endIdx} of ${BOARD_QUERIES.length} boards...`);
    const boardNotifs = await fetchBoardNotificationsBatch(batchQueries);

    // Always fetch university notifications  
    let uniNotifs: NotificationItem[] = [];
    if (fetchCycle % 2 === 1) {
      uniNotifs = await fetchUniversityNotifications();
    }

    const newNotices = [...boardNotifs, ...uniNotifs];

    if (newNotices.length > 0) {
      console.log(`[NS] Total ${newNotices.length} new notifications to broadcast`);

      for (const notice of newNotices) {
        recentNotifications.unshift(notice);
        io.emit('new-notification', notice);
      }

      while (recentNotifications.length > MAX_STORED) {
        recentNotifications.pop();
      }
    } else {
      console.log('[NS] No new notifications found this cycle');
    }
  } catch (err) {
    console.error('[NS] Background fetch error:', err);
  }

  // Schedule next check in 5 minutes
  setTimeout(backgroundFetch, 5 * 60 * 1000);
}

// ══════════════════════════════════════════════════════════════
// SOCKET.IO CONNECTION HANDLING
// ══════════════════════════════════════════════════════════════
io.on('connection', (socket) => {
  console.log(`[NS] Client connected: ${socket.id}`);

  // Send recent notifications on connect
  socket.emit('recent-notifications', recentNotifications.slice(0, 50));

  socket.on('request-notifications', (data: { state?: string; limit?: number }) => {
    const { state, limit = 50 } = data || {};
    let filtered = recentNotifications;
    if (state && state !== 'all') {
      filtered = filtered.filter(n => n.state === state);
    }
    socket.emit('recent-notifications', filtered.slice(0, limit));
  });

  socket.on('disconnect', () => {
    console.log(`[NS] Client disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`[NS] Socket error (${socket.id}):`, error);
  });
});

const PORT = 3003;
httpServer.listen(PORT, () => {
  console.log(`[NS] Notification WebSocket server running on port ${PORT}`);
  console.log(`[NS] Watching ${BOARD_QUERIES.length} boards + ${UNIVERSITY_QUERIES.length} university feeds`);
  // Start first fetch after 15 seconds
  setTimeout(backgroundFetch, 15000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[NS] Shutting down...');
  httpServer.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[NS] Shutting down...');
  httpServer.close(() => process.exit(0));
});
