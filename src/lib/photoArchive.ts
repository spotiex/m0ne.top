import type { GalleryItem } from '../consts';
import { parsePhotoDate } from './photoDate';

export interface PhotoArchiveMonth {
	month: string;
	count: number;
	href: string;
}

export interface PhotoArchiveYear {
	year: string;
	count: number;
	href: string;
	months: PhotoArchiveMonth[];
}

export interface PhotoArchiveEntry {
	year: string;
	month: string;
	day: string;
}

const SRC_DATE_PATTERN = /\/(\d{4})\/(\d{2})\/(\d{2})\//;

export const getPhotoArchiveEntry = (item: Pick<GalleryItem, 'date' | 'src'>): PhotoArchiveEntry | null => {
	const parsedDate = parsePhotoDate(item.date);
	if (parsedDate) {
		return {
			year: String(parsedDate.year),
			month: String(parsedDate.month).padStart(2, '0'),
			day: String(parsedDate.day).padStart(2, '0')
		};
	}

	const srcMatch = item.src.match(SRC_DATE_PATTERN);
	if (!srcMatch) return null;

	return {
		year: srcMatch[1],
		month: srcMatch[2],
		day: srcMatch[3]
	};
};

export const getPhotoArchiveYears = (items: GalleryItem[]): PhotoArchiveYear[] => {
	const yearMap = new Map<string, { count: number; months: Map<string, number> }>();

	for (const item of items) {
		const entry = getPhotoArchiveEntry(item);
		if (!entry) continue;

		const existingYear = yearMap.get(entry.year) ?? {
			count: 0,
			months: new Map<string, number>()
		};
		existingYear.count += 1;
		existingYear.months.set(entry.month, (existingYear.months.get(entry.month) ?? 0) + 1);
		yearMap.set(entry.year, existingYear);
	}

	return [...yearMap.entries()]
		.sort(([left], [right]) => Number(right) - Number(left))
		.map(([year, data]) => ({
			year,
			count: data.count,
			href: `/photos/${year}/`,
			months: [...data.months.entries()]
				.sort(([left], [right]) => Number(right) - Number(left))
				.map(([month, count]) => ({
					month,
					count,
					href: `/photos/${year}/${month}/`
				}))
		}));
};

export const filterPhotosByArchive = (items: GalleryItem[], year?: string, month?: string) =>
	items.filter((item) => {
		const entry = getPhotoArchiveEntry(item);
		if (!entry) return false;
		if (year && entry.year !== year) return false;
		if (month && entry.month !== month) return false;
		return true;
	});
