import type { APIRoute } from 'astro';
import { parseEditorDocument } from '../../../../lib/editorContent';
import { isAdminAuthenticated } from '../../../../lib/server/adminAuth';
import { jsonResponse } from '../../../../lib/server/apiResponse';
import { GitHubContentError, readEditableGitHubContent } from '../../../../lib/server/githubContent';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, url }) => {
	if (!isAdminAuthenticated(cookies)) return jsonResponse({ error: 'Authentication required.' }, 401);
	const path = url.searchParams.get('path')?.trim() ?? '';
	if (!path) return jsonResponse({ error: 'path is required.' }, 400);

	try {
		const file = await readEditableGitHubContent(path);
		return jsonResponse({ document: parseEditorDocument(file.content, file.path, file.sha) });
	} catch (error) {
		const status = error instanceof GitHubContentError && error.status < 500 ? error.status : 502;
		return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to read content.' }, status);
	}
};
