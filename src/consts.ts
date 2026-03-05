// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Devolio';
export const SITE_TAGLINE = 'Minimalist Starter for Developer Blog & Portfolio Website'; // site tagline
export const SITE_DESCRIPTION = 'Minimalist Starter for Developer Blog & Portfolio Website'; // site meta description for SEO

export interface GalleryItem {
	src: string;
	alt: string;
	title?: string;
}

// 首页动态画廊数据（后续可替换为 Cloudflare 图床链接）
export const HOME_GALLERY_ITEMS: GalleryItem[] = [
	{
		src: 'https://picsum.photos/seed/m0ne-01/800/520',
		alt: 'Gallery photo 01',
		title: 'Street Light'
	},
	{
		src: 'https://picsum.photos/seed/m0ne-02/800/520',
		alt: 'Gallery photo 02',
		title: 'Silent Shore'
	},
	{
		src: 'https://picsum.photos/seed/m0ne-03/800/520',
		alt: 'Gallery photo 03',
		title: 'Late Afternoon'
	},
	{
		src: 'https://picsum.photos/seed/m0ne-04/800/520',
		alt: 'Gallery photo 04',
		title: 'Old Window'
	},
	{
		src: 'https://picsum.photos/seed/m0ne-05/800/520',
		alt: 'Gallery photo 05',
		title: 'Cloud Layer'
	}
];
