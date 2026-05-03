import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import type { GalleryItem } from '@src/consts';
import { projects, type Project } from '@src/data/projects';
import { getGalleryItems } from '@src/lib/server/gallery';
import { slugify } from '@src/utils';

export type TagSectionKey = 'blog' | 'fragments' | 'projects' | 'photos';

export const tagSectionAnchors: Record<TagSectionKey, string> = {
	blog: 'posts',
	fragments: 'fragments',
	projects: 'projects',
	photos: 'photos'
};

export const tagSectionPaths: Record<TagSectionKey, string> = {
	blog: 'posts',
	fragments: 'fragments',
	projects: 'projects',
	photos: 'photos'
};

export interface TagEntry {
	value: string;
	label: string;
	itemCount: number;
}

export interface TagSection {
	key: TagSectionKey;
	title: string;
	description: string;
	tags: TagEntry[];
}

export interface TaggedContent {
	blogPosts: CollectionEntry<'blog'>[];
	fragments: CollectionEntry<'fragments'>[];
	projects: Project[];
	photos: GalleryItem[];
	sections: TagSection[];
	allTags: TagEntry[];
}

const tagSorter = new Intl.Collator(['zh-Hans-CN', 'en'], {
	numeric: true,
	sensitivity: 'base'
});

const sectionMeta: Array<Omit<TagSection, 'tags'>> = [
	{
		key: 'blog',
		title: '文章 / Posts',
		description: '长文、月记、教程中出现过的标签'
	},
	{
		key: 'fragments',
		title: '随笔 / Fragments',
		description: '短随笔、观察和日常片段中出现过的标签'
	},
	{
		key: 'projects',
		title: '捣鼓玩意 / Projects',
		description: '项目、仓库和工具实践中使用的标签'
	},
	{
		key: 'photos',
		title: '随手拍 / Photos',
		description: '照片、旅行和日常图像记录里的标签'
	}
];

export const tagSectionMeta = sectionMeta;

const hasTag = (tags: string[] | undefined, value: string) => (tags ?? []).some((tag) => slugify(tag) === value);

export const getTagHref = (tag: string, sectionKey?: TagSectionKey) => {
	const sectionPath = sectionKey ? `${tagSectionPaths[sectionKey]}/` : '';
	return `/tags/${slugify(tag)}/${sectionPath}`;
};

const addTags = (mappedTags: Record<string, TagEntry>, tags: string[] | undefined) => {
	for (const tag of tags ?? []) {
		const value = slugify(tag);
		if (!value) continue;

		if (mappedTags[value]) {
			mappedTags[value].itemCount += 1;
		} else {
			mappedTags[value] = {
				value,
				label: tag,
				itemCount: 1
			};
		}
	}
};

const toSortedTags = (mappedTags: Record<string, TagEntry>) =>
	Object.values(mappedTags).sort((a, b) => tagSorter.compare(a.label, b.label));

const mergeAllTags = (sections: TagSection[]) => {
	const mappedTags: Record<string, TagEntry> = {};

	for (const section of sections) {
		for (const tag of section.tags) {
			if (mappedTags[tag.value]) {
				mappedTags[tag.value].itemCount += tag.itemCount;
			} else {
				mappedTags[tag.value] = { ...tag };
			}
		}
	}

	return toSortedTags(mappedTags);
};

export const getTaggedContent = async (tagValue?: string): Promise<TaggedContent> => {
	const blogPosts = (await getCollection('blog')).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
	const fragments = (await getCollection('fragments')).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
	const galleryItems = await getGalleryItems();

	const blogTags: Record<string, TagEntry> = {};
	const fragmentTags: Record<string, TagEntry> = {};
	const projectTags: Record<string, TagEntry> = {};
	const photoTags: Record<string, TagEntry> = {};

	for (const post of blogPosts) addTags(blogTags, post.data.tags);
	for (const fragment of fragments) addTags(fragmentTags, fragment.data.tags);
	for (const project of projects) addTags(projectTags, project.tags);
	for (const photo of galleryItems) addTags(photoTags, photo.tags);

	const sections: TagSection[] = sectionMeta.map((section) => ({
		...section,
		tags:
			section.key === 'blog'
				? toSortedTags(blogTags)
				: section.key === 'fragments'
					? toSortedTags(fragmentTags)
					: section.key === 'projects'
						? toSortedTags(projectTags)
						: toSortedTags(photoTags)
	}));

		return {
			blogPosts: tagValue ? blogPosts.filter((post) => hasTag(post.data.tags, tagValue)) : blogPosts,
			fragments: tagValue ? fragments.filter((fragment) => hasTag(fragment.data.tags, tagValue)) : fragments,
			projects: tagValue ? projects.filter((project) => hasTag(project.tags, tagValue)) : projects,
			photos: tagValue ? galleryItems.filter((photo) => hasTag(photo.tags, tagValue)) : galleryItems,
			sections,
			allTags: mergeAllTags(sections)
		};
};
