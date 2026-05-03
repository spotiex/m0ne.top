import { getRepositoryDetails } from '../utils';

export interface Project {
	name: string;
	demoLink: string;
	tags?: string[];
	description?: string;
	postLink?: string;
	demoLinkRel?: string;
	[key: string]: any;
}

const githubRel = 'noopener noreferrer';

export const projects: Project[] = [
	{
		...(await getRepositoryDetails('spotiex/m0ne.top')),
		name: 'm0ne.top',
		demoLink: 'https://m0ne.top',
		demoLinkRel: githubRel,
		description: '个人博客主站，基于 Astro 和 Tailwind CSS 搭建',
		tags: ['Astro', 'Tailwind']
	},
	{
		...(await getRepositoryDetails('spotiex/proxies')),
		name: '自建VPS代理配置',
		demoLink: 'https://github.com/spotiex/proxies',
		demoLinkRel: githubRel,
		description: '基于 Sing-box 和 Clash 的自建VPS代理配置，适合科学上网和隐私保护',
		tags: ['VPS', 'Proxy']
	},
	{
		...(await getRepositoryDetails('spotiex/Shadowrocket-ADBlock-Rules-Forever')),
		name: 'Shadowrocket 规则',
		demoLink: 'https://johnshall.github.io/Shadowrocket-ADBlock-Rules-Forever/',
		demoLinkRel: githubRel,
		description: '基于开源规则和自定义规则的 Shadowrocket 规则集',
		tags: ['Network', 'Proxy']
	},
];
