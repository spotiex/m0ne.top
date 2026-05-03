import type { APIRoute } from 'astro';
import { clearPhotoAdminSession } from '../../../lib/server/photoAdminAuth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
	clearPhotoAdminSession(cookies);

	return new Response(JSON.stringify({ ok: true }), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store'
		}
	});
};
