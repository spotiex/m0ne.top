const PHOTO_DATE_PATTERN = /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/;

export interface ParsedPhotoDate {
	year: number;
	month: number;
	day: number;
}

export const parsePhotoDate = (value?: string): ParsedPhotoDate | null => {
	if (!value) return null;

	const trimmed = value.trim();
	if (!trimmed) return null;

	const match = trimmed.match(PHOTO_DATE_PATTERN);
	if (!match) return null;

	const [, yearText, monthText, dayText] = match;
	const year = Number(yearText);
	const month = Number(monthText);
	const day = Number(dayText);

	if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;

	const candidate = new Date(year, month - 1, day);
	if (
		candidate.getFullYear() !== year ||
		candidate.getMonth() !== month - 1 ||
		candidate.getDate() !== day
	) {
		return null;
	}

	return { year, month, day };
};

export const normalizePhotoDate = (value?: string) => {
	if (!value) return '';

	const trimmed = value.trim();
	if (!trimmed) return '';

	const parsed = parsePhotoDate(trimmed);
	if (!parsed) return trimmed;

	const month = String(parsed.month).padStart(2, '0');
	const day = String(parsed.day).padStart(2, '0');
	return `${parsed.year}/${month}/${day}`;
};

export const getCurrentPhotoDateParts = (timeZone = 'Asia/Hong_Kong', now = new Date()): ParsedPhotoDate => {
	const formatter = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
	const parts = formatter.formatToParts(now);
	const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

	return {
		year: Number(getPart('year')),
		month: Number(getPart('month')),
		day: Number(getPart('day'))
	};
};

export const getCurrentPhotoDate = (timeZone = 'Asia/Hong_Kong', now = new Date()) => {
	const parts = getCurrentPhotoDateParts(timeZone, now);
	return `${parts.year}/${String(parts.month).padStart(2, '0')}/${String(parts.day).padStart(2, '0')}`;
};

export const formatPhotoDate = (value?: string) => {
	const parsed = parsePhotoDate(value);
	if (!parsed) return value ?? '';

	return `${parsed.year}年${parsed.month}月${parsed.day}日`;
};
