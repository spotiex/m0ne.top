import type { APIRoute } from 'astro';
import { isAdminAuthenticated } from '../../../lib/server/adminAuth';
import { isSameOriginRequest, jsonResponse } from '../../../lib/server/apiResponse';
import { renderEditorMarkdown } from '../../../lib/server/editorPreview';

export const prerender = false;

const MAX_PREVIEW_LENGTH = 500_000;

export const POST: APIRoute = async ({ cookies, request, url }) => {
	if (!isAdminAuthenticated(cookies)) return jsonResponse({ error: 'Authentication required.' }, 401);
	if (!isSameOriginRequest(request, url)) return jsonResponse({ error: 'Cross-origin request rejected.' }, 403);

	let body = '';
	try {
		const payload = (await request.json()) as { body?: unknown };
		body = typeof payload.body === 'string' ? payload.body : '';
	} catch {
		return jsonResponse({ error: 'Invalid JSON payload.' }, 400);
	}

	if (body.length > MAX_PREVIEW_LENGTH) return jsonResponse({ error: 'Preview content is too large.' }, 413);

	try {
		return jsonResponse({ html: await renderEditorMarkdown(body) });
	} catch (error) {
		return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to render preview.' }, 400);
	}
};
