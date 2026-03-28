import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { APIRoute } from 'astro';

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });

const sanitizeSegment = (value: string) =>
  value
    .trim()
    .replace(/\\/g, '/')
    .split('/')
    .map((item) => item.trim().replace(/[^a-zA-Z0-9._-]/g, '-'))
    .filter(Boolean)
    .join('/');

const sanitizeFileName = (name: string) => {
  const [base = 'image', ext = ''] = name.split(/\.(?=[^.]+$)/);
  const safeBase = base.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-').slice(0, 80) || 'image';
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
  return safeExt ? `${safeBase}.${safeExt}` : safeBase;
};

const getR2Client = () => {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const accountId = process.env.R2_ACCOUNT_ID;

  if (!accessKeyId || !secretAccessKey || !accountId) {
    throw new Error('Missing R2 credentials');
  }

  return new S3Client({
    region: process.env.R2_REGION || 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });
};

const verifyNetlifyIdentity = async (request: Request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return false;
  }

  const { origin } = new URL(request.url);
  const verifyResponse = await fetch(`${origin}/.netlify/identity/user`, {
    method: 'GET',
    headers: { Authorization: authHeader }
  });

  return verifyResponse.ok;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const bucket = process.env.R2_BUCKET;
    const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/$/, '');
    const maxSizeMb = Number(process.env.R2_MAX_UPLOAD_SIZE_MB || 15);

    if (!bucket || !publicBaseUrl) {
      return json({ error: 'Missing R2 bucket config' }, 500);
    }

    const { hostname } = new URL(request.url);
    const isLocalRequest = hostname === 'localhost' || hostname === '127.0.0.1';

    if (process.env.R2_UPLOAD_BYPASS_AUTH !== '1' && !isLocalRequest) {
      const isAuthorized = await verifyNetlifyIdentity(request);
      if (!isAuthorized) {
        return json({ error: 'Unauthorized' }, 401);
      }
    }

    const form = await request.formData();
    const file = form.get('file');
    const pathInput = String(form.get('path') || '').trim();

    if (!(file instanceof File)) {
      return json({ error: 'Expected "file" in multipart form data' }, 400);
    }

    if (!file.type.startsWith('image/')) {
      return json({ error: 'Only image uploads are allowed' }, 400);
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      return json({ error: `Image too large. Max ${maxSizeMb}MB` }, 413);
    }

    const client = getR2Client();
    const safePath = sanitizeSegment(pathInput || `blog/${new Date().toISOString().slice(0, 7).replace('-', '/')}`);
    const safeName = sanitizeFileName(file.name || 'image');
    const objectKey = `${safePath}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: new Uint8Array(await file.arrayBuffer()),
        ContentType: file.type || 'application/octet-stream',
        CacheControl: 'public, max-age=31536000, immutable'
      })
    );

    return json({
      url: `${publicBaseUrl}/${objectKey}`,
      key: objectKey
    });
  } catch (error) {
    console.error('[r2-upload] failed:', error);
    return json({ error: 'Upload failed' }, 500);
  }
};

export const OPTIONS: APIRoute = async () =>
  new Response(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS'
    }
  });

export const GET: APIRoute = async () =>
  json({ error: 'Method Not Allowed' }, 405);
