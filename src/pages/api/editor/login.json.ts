import type { APIRoute } from 'astro';
import { isAdminConfigured, setAdminSession, verifyAdminCredentials } from '../../../lib/server/adminAuth';
import { isSameOriginRequest, jsonResponse } from '../../../lib/server/apiResponse';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request, url }) => {
	if (!isSameOriginRequest(request, url)) return jsonResponse({ error: 'Cross-origin request rejected.' }, 403);
	if (!isAdminConfigured()) return jsonResponse({ error: 'Blog admin credentials are not configured.' }, 503);

	let payload: { username?: unknown; password?: unknown };
	try {
		payload = await request.json();
	} catch {
		return jsonResponse({ error: 'Invalid JSON payload.' }, 400);
	}

	const username = typeof payload.username === 'string' ? payload.username.trim() : '';
	const password = typeof payload.password === 'string' ? payload.password : '';
	if (!verifyAdminCredentials(username, password)) {
		return jsonResponse({ error: 'Invalid username or password.' }, 401);
	}

	setAdminSession(cookies, username);
	return jsonResponse({ ok: true });
};
