import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { getActorAccess } from '@/lib/accessControl';
import { configureCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

async function _POST(request: NextRequest) {
  const accessResult = await getActorAccess(request);
  if (!accessResult.ok) {
    return accessResult.response;
  }

  let cloudinary;
  try {
    cloudinary = configureCloudinary();
  } catch {
    return NextResponse.json(
      { success: false, message: '이미지 업로드 환경이 설정되지 않았습니다.' },
      { status: 503 }
    );
  }

  const form = await request.formData();
  const file = form.get('file');
  const folder = (form.get('folder') as string | null)?.trim() || 'playcard';

  if (!(file instanceof Blob)) {
    return NextResponse.json({ success: false, message: 'file 필드가 없습니다.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ success: false, message: '파일은 5MB 이하만 업로드 가능합니다.' }, { status: 400 });
  }
  const mime = file.type || '';
  if (!ALLOWED_MIME.includes(mime)) {
    return NextResponse.json(
      { success: false, message: 'JPEG/PNG/WebP/GIF 이미지만 업로드 가능합니다.' },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const dataUri = `data:${mime};base64,${buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: 'image',
    overwrite: false
  });

  return NextResponse.json({
    success: true,
    data: {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      format: result.format
    }
  });
}

export const POST = withApiLogging(_POST, '/api/upload/image');
