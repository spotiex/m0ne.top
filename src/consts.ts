// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'm0ne';
export const SITE_TAGLINE = '平淡与点滴'; // site tagline
export const SITE_DESCRIPTION = '鼓励每个人积极维护数字时代的个人资产！'; // site meta description for SEO

export interface GalleryItem {
	src: string;
	alt: string;
	title?: string;
}

// 首页动态画廊数据（后续可替换为 Cloudflare 图床链接）
export const HOME_GALLERY_ITEMS: GalleryItem[] = [
	{
		src: 'https://img.m0ne.us.ci/i/2026/03/28/shvhaw-946h.png',
		alt: 'Yanqi Lake',
		title: '雁栖湖景'
	}
];
