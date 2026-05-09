import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/admin-auth';

export const runtime = 'nodejs';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const MAX_FILE_SIZE = 4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticated(request.headers.get('cookie'))) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: 'File is required' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ success: false, message: 'Only image and PDF files are allowed' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: 'File must be under 4MB' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const url = `data:${file.type};base64,${bytes.toString('base64')}`;

    return NextResponse.json({
      success: true,
      message: file.type === 'application/pdf' ? 'PDF uploaded' : 'Image uploaded',
      url,
      fileName: file.name,
      fileType: file.type,
      kind: file.type === 'application/pdf' ? 'pdf' : 'image',
    });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
}
