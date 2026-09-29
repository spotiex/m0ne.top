export type EditorMediaWidth = 'compact' | 'normal' | 'wide';
export type EditorMediaRatio = 'original' | 'landscape' | 'portrait' | 'square';
export type EditorMediaFit = 'cover' | 'contain';
export type EditorMediaColumns = 'auto' | '1' | '2' | '3';

export interface EditorMediaImage {
	src: string;
	alt: string;
	caption: string;
}

export interface EditorMediaBlock {
	kind: 'image' | 'gallery';
	images: EditorMediaImage[];
	width: EditorMediaWidth;
	columns: EditorMediaColumns;
	ratio: EditorMediaRatio;
	fit: EditorMediaFit;
	caption: string;
}

export interface EditorMediaMatch {
	start: number;
	end: number;
	block: EditorMediaBlock;
}

const ATTRIBUTE_PATTERN = /([a-z][a-zA-Z0-9]*)=("(?:\\.|[^"])*"|[^\s}]+)/g;
const IMAGE_PATTERN = /^::image\{(.*)\}$/gm;
const GALLERY_PATTERN = /^:::gallery\{(.*)\}\n([\s\S]*?)\n^:::$/gm;

const readAttributes = (source: string) => {
	const attributes: Record<string, string> = {};
	let match: RegExpExecArray | null;
	while ((match = ATTRIBUTE_PATTERN.exec(source))) {
		try {
			attributes[match[1]] = match[2].startsWith('"') ? JSON.parse(match[2]) : match[2];
		} catch {
			attributes[match[1]] = '';
		}
	}
	return attributes;
};

const attribute = (name: string, value: string) => `${name}=${JSON.stringify(value)}`;

const serializeImage = (image: EditorMediaImage, width?: EditorMediaWidth, ratio?: EditorMediaRatio, fit?: EditorMediaFit) => {
	const attributes = [attribute('src', image.src), attribute('alt', image.alt)];
	if (image.caption) attributes.push(attribute('caption', image.caption));
	if (width) attributes.push(attribute('width', width));
	if (ratio) attributes.push(attribute('ratio', ratio));
	if (fit) attributes.push(attribute('fit', fit));
	return `::image{${attributes.join(' ')}}`;
};

export const serializeEditorMediaBlock = (block: EditorMediaBlock) => {
	if (block.kind === 'image' && block.images.length === 1) {
		return serializeImage(block.images[0], block.width, block.ratio, block.fit);
	}

	const attributes = [
		attribute('columns', block.columns),
		attribute('ratio', block.ratio),
		attribute('fit', block.fit),
		attribute('width', block.width)
	];
	if (block.caption) attributes.push(attribute('caption', block.caption));
	const images = block.images.map((image) => serializeImage(image)).join('\n');
	return `:::gallery{${attributes.join(' ')}}\n${images}\n:::`;
};

const parseImage = (attributesSource: string): EditorMediaImage => {
	const attributes = readAttributes(attributesSource);
	return { src: attributes.src ?? '', alt: attributes.alt ?? '', caption: attributes.caption ?? '' };
};

const containsSelection = (start: number, end: number, selectionStart: number, selectionEnd: number) =>
	selectionStart >= start && selectionEnd <= end;

export const findEditorMediaBlock = (markdown: string, selectionStart: number, selectionEnd = selectionStart): EditorMediaMatch | null => {
	GALLERY_PATTERN.lastIndex = 0;
	let galleryMatch: RegExpExecArray | null;
	while ((galleryMatch = GALLERY_PATTERN.exec(markdown))) {
		const start = galleryMatch.index;
		const end = start + galleryMatch[0].length;
		if (!containsSelection(start, end, selectionStart, selectionEnd)) continue;
		const attributes = readAttributes(galleryMatch[1]);
		IMAGE_PATTERN.lastIndex = 0;
		const images = [...galleryMatch[2].matchAll(IMAGE_PATTERN)].map((match) => parseImage(match[1]));
		return {
			start,
			end,
			block: {
				kind: 'gallery',
				images,
				width: (attributes.width as EditorMediaWidth) || 'wide',
				columns: (attributes.columns as EditorMediaColumns) || 'auto',
				ratio: (attributes.ratio as EditorMediaRatio) || 'original',
				fit: (attributes.fit as EditorMediaFit) || 'contain',
				caption: attributes.caption ?? ''
			}
		};
	}

	IMAGE_PATTERN.lastIndex = 0;
	let imageMatch: RegExpExecArray | null;
	while ((imageMatch = IMAGE_PATTERN.exec(markdown))) {
		const start = imageMatch.index;
		const end = start + imageMatch[0].length;
		if (!containsSelection(start, end, selectionStart, selectionEnd)) continue;
		const attributes = readAttributes(imageMatch[1]);
		return {
			start,
			end,
			block: {
				kind: 'image',
				images: [parseImage(imageMatch[1])],
				width: (attributes.width as EditorMediaWidth) || 'normal',
				columns: '1',
				ratio: (attributes.ratio as EditorMediaRatio) || 'original',
				fit: (attributes.fit as EditorMediaFit) || 'contain',
				caption: ''
			}
		};
	}

	return null;
};
