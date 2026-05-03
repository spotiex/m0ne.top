// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'm0ne';
export const SITE_TAGLINE = '平静的水面之下总是暗流汹涌'; // site tagline
export const SITE_DESCRIPTION = '鼓励每个人积极维护数字时代的个人资产！'; // site meta description for SEO
export const GITHUB_PROFILE_URL = 'https://github.com/spotiex';
export const XIAOHONGSHU_PROFILE_URL = 'https://xhslink.com/m/6xRfxYehIjw';

export interface GalleryItem {
	src: string;
	alt: string;
	title?: string;
	date?: string;
	description?: string;
	tags?: string[];
}
