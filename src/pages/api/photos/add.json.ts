import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';

export const prerender = false;

interface PhotoPayload {
	src: string;
	alt?: string;
	title?: string;
	date?: string;
	description?: string;
	tags?: string[];
}

const CONSTS_FILE = path.join(process.cwd(), 'src', 'consts.ts');
const ARRAY_START = 'export const HOME_GALLERY_ITEMS: GalleryItem[] = [';
const ARRAY_END = '\n];';

const escapeSingleQuoted = (value: string) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const serializePhotoItem = (item: Required<PhotoPayload>) => {
	const lines = [
		'\t{',
		`\t\tsrc: '${escapeSingleQuoted(item.src)}',`,
		`\t\talt: '${escapeSingleQuoted(item.alt)}',`,
		`\t\ttitle: '${escapeSingleQuoted(item.title)}',`,
		`\t\tdate: '${escapeSingleQuoted(item.date)}',`,
		`\t\tdescription: '${escapeSingleQuoted(item.description)}',`,
		`\t\ttags: [${item.tags.map((tag) => `'${escapeSingleQuoted(tag)}'`).join(', ')}]`,
		'\t}'
	];

	return lines.join('\n');
};

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store'
		}
	});

export const POST: APIRoute = async ({ request }) => {
	if (!import.meta.env.DEV) {
		return json({ error: 'This endpoint is only available in local development.' }, 403);
	}

	let payload: PhotoPayload;

	try {
		payload = await request.json();
	} catch {
		return json({ error: 'Invalid JSON payload.' }, 400);
	}

	const src = payload.src?.trim();
	const alt = payload.alt?.trim() ?? '';
	const title = payload.title?.trim() ?? '';
	const date = payload.date?.trim() ?? '';
	const description = payload.description?.trim() ?? '';
	const tags = Array.isArray(payload.tags)
		? payload.tags.map((tag) => tag.trim()).filter(Boolean)
		: [];

	if (!src) {
		return json({ error: 'src is required.' }, 400);
	}

	if (!/^https?:\/\//i.test(src)) {
		return json({ error: 'src must be a valid http(s) URL.' }, 400);
	}

	try {
		const source = await readFile(CONSTS_FILE, 'utf-8');
		const startIndex = source.indexOf(ARRAY_START);
		const endIndex = source.indexOf(ARRAY_END, startIndex);

		if (startIndex === -1 || endIndex === -1) {
			return json({ error: 'Could not locate HOME_GALLERY_ITEMS in consts.ts.' }, 500);
		}

		if (source.includes(`src: '${escapeSingleQuoted(src)}'`)) {
			return json({ error: 'This src already exists in HOME_GALLERY_ITEMS.' }, 409);
		}

		const arrayBodyStart = startIndex + ARRAY_START.length;
		const arrayBody = source.slice(arrayBodyStart, endIndex);
		const trimmedBody = arrayBody.trimEnd();
		const nextItem = serializePhotoItem({ src, alt, title, date, description, tags });
		const separator = trimmedBody.trim().length === 0 ? '\n' : ',\n';
		const nextArrayBody = `${trimmedBody}${separator}${nextItem}\n`;
		const nextSource = `${source.slice(0, arrayBodyStart)}${nextArrayBody}${source.slice(endIndex)}`;

		await writeFile(CONSTS_FILE, nextSource, 'utf-8');

		return json({
			ok: true,
			item: { src, alt, title, date, description, tags }
		});
	} catch (error) {
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to update consts.ts.'
			},
			500
		);
	}
};
