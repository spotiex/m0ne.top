import type { APIRoute } from 'astro';
import {
	getEditorContentPath,
	getEditorPublicPath,
	normalizeEditorPublishInput,
	serializeEditorDocument
} from '../../../../lib/editorContent';
import { isAdminAuthenticated } from '../../../../lib/server/adminAuth';
import { isSameOriginRequest, jsonResponse } from '../../../../lib/server/apiResponse';
import { GitHubContentError, writeEditableGitHubContent } from '../../../../lib/server/githubContent';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request, url }) => {
	if (!isAdminAuthenticated(cookies)) return jsonResponse({ error: 'Authentication required.' }, 401);
	if (!isSameOriginRequest(request, url)) return jsonResponse({ error: 'Cross-origin request rejected.' }, 403);

	let input;
	try {
		input = normalizeEditorPublishInput(await request.json());
	} catch (error) {
		return jsonResponse({ error: error instanceof Error ? error.message : 'Invalid publish payload.' }, 400);
	}

	const path = getEditorContentPath(input);
	const mode = input.sha ? 'update' : 'create';
	try {
		const result = await writeEditableGitHubContent({
			path,
			sha: input.sha,
			content: serializeEditorDocument(input),
			message: `${mode === 'create' ? 'publish' : 'update'} ${input.type}: ${input.title}`
		});

		return jsonResponse({
			ok: true,
			mode,
			path,
			sha: result.content?.sha ?? '',
			commitSha: result.commit?.sha ?? '',
			commitUrl: result.commit?.html_url ?? '',
			publicPath: getEditorPublicPath({ ...input, path })
		});
	} catch (error) {
		if (error instanceof GitHubContentError) {
			if (error.status === 409 || error.status === 422) {
				return jsonResponse(
					{ error: input.sha ? 'The file changed after you opened it. Reload it before publishing.' : 'This content path already exists.' },
					409
				);
			}
			return jsonResponse({ error: error.message }, error.status >= 400 && error.status < 600 ? error.status : 502);
		}
		return jsonResponse({ error: error instanceof Error ? error.message : 'Failed to publish content.' }, 502);
	}
};
