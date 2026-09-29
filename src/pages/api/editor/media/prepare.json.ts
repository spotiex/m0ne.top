import type { APIRoute } from 'astro';
import { isAdminAuthenticated } from '../../../../lib/server/adminAuth';
import { isSameOriginRequest, jsonResponse } from '../../../../lib/server/apiResponse';
import { createBrowserUploadTarget } from '../../../../lib/server/r2';

export const prerender = false;

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
const PREFIX_PATTERN = /^[a-z0-9]+(?:\/[a-z0-9-]+)*$/;

const getEnv = (name: string) => String(import.meta.env[name] ?? process.env[name] ?? '').trim();

export const POST: APIRoute = async ({ cookies, request, url }) => {
	if (!isAdminAuthenticated(cookies)) return jsonResponse({ error: 'Authentication required.' }, 401);
	if (!isSameOriginRequest(request, url)) return jsonResponse({ error: 'Cross-origin request rejected.' }, 403);

	let filename = '';
	let contentType = '';
	let size = 0;
	try {
		const payload = (await request.json()) as { filename?: unknown; contentType?: unknown; size?: unknown };
		filename = typeof payload.filename === 'string' ? payload.filename.trim() : '';
		contentType = typeof payload.contentType === 'string' ? payload.contentType.trim().toLowerCase() : '';
		size = typeof payload.size === 'number' ? payload.size : 0;
	} catch {
		return jsonResponse({ error: 'Invalid JSON payload.' }, 400);
	}

	if (!filename || filename.length > 255) return jsonResponse({ error: 'A valid filename is required.' }, 400);
	if (!ALLOWED_TYPES.has(contentType)) return jsonResponse({ error: 'Supported uploads are JPEG, PNG, WebP, and GIF.' }, 400);
	if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
		return jsonResponse({ error: 'Image size must be between 1 byte and 30 MB.' }, 400);
	}

	const prefix = getEnv('BLOG_EDITOR_IMAGE_PREFIX') || 'articles';
	if (!PREFIX_PATTERN.test(prefix)) return jsonResponse({ error: 'BLOG_EDITOR_IMAGE_PREFIX is invalid.' }, 500);

	try {
		return jsonResponse({ ok: true, ...createBrowserUploadTarget({ name: filename, type: contentType }, new Date(), prefix) });
	} catch (error) {
		return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to prepare image upload.' }, 500);
	}
};
