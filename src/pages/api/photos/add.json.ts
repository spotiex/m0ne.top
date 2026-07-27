import type { APIRoute } from 'astro';
import type { GalleryItem } from '../../../consts';
import { getCurrentPhotoDate, normalizePhotoDate, parsePhotoDate } from '../../../lib/photoDate';
import { normalizeGalleryItems } from '../../../lib/server/gallery';
import { isPhotoAdminAuthenticated } from '../../../lib/server/photoAdminAuth';
import { getGalleryIndexKey, getImageObjectPrefix, getR2ObjectText, getR2PublicUrl, putR2Object } from '../../../lib/server/r2';

export const prerender = false;

interface PhotoPayload {
	src: string;
	originalSrc?: string;
	alt?: string;
	title?: string;
	date?: string;
	description?: string;
	tags?: string[];
}

interface PendingUpload {
	key: string;
	body: Buffer;
	contentType: string;
}

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store'
		}
	});

const readGalleryItems = async () => {
	const key = getGalleryIndexKey();
	const source = await getR2ObjectText(key);
	if (!source) return [];

	try {
		return normalizeGalleryItems(JSON.parse(source));
	} catch {
		throw new Error(`${key} is not valid JSON.`);
	}
};

const getFormString = (formData: FormData, name: string) => {
	const value = formData.get(name);
	return typeof value === 'string' ? value.trim() : '';
};

const isValidImageUploadKey = (key: string) => {
	if (!key || key === getGalleryIndexKey()) return false;

	const prefix = getImageObjectPrefix().replace(/^\/+|\/+$/g, '');
	if (prefix && !key.startsWith(`${prefix}/`)) return false;

	return /\.(?:avif|bmp|gif|jpe?g|png|tiff?|webp)$/i.test(key);
};

const readMultipartPayload = async (request: Request) => {
	const formData = await request.formData();
	const image = formData.get('image');
	const uploadKey = getFormString(formData, 'uploadKey');
	const submittedSrc = getFormString(formData, 'src');

	if (!(image instanceof File) || image.size <= 0) {
		throw new Error('image is required.');
	}

	const contentType = image.type || 'application/octet-stream';
	if (!contentType.startsWith('image/')) {
		throw new Error('Only image files can be uploaded.');
	}

	if (!isValidImageUploadKey(uploadKey)) {
		throw new Error('uploadKey is invalid.');
	}

	const src = getR2PublicUrl(uploadKey);
	if (submittedSrc && submittedSrc !== src) {
		throw new Error('src does not match uploadKey.');
	}

	const tags = getFormString(formData, 'tags')
		.split(/[,，]/)
		.map((tag) => tag.trim())
		.filter(Boolean);
	const body = Buffer.from(await image.arrayBuffer());

	return {
		payload: {
			src,
			originalSrc: getFormString(formData, 'originalSrc'),
			alt: getFormString(formData, 'alt'),
			title: getFormString(formData, 'title'),
			date: getFormString(formData, 'date'),
			description: getFormString(formData, 'description'),
			tags
		},
		pendingUpload: {
			key: uploadKey,
			body,
			contentType
		}
	};
};

export const POST: APIRoute = async ({ cookies, request }) => {
	if (!isPhotoAdminAuthenticated(cookies)) {
		return json({ error: 'Authentication required.' }, 401);
	}

	let payload: PhotoPayload;
	let pendingUpload: PendingUpload | null = null;

	try {
		if (request.headers.get('content-type')?.includes('multipart/form-data')) {
			const multipart = await readMultipartPayload(request);
			payload = multipart.payload;
			pendingUpload = multipart.pendingUpload;
		} else {
			payload = await request.json();
		}
	} catch (error) {
		return json(
			{
				error: error instanceof Error ? error.message : 'Invalid payload.'
			},
			400
		);
	}

	const src = payload.src?.trim();
	const originalSrc = payload.originalSrc?.trim() ?? '';
	const alt = payload.alt?.trim() ?? '';
	const title = payload.title?.trim() ?? '';
	const rawDate = payload.date?.trim() ?? '';
	const date = normalizePhotoDate(rawDate) || getCurrentPhotoDate();
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

	if (date && !parsePhotoDate(date)) {
		return json({ error: 'date must use a valid YYYY/MM/DD, YYYY-MM-DD, or YYYY.M.D format.' }, 400);
	}

	try {
		const key = getGalleryIndexKey();
		const photos = await readGalleryItems();
		const editIndex = originalSrc ? photos.findIndex((photo) => photo.src.trim() === originalSrc) : -1;

		if (originalSrc && editIndex === -1) {
			return json({ error: 'Could not find the original gallery item.' }, 404);
		}

		if (photos.some((photo, index) => photo.src.trim() === src && index !== editIndex)) {
			return json({ error: 'This src already exists in gallery index.' }, 409);
		}

		if (pendingUpload) {
			await putR2Object(pendingUpload);
		}

		const item: GalleryItem = { src, alt, title, date, description, tags };
		const nextPhotos = editIndex >= 0
			? photos.map((photo, index) => (index === editIndex ? item : photo))
			: [...photos, item];
		const body = Buffer.from(`${JSON.stringify(nextPhotos, null, 2)}\n`, 'utf-8');

		await putR2Object({
			key,
			body,
			contentType: 'application/json; charset=utf-8'
		});

		return json({
			ok: true,
			mode: editIndex >= 0 ? 'update' : 'create',
			indexKey: key,
			indexUrl: getR2PublicUrl(key),
			item
		});
	} catch (error) {
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to update gallery index.'
			},
			500
		);
	}
};
