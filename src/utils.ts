const GITHUB_PERSONAL_ACCESS_TOKEN = import.meta.env.GITHUB_PERSONAL_ACCESS_TOKEN ?? '';

export const slugify = (input: string) => {
	if (!input) return '';

	// make lower case and trim
	var slug = input.toLowerCase().trim();

	// remove accents from charaters
	slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

	// replace invalid chars with spaces, while keeping non-Latin letters such as Chinese tags
	slug = slug.replace(/[^\p{Letter}\p{Number}\s-]/gu, ' ').trim();

	// replace multiple spaces or hyphens with a single hyphen
	slug = slug.replace(/[\s-]+/g, '-');

	return slug;
};

export const unslugify = (slug: string) =>
	slug.replace(/\-/g, ' ').replace(/\w\S*/g, (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase());

export const kFormatter = (num: number) => {
	return Math.abs(num) > 999 ? (Math.sign(num) * (Math.abs(num) / 1000)).toFixed(1) + 'k' : Math.sign(num) * Math.abs(num);
};

export const getRepositoryDetails = async (repositoryFullname: string) => {
	const headers: Record<string, string> = {
		'X-GitHub-Api-Version': '2022-11-28'
	};

	if (GITHUB_PERSONAL_ACCESS_TOKEN) {
		headers.Authorization = `Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}`;
	}

	try {
		const repoDetails = await fetch('https://api.github.com/repos/' + repositoryFullname, {
			method: 'GET',
			headers
		});
		if (!repoDetails.ok) throw new Error(`GitHub API responded with ${repoDetails.status}`);
		return await repoDetails.json();
	} catch {
		return {
			full_name: repositoryFullname,
			html_url: `https://github.com/${repositoryFullname}`,
			stargazers_count: 0
		};
	}
};
