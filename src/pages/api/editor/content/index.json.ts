import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPathSlug } from '../../../../lib/editorContent';
import { isAdminAuthenticated } from '../../../../lib/server/adminAuth';
import { jsonResponse } from '../../../../lib/server/apiResponse';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
	if (!isAdminAuthenticated(cookies)) return jsonResponse({ error: 'Authentication required.' }, 401);

	try {
		const [posts, fragments] = await Promise.all([getCollection('blog'), getCollection('fragments')]);
		const items = [
			...posts.flatMap((entry) =>
				entry.filePath
					? [{
							type: 'blog' as const,
							path: entry.filePath,
							sha: '',
							slug: entry.id || getPathSlug(entry.filePath),
							title: entry.data.title,
							description: entry.data.description,
							pubDate: entry.data.pubDate.toISOString().slice(0, 10)
						}]
					: []
			),
			...fragments.flatMap((entry) =>
				entry.filePath
					? [{
							type: 'fragment' as const,
							path: entry.filePath,
							sha: '',
							slug: getPathSlug(entry.filePath),
							title: entry.data.title,
							description: entry.data.description,
							pubDate: entry.data.pubDate.toISOString().slice(0, 10)
						}]
					: []
			)
		]
			.sort((left, right) => right.pubDate.localeCompare(left.pubDate));

		return jsonResponse({ items });
	} catch (error) {
		return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to list content.' }, 502);
	}
};
