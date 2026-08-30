import { getRepositoryDetails } from '../utils';
import type { ImageMetadata } from 'astro';
import BlogLogo from '@src/assets/img/favicon.png';
import ProxiesLogo from '@src/assets/img/project-proxies.svg';

export interface Project {
	name: string;
	logo?: ImageMetadata | null | '';
	summary: string;
	demoLink: string;
	tags?: string[];
	description: string;
	postLink?: string;
	demoLinkRel?: string;
	[key: string]: any;
}

const githubRel = 'noopener noreferrer';

export const projects: Project[] = [
	{
		...(await getRepositoryDetails('spotiex/m0ne.top')),
		name: 'm0ne.top',
		logo: BlogLogo,
		summary: 'Astro 个人博客与数字花园',
		demoLink: 'https://m0ne.top',
		demoLinkRel: githubRel,
		description: '记录文章、随笔、照片与个人项目的博客主站，基于 Astro 和 Tailwind CSS 构建，并持续打磨阅读与内容管理体验。',
		tags: ['Astro', 'Tailwind']
	},
	{
		...(await getRepositoryDetails('spotiex/proxies')),
		name: '自建VPS代理配置',
		logo: ProxiesLogo,
		summary: 'Sing-box 与 Clash 代理实践',
		demoLink: 'https://github.com/spotiex/proxies',
		demoLinkRel: githubRel,
		description: '整理自建 VPS 使用的 Sing-box 与 Clash 配置、部署方式和维护经验，兼顾日常连接稳定性与隐私保护。',
		tags: ['VPS', 'Proxy']
	},
	{
		...(await getRepositoryDetails('spotiex/Shadowrocket-ADBlock-Rules-Forever')),
		name: 'Shadowrocket 规则',
		logo: '',
		summary: '长期维护的分流与去广告规则',
		demoLink: 'https://johnshall.github.io/Shadowrocket-ADBlock-Rules-Forever/',
		demoLinkRel: githubRel,
		description: '在开源规则基础上持续整理和维护的 Shadowrocket 规则集，覆盖常用分流、广告拦截与自定义网络场景。',
		tags: ['Network', 'Proxy']
	}
];
