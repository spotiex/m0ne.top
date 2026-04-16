// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'm0ne';
export const SITE_TAGLINE = '平静的水面之下总是暗流汹涌'; // site tagline
export const SITE_DESCRIPTION = '鼓励每个人积极维护数字时代的个人资产！'; // site meta description for SEO

export interface GalleryItem {
	src: string;
	alt: string;
	title?: string;
	tags?: string[];
}

// 首页动态画廊数据（后续可替换为 Cloudflare 图床链接）
export const HOME_GALLERY_ITEMS: GalleryItem[] = [
	{
		src: 'https://img.m0ne.dpdns.org/2026/04/cecf51e2d93a40ef4e44c1583b066058.png',
		alt: 'Yanqi Lake',
		title: '雁栖湖景',
		tags: ['风景']
	},
	{	
		src: 'https://img.m0ne.dpdns.org/2026/04/151f5e4f3fa26d82389dd8b5c1190374.png',
		alt: 'm0ne 在奈良',
		title: '奈良之行',
		tags: ['旅行', '人物']
	},
	{
		src: 'https://img.m0ne.dpdns.org/2026/04/9e16436b9df087b7efafb2d900e62854.JPG',
		alt: '陶然角',
		title: '陶然角',
		tags: ['建筑']
	},
	{
		src: 'https://img.m0ne.dpdns.org/2026/04/1236a8d2be1df5c1f14c5d84dfda1141.JPG',
		alt: '',
		title: '',
		tags: ['动物']
	},
	{
		src: 'https://img.m0ne.dpdns.org/2026/04/f434feb06198277ce00797876d5198d7.JPG',
		alt: '北海北',
		title: '北海北',
		tags: ['城市']
	},
	{
		src: 'https://img.m0ne.dpdns.org/2026/04/7b7d3953bebe168024fd0ec37d3ceb2b.JPG',
		alt:'雪天穿行',
		title:'雪天穿行',
		tags: ['人物', '城市', '冬天']
	},
	{
		src:'https://img.m0ne.dpdns.org/2026/04/132ad550f0f725474fbb1cb973024a59.JPG',
		alt:'砖瓦间穿梭',
		title:'砖瓦穿梭',
		tags: ['建筑']
	},
	{
		src:'https://img.m0ne.dpdns.org/2026/04/e3d9debdb48e2423fb055290dfad0de6.JPG',
		alt:'',
		title:'',
		tags: ['旅行', '动物']
	}




];
