// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'm0ne';
export const SITE_TAGLINE = '平静的水面之下总是暗流汹涌'; // site tagline
export const SITE_DESCRIPTION = '鼓励每个人积极维护数字时代的个人资产！'; // site meta description for SEO

export interface GalleryItem {
	src: string;
	alt: string;
	title?: string;
	date?: string;
	description?: string;
	tags?: string[];
}

// 首页动态画廊数据（后续可替换为 Cloudflare 图床链接）
export const HOME_GALLERY_ITEMS: GalleryItem[] = [
	{
		src: 'https://img.m0ne.dpdns.org/2026/04/cecf51e2d93a40ef4e44c1583b066058.png',
		alt: 'Yanqi Lake',
		title: '雁栖湖景',
		description: '',
		tags: ['风景']
	},
	{	
		src: 'https://img.m0ne.dpdns.org/2026/04/151f5e4f3fa26d82389dd8b5c1190374.png',
		alt: 'm0ne 在奈良',
		title: '奈良之行',
		description: '24年本科毕业和初中同学的朋友们去了日本，在奈良和小鹿互动',
		tags: ['旅行', '人物']
	},
	{
		src: 'https://img.m0ne.dpdns.org/2026/04/9e16436b9df087b7efafb2d900e62854.JPG',
		alt: '陶然角',
		title: '陶然角',
		description: '',
		tags: ['建筑']
	},
	{
		src: 'https://img.m0ne.dpdns.org/2026/04/1236a8d2be1df5c1f14c5d84dfda1141.JPG',
		alt: '',
		title: '',
		description: '25年北京的第一场雪，去了北海公园，在北海北地铁站口卖烤肠的小哥',
		tags: ['人物']
	},
	{
		src: 'https://img.m0ne.dpdns.org/2026/04/f434feb06198277ce00797876d5198d7.JPG',
		alt: '北海北',
		title: '北海北',
		description: '',
		tags: ['城市']
	},
	{
		src: 'https://img.m0ne.dpdns.org/2026/04/7b7d3953bebe168024fd0ec37d3ceb2b.JPG',
		alt:'雪天穿行',
		title:'雪天穿行',
		description: '25年北京的第一场雪，冬日北京室外出行',
		tags: ['人物', '城市', '冬天']
	},
	{
		src:'https://img.m0ne.dpdns.org/2026/04/132ad550f0f725474fbb1cb973024a59.JPG',
		alt:'砖瓦间穿梭',
		title:'砖瓦穿梭',
		description: '25年北京的第一场雪，在北海北地铁站出口，看到外墙上横行的猫',
		tags: ['建筑']
	},
	{
		src:'https://img.m0ne.dpdns.org/2026/04/e3d9debdb48e2423fb055290dfad0de6.JPG',
		alt:'',
		title:'',
		description: '',
		tags: ['旅行', '动物']
	},
	{
		src: 'https://img.m0ne.dpdns.org/2026/04/80c8660141e2df60a65bbfaf22c9a9ef.JPG',
		alt: 'Churchill',
		title: 'Churchill',
		tags: ['人物'],
		description: '大三去珠江路看国家地理展览时候拍的，模仿了 Victory 的 ✌️'
	},
	{
		src: 'https://img.m0ne.dpdns.org/i/2026/04/27/74grny-7c72.jpg',
		alt: '',
		title: '迎泽大桥',
		description: '26年清明假期去了太原，在迎泽大桥边，和众多游客一起打卡',
		tags: ['旅行', '建筑']
	},
	{
		src: 'https://img.m0ne.dpdns.org/i/2026/04/27/7465s4-bxm8.jpg',
		alt: '',
		title: '上高音',
		description: '25年末第九研究室的年会，和师兄一起唱《我们的歌》，上不去高音强撑中......',
		tags: ['人物', '唱歌']
	},
	{
		src: 'https://img.m0ne.dpdns.org/i/2026/04/27/74bmwa-tc0g.jpg',
		alt: '',
		title: '童趣',
		description: '26年腊月二十七，姨父过生日，大外甥在他的老家，不记得为什么这么开心了',
		tags: ['人物', '童年']
	},
	{
		src: 'https://img.m0ne.dpdns.org/i/2026/04/27/74d8zq-fnzn.jpg',
		alt: '',
		title: '乡村原味',
		description: '26年腊月，在新建起来的农村自建房里，闲适地吃一顿',
		tags: ['食物']
	},
	{
		src: 'https://img.m0ne.dpdns.org/i/2026/04/27/741np1-n6p8.jpg',
		alt: '',
		title: 'm0ne 在八段锦',
		description: '25年末第九研究室的年会，和老师一起表演八段锦，之前和父亲一起练过，觉得这是一项很考验静心的运动',
		tags: ['人物']
	},
	{
		src: 'https://img.m0ne.dpdns.org/i/2026/04/27/74bbaw-b0vz.jpg',
		alt: '',
		title: '小伙伴',
		description: '26年腊月二十七，姨父过生日，小外甥和他家族里的小朋友在一起玩手机',
		tags: ['人物', '童年']
	},
	{
		src: 'https://img.m0ne.dpdns.org/i/2026/04/27/74epgw-qatk.jpg',
		alt: '',
		title: '春日花开',
		description: '',
		tags: ['植物']
	},
	{
		src: 'https://img.m0ne.dpdns.org/i/2026/04/27/74n0mj-7qzc.jpg',
		alt: '海淀公园',
		title: '坠入花丛',
		description: '',
		tags: ['人物']
	},
	{
		src: 'https://img.m0ne.dpdns.org/i/2026/04/27/74dt0a-6n2t.jpg',
		alt: '父与子',
		title: '父与子',
		date: '',
		description: '26年寒假，父亲和爷爷在一起处理老房子剩下来的木头',
		tags: ['人物']
	},
	{
		src: 'https://img.m0ne.dpdns.org/i/2026/04/27/7p6nn7-r1tb.jpg',
		alt: '',
		title: '松花江上',
		date: '2026/01/02',
		description: '松花江四点多的样子',
		tags: ['旅行']
	},
	{
		src: 'https://img.m0ne.dpdns.org/i/2026/04/27/74fywv-sbwt.jpg',
		alt: '',
		title: '倚栏杆',
		date: '2026/04/05',
		description: '北京春天花开了，在国家植物园的湖畔旁边',
		tags: ['人物', '旅行']
	},
	{
		src: 'https://img.m0ne.dpdns.org/i/2026/04/27/7pc1c2-wqpd.jpg',
		alt: '',
		title: '生生不息',
		date: '',
		description: '家楼顶上父亲养的一些好活的玩意儿',
		tags: ['植物']
	}

];
