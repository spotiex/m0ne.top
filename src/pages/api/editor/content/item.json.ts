import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isEditableContentPath, parseEditorDocument } from '../../../../lib/editorContent';
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
		if (import.meta.env.DEV && error instanceof GitHubContentError && (error.status === 403 || error.status === 429)) {
			if (!isEditableContentPath(path)) return jsonResponse({ error: 'Content path is not editable.' }, 400);
			try {
				const content = await readFile(resolve(process.cwd(), path), 'utf-8');
				return jsonResponse({
					document: parseEditorDocument(content, path, ''),
					warning: 'GitHub rate limit reached; loaded the local file without a publishable SHA.'
				});
			} catch {
				// Fall through to the original GitHub error.
			}
		}
		const status = error instanceof GitHubContentError && error.status < 500 ? error.status : 502;
		return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to read content.' }, status);
	}
};
