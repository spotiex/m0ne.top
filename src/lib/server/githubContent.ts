import { isEditableContentPath } from '../editorContent';

const DEFAULT_REPOSITORY = 'spotiex/m0ne.top';
const DEFAULT_BRANCH = 'master';

const getEnv = (name: string) => String(import.meta.env[name] ?? process.env[name] ?? '').trim();

const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');

const getConfig = () => {
	const repository = getEnv('BLOG_EDITOR_GITHUB_REPOSITORY') || getEnv('GITHUB_REPOSITORY') || DEFAULT_REPOSITORY;
	const [owner, repo, extra] = repository.split('/');
	if (!owner || !repo || extra) throw new Error('BLOG_EDITOR_GITHUB_REPOSITORY must use owner/repository format.');

	return {
		owner,
		repo,
		branch: getEnv('BLOG_EDITOR_GITHUB_BRANCH') || DEFAULT_BRANCH,
		token: getEnv('BLOG_EDITOR_GITHUB_TOKEN')
	};
};

export class GitHubContentError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = 'GitHubContentError';
		this.status = status;
	}
}

const githubRequest = async <T>(path: string, init?: RequestInit) => {
	const config = getConfig();
	const headers = new Headers(init?.headers);
	headers.set('accept', 'application/vnd.github+json');
	headers.set('x-github-api-version', '2022-11-28');
	headers.set('user-agent', 'm0ne-top-mobile-editor');
	if (config.token) headers.set('authorization', `Bearer ${config.token}`);

	const response = await fetch(`https://api.github.com${path}`, { ...init, headers });
	if (!response.ok) {
		let detail = '';
		try {
			const payload = (await response.json()) as { message?: unknown };
			detail = typeof payload.message === 'string' ? payload.message : '';
		} catch {
			// Keep the public error stable when GitHub does not return JSON.
		}
		throw new GitHubContentError(detail || `GitHub request failed with status ${response.status}.`, response.status);
	}

	return (await response.json()) as T;
};

interface GitTreeResponse {
	tree?: Array<{ path?: string; type?: string; sha?: string }>;
	truncated?: boolean;
}

interface GitHubFileResponse {
	type?: string;
	path?: string;
	sha?: string;
	content?: string;
	encoding?: string;
}

interface GitHubWriteResponse {
	content?: { path?: string; sha?: string };
	commit?: { sha?: string; html_url?: string };
}

export const isGitHubPublishingConfigured = () => Boolean(getConfig().token);

export const listEditableGitHubContent = async () => {
	const { owner, repo, branch } = getConfig();
	const tree = await githubRequest<GitTreeResponse>(
		`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`
	);
	if (tree.truncated) throw new Error('The repository tree is too large to list safely.');

	return (tree.tree ?? [])
		.filter((entry) => entry.type === 'blob' && typeof entry.path === 'string' && isEditableContentPath(entry.path))
		.map((entry) => ({ path: entry.path as string, sha: entry.sha ?? '' }))
		.sort((left, right) => right.path.localeCompare(left.path));
};

export const readEditableGitHubContent = async (path: string) => {
	if (!isEditableContentPath(path)) throw new GitHubContentError('Content path is not editable.', 400);
	const { owner, repo, branch } = getConfig();
	const file = await githubRequest<GitHubFileResponse>(
		`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`
	);

	if (file.type !== 'file' || !file.sha || !file.content || file.encoding !== 'base64') {
		throw new GitHubContentError('GitHub did not return an editable file.', 502);
	}

	return {
		path: file.path || path,
		sha: file.sha,
		content: Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf-8')
	};
};

export const writeEditableGitHubContent = async ({
	path,
	content,
	sha,
	message
}: {
	path: string;
	content: string;
	sha?: string;
	message: string;
}) => {
	if (!isEditableContentPath(path)) throw new GitHubContentError('Content path is not editable.', 400);
	const { owner, repo, branch, token } = getConfig();
	if (!token) throw new GitHubContentError('BLOG_EDITOR_GITHUB_TOKEN is not configured.', 503);

	const body: Record<string, string> = {
		message,
		content: Buffer.from(content, 'utf-8').toString('base64'),
		branch
	};
	if (sha) body.sha = sha;

	return githubRequest<GitHubWriteResponse>(
		`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodePath(path)}`,
		{
			method: 'PUT',
			headers: { 'content-type': 'application/json; charset=utf-8' },
			body: JSON.stringify(body)
		}
	);
};
