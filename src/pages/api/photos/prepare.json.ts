import type { APIRoute } from 'astro';
import { isPhotoAdminAuthenticated } from '../../../lib/server/photoAdminAuth';
import { createBrowserUploadTarget } from '../../../lib/server/r2';

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
	if (!isPhotoAdminAuthenticated(cookies)) {
		return json({ error: 'Authentication required.' }, 401);
	}

	let payload: {
		filename?: string;
		contentType?: string;
	};

	try {
		payload = await request.json();
	} catch {
		return json({ error: 'Invalid JSON payload.' }, 400);
	}

	const filename = String(payload.filename ?? '').trim();
	const contentType = String(payload.contentType ?? '').trim();

	if (!filename) {
		return json({ error: 'filename is required.' }, 400);
	}

	if (!contentType.startsWith('image/')) {
		return json({ error: 'Only image files can be uploaded.' }, 400);
	}

	try {
		const target = createBrowserUploadTarget({
			name: filename,
			type: contentType
		});

		return json({
			ok: true,
			...target
		});
	} catch (error) {
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to prepare image upload.'
			},
			500
		);
	}
};
