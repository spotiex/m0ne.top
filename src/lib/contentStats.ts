import type { CollectionEntry } from 'astro:content';
import type { GalleryItem } from '../consts';

type WrittenEntry = CollectionEntry<'blog'> | CollectionEntry<'fragments'>;

export interface SiteStats {
	postCount: number;
	fragmentCount: number;
	wordCount: number;
	tagCount: number;
	photoCount: number;
	firstPublishedDate?: Date;
}

export const stripMarkdown = (content = '') =>
	content
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`[^`]*`/g, ' ')
		.replace(/!\[.*?\]\(.*?\)/g, ' ')
		.replace(/\[([^\]]+)\]\((.*?)\)/g, '$1')
		.replace(/<[^>]+>/g, ' ')
		.replace(/^#{1,6}\s+/gm, '')
		.replace(/[*_~>-]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

export const countReadableText = (content?: string) => {
	const plainText = stripMarkdown(content);
	const cjkCount = (plainText.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu) || []).length;
	const latinWordCount = (
		plainText
			.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, ' ')
			.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || []
	).length;

	return {
		characterCount: cjkCount + latinWordCount
	};
};

export const formatChineseCount = (value: number) => {
	if (value < 10000) return String(value);

	const wanValue = value / 10000;
	return `${wanValue
		.toFixed(wanValue >= 10 ? 1 : 2)
		.replace(/\.0+$/, '')
		.replace(/(\.\d)0$/, '$1')} 万`;
};

export const buildSiteStats = ({
	posts,
	fragments,
	photos
}: {
	posts: CollectionEntry<'blog'>[];
	fragments: CollectionEntry<'fragments'>[];
	photos: GalleryItem[];
}): SiteStats => {
	const writtenEntries: WrittenEntry[] = [...posts, ...fragments];
	const tagSet = new Set(writtenEntries.flatMap((entry) => entry.data.tags ?? []));
	const firstPublishedDate = writtenEntries.map((entry) => entry.data.pubDate).sort((a, b) => a.valueOf() - b.valueOf())[0];

	return {
		postCount: posts.length,
		fragmentCount: fragments.length,
		wordCount: writtenEntries.reduce((total, entry) => total + countReadableText(entry.body).characterCount, 0),
		tagCount: tagSet.size,
		photoCount: photos.length,
		firstPublishedDate
	};
};
