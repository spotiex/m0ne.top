import type { APIRoute } from 'astro';
import {
	isPhotoAdminConfigured,
	setPhotoAdminSession,
	verifyPhotoAdminCredentials
} from '../../../lib/server/photoAdminAuth';

export const prerender = false;

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store'
		}
	});

export const POST: APIRoute = async ({ cookies, request }) => {
	if (!isPhotoAdminConfigured()) {
		return json({ error: 'Photo admin credentials are not configured.' }, 503);
	}

	let payload: { username?: unknown; password?: unknown };

	try {
		payload = await request.json();
	} catch {
		return json({ error: 'Invalid JSON payload.' }, 400);
	}

	const username = typeof payload.username === 'string' ? payload.username.trim() : '';
	const password = typeof payload.password === 'string' ? payload.password : '';

	if (!verifyPhotoAdminCredentials(username, password)) {
		return json({ error: 'Invalid username or password.' }, 401);
	}

	setPhotoAdminSession(cookies, username);

	return json({ ok: true });
};
