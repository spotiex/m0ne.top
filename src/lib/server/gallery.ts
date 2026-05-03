import type { GalleryItem } from '../../consts';
import { getGalleryIndexKey, getR2ObjectText } from './r2';

export const normalizeGalleryItems = (value: unknown): GalleryItem[] => {
	if (!Array.isArray(value)) return [];

	const photos: GalleryItem[] = [];

	for (const item of value) {
		if (!item || typeof item !== 'object') continue;
		const photo = item as Partial<GalleryItem>;
		const src = typeof photo.src === 'string' ? photo.src.trim() : '';
		if (!src) continue;

		photos.push({
			src,
			alt: typeof photo.alt === 'string' ? photo.alt : '',
			title: typeof photo.title === 'string' ? photo.title : '',
			date: typeof photo.date === 'string' ? photo.date : '',
			description: typeof photo.description === 'string' ? photo.description : '',
			tags: Array.isArray(photo.tags) ? photo.tags.map((tag) => String(tag).trim()).filter(Boolean) : []
		});
	}

	return photos;
};

export const getGalleryItems = async () => {
	try {
		const source = await getR2ObjectText(getGalleryIndexKey());
		if (!source) return [];

		return normalizeGalleryItems(JSON.parse(source));
	} catch (error) {
		console.warn('[gallery] Failed to load gallery index from R2:', error);
		return [];
	}
};
