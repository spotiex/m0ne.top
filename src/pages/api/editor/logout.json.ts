import type { APIRoute } from 'astro';
import { clearAdminSession } from '../../../lib/server/adminAuth';
import { isSameOriginRequest, jsonResponse } from '../../../lib/server/apiResponse';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request, url }) => {
	if (!isSameOriginRequest(request, url)) return jsonResponse({ error: 'Cross-origin request rejected.' }, 403);
	clearAdminSession(cookies);
	return jsonResponse({ ok: true });
};
