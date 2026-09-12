export const jsonResponse = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store'
		}
	});

export const isSameOriginRequest = (request: Request, url: URL) => {
	const origin = request.headers.get('origin');
	return !origin || origin === url.origin;
};
