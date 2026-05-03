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
		description: '个人博客主站，基于 Astro 和 Tailwind CSS 搭建。',
		tags: ['Astro', 'Tailwind', 'Blog']
	},
	{
		...(await getRepositoryDetails('spotiex/CS336-From-Scratch-Spring2026')),
		name: 'CS336 From Scratch',
		demoLink: 'https://github.com/spotiex/CS336-From-Scratch-Spring2026',
		demoLinkRel: githubRel,
		description: '跟学 CS336 Spring 2026 的笔记、作业与实现记录。',
		tags: ['学习', 'LLM', '课程']
	},
	{
		...(await getRepositoryDetails('spotiex/subscription-manager')),
		name: 'Subscription Manager',
		demoLink: 'https://github.com/spotiex/subscription-manager',
		demoLinkRel: githubRel,
		description: '用于整理订阅服务、配置和到期信息的小工具。',
		tags: ['HTML', 'Tool']
	},
	{
		...(await getRepositoryDetails('spotiex/Shadowrocket-ADBlock-Rules-Forever')),
		name: 'Shadowrocket 规则',
		demoLink: 'https://johnshall.github.io/Shadowrocket-ADBlock-Rules-Forever/',
		demoLinkRel: githubRel,
		description: 'Shadowrocket proxy rules for ad blocking and more, updated regularly.',
		tags: ['学习', '规则', '网络']
	},
	{
		...(await getRepositoryDetails('spotiex/Primitive-Analysis')),
		name: 'Primitive Analysis',
		demoLink: 'https://github.com/spotiex/Primitive-Analysis',
		demoLinkRel: githubRel,
		description: 'Python 分析练习仓库，保存一些还在探索期的想法。',
		tags: ['Python', 'Analysis']
	},
	{
		...(await getRepositoryDetails('spotiex/watermark')),
		name: 'Watermark',
		demoLink: 'https://github.com/spotiex/watermark',
		demoLinkRel: githubRel,
		description: '数字安全治理课程里的水印实验作业。',
		tags: ['Python', '安全', '课程作业']
	},
	{
		...(await getRepositoryDetails('spotiex/spotiex.github.io')),
		name: 'spotiex.github.io',
		demoLink: 'https://github.com/spotiex/spotiex.github.io',
		demoLinkRel: githubRel,
		description: '早期 GitHub Pages 入口，个人主页折腾的起点。',
		tags: ['GitHub Pages', 'HTML']
	}
];
