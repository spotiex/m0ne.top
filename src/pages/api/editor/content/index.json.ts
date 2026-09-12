import type { APIRoute } from 'astro';
import { getPathSlug } from '../../../../lib/editorContent';
import { isAdminAuthenticated } from '../../../../lib/server/adminAuth';
import { jsonResponse } from '../../../../lib/server/apiResponse';
import { listEditableGitHubContent } from '../../../../lib/server/githubContent';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
	if (!isAdminAuthenticated(cookies)) return jsonResponse({ error: 'Authentication required.' }, 401);

	try {
		const files = await listEditableGitHubContent();
		const items = files.map(({ path, sha }) => {
			const slug = getPathSlug(path);
			return {
				type: path.includes('/fragments/') ? 'fragment' : 'blog',
				path,
				sha,
				slug,
				title: slug,
				description: '',
				pubDate: /^\d{4}-\d{2}-\d{2}/.test(slug) ? slug.slice(0, 10) : ''
			};
		});

		return jsonResponse({ items });
	} catch (error) {
		return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to list content.' }, 502);
	}
};
