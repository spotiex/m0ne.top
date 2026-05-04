import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { autoNewTabExternalLinks } from './src/autoNewTabExternalLinks';

import partytown from '@astrojs/partytown';

const isCloudflare = Boolean(process.env.CF_PAGES);

const adapter = isCloudflare
	? (await import('@astrojs/cloudflare')).default({
			imageService: 'compile',
			platformProxy: { enabled: true }
		})
	: (await import('@astrojs/netlify')).default();

// https://astro.build/config
export default defineConfig({
	site: 'https://m0ne.top',
	integrations: [mdx(), sitemap(), tailwind(), partytown()],
	markdown: {
		extendDefaultPlugins: true,
		rehypePlugins: [
			[
				autoNewTabExternalLinks,
				{
					domain: 'localhost:4321'
				}
			]
		]
	},
	adapter,
	...(isCloudflare && {
		vite: {
			ssr: { external: ['fsevents'] },
			build: { rollupOptions: { external: ['fsevents'] } }
		}
	})
});
