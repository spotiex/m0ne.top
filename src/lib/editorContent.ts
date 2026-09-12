export type EditorContentType = 'blog' | 'fragment';

export interface EditorDocument {
	type: EditorContentType;
	path: string;
	sha: string;
	slug: string;
	title: string;
	seoTitle: string;
	description: string;
	pubDate: string;
	updatedDate: string;
	tags: string[];
	coverImage: string;
	location: string;
	weather: string;
	body: string;
}

export interface EditorPublishInput extends Omit<EditorDocument, 'path' | 'sha'> {
	path?: string;
	sha?: string;
}

const BLOG_PREFIX = 'src/content/blog/';
const FRAGMENT_PREFIX = 'src/content/fragments/';
const CONTENT_PATH_PATTERN = /^src\/content\/(blog|fragments)\/([a-zA-Z0-9][a-zA-Z0-9._-]*)\/index\.md$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const parseQuoted = (value: string) => {
	if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
	if (value.startsWith('"') && value.endsWith('"')) {
		try {
			return JSON.parse(value) as string;
		} catch {
			return value.slice(1, -1);
		}
	}
	return value;
};

const parseTags = (value: string) => {
	if (!value.startsWith('[') || !value.endsWith(']')) return [];

	const tags: string[] = [];
	const matcher = /(['"])(.*?)\1/g;
	let match: RegExpExecArray | null;
	while ((match = matcher.exec(value))) {
		const tag = match[2].trim();
		if (tag) tags.push(tag);
	}
	return tags;
};

const parseFrontmatter = (source: string) => {
	const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
	if (!normalized.startsWith('---\n')) throw new Error('Content does not start with YAML frontmatter.');

	const boundary = normalized.indexOf('\n---\n', 4);
	if (boundary === -1) throw new Error('Content frontmatter is not closed.');

	const values = new Map<string, string>();
	for (const line of normalized.slice(4, boundary).split('\n')) {
		if (!line.trim() || line.trimStart().startsWith('#')) continue;
		const separator = line.indexOf(':');
		if (separator <= 0) continue;
		values.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim());
	}

	return {
		getString: (name: string) => parseQuoted(values.get(name) ?? ''),
		getTags: () => parseTags(values.get('tags') ?? ''),
		body: normalized
			.slice(boundary + 5)
			.replace(/^\n+/, '')
			.replace(/\n$/, '')
	};
};

const getTypeFromPath = (path: string): EditorContentType => {
	if (path.startsWith(BLOG_PREFIX)) return 'blog';
	if (path.startsWith(FRAGMENT_PREFIX)) return 'fragment';
	throw new Error('Content path is outside the editable collections.');
};

export const getPathSlug = (path: string) => {
	const match = path.match(CONTENT_PATH_PATTERN);
	if (!match) throw new Error('Content path is not an editable Markdown bundle.');
	return match[2];
};

export const isEditableContentPath = (path: string) => CONTENT_PATH_PATTERN.test(path);

export const parseEditorDocument = (source: string, path: string, sha: string): EditorDocument => {
	const type = getTypeFromPath(path);
	const frontmatter = parseFrontmatter(source);
	const pathSlug = getPathSlug(path);

	return {
		type,
		path,
		sha,
		slug: type === 'blog' ? frontmatter.getString('slug') || pathSlug : pathSlug,
		title: frontmatter.getString('title'),
		seoTitle: frontmatter.getString('seoTitle'),
		description: frontmatter.getString('description'),
		pubDate: frontmatter.getString('pubDate'),
		updatedDate: frontmatter.getString('updatedDate'),
		tags: frontmatter.getTags(),
		coverImage: frontmatter.getString('coverImage'),
		location: frontmatter.getString('location'),
		weather: frontmatter.getString('weather'),
		body: frontmatter.body
	};
};

const isValidDate = (value: string) => {
	if (!DATE_PATTERN.test(value)) return false;
	const [year, month, day] = value.split('-').map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export const normalizeEditorPublishInput = (value: unknown): EditorPublishInput => {
	if (!value || typeof value !== 'object') throw new Error('Invalid publish payload.');
	const input = value as Record<string, unknown>;
	const type = input.type === 'blog' || input.type === 'fragment' ? input.type : null;
	if (!type) throw new Error('Content type must be blog or fragment.');

	const slug = asString(input.slug).toLowerCase();
	const title = asString(input.title);
	const description = asString(input.description);
	const pubDate = asString(input.pubDate);
	const updatedDate = asString(input.updatedDate);
	const body = typeof input.body === 'string' ? input.body.trim() : '';
	const path = asString(input.path);
	const sha = asString(input.sha);
	const tags = Array.isArray(input.tags) ? [...new Set(input.tags.map(asString).filter(Boolean))] : [];

	if (!SLUG_PATTERN.test(slug) || slug.length > 100) {
		throw new Error('Slug must use lowercase letters, numbers, and single hyphens.');
	}
	if (!title || title.length > 200) throw new Error('Title is required and must be at most 200 characters.');
	if (description.length > 500) throw new Error('Description must be at most 500 characters.');
	if (!isValidDate(pubDate)) throw new Error('Publish date must be a valid YYYY-MM-DD date.');
	if (updatedDate && !isValidDate(updatedDate)) throw new Error('Updated date must be a valid YYYY-MM-DD date.');
	if (!body) throw new Error('Body is required.');
	if (tags.some((tag) => tag.length > 50)) throw new Error('Each tag must be at most 50 characters.');

	if (path) {
		if (!isEditableContentPath(path) || getTypeFromPath(path) !== type) throw new Error('Existing path is invalid.');
		if (!sha) throw new Error('The loaded file version is required when updating content.');
	} else if (sha) {
		throw new Error('A file version cannot be supplied without an existing path.');
	}

	return {
		type,
		path: path || undefined,
		sha: sha || undefined,
		slug,
		title,
		seoTitle: asString(input.seoTitle),
		description,
		pubDate,
		updatedDate,
		tags,
		coverImage: asString(input.coverImage),
		location: asString(input.location),
		weather: asString(input.weather),
		body
	};
};

export const getEditorContentPath = (input: EditorPublishInput) => {
	if (input.path) return input.path;
	const collection = input.type === 'blog' ? 'blog' : 'fragments';
	return `src/content/${collection}/${input.slug}/index.md`;
};

const field = (name: string, value: string) => `${name}: ${JSON.stringify(value)}`;

export const serializeEditorDocument = (input: EditorPublishInput) => {
	const lines = ['---', field('title', input.title)];
	if (input.type === 'blog') {
		if (input.seoTitle) lines.push(field('seoTitle', input.seoTitle));
		lines.push(field('slug', input.slug));
	}
	lines.push(field('description', input.description), field('pubDate', input.pubDate));
	if (input.updatedDate) lines.push(field('updatedDate', input.updatedDate));
	lines.push(`tags: ${JSON.stringify(input.tags)}`);
	if (input.type === 'blog' && input.coverImage) lines.push(field('coverImage', input.coverImage));
	if (input.type === 'fragment') {
		if (input.location) lines.push(field('location', input.location));
		if (input.weather) lines.push(field('weather', input.weather));
	}
	lines.push('---', '', input.body.trim(), '');
	return lines.join('\n');
};

export const getEditorPublicPath = (input: Pick<EditorPublishInput, 'type' | 'slug' | 'path'>) => {
	if (input.type === 'blog') return `/${input.slug}/`;
	const slug = input.path ? getPathSlug(input.path) : input.slug;
	return `/fragments/${slug}/`;
};
