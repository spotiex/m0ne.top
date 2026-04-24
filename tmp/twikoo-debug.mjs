const wsUrl = process.argv[2];

if (!wsUrl) {
	console.error('Missing websocket url');
	process.exit(1);
}

const ws = new WebSocket(wsUrl);
let id = 0;

const send = (method, params = {}) => {
	ws.send(JSON.stringify({ id: ++id, method, params }));
};

const evaluate = (expression) => {
	send('Runtime.evaluate', {
		expression,
		returnByValue: true
	});
};

ws.onopen = () => {
	send('Runtime.enable');
	send('Page.enable');

	evaluate(`({
		href: location.href,
		readyState: document.readyState,
		hasTwikoo: !!window.twikoo,
		tcommentText: document.querySelector('#tcomment')?.innerText || null,
		scriptSrc: document.querySelector('#twikoo-script')?.src || null
	})`);

	setTimeout(() => {
		evaluate(`({
			hasTwikoo: !!window.twikoo,
			twikooType: typeof window.twikoo,
			tcommentHtml: document.querySelector('#tcomment')?.innerHTML || null,
			tcommentText: document.querySelector('#tcomment')?.innerText || null
		})`);
	}, 1500);

	setTimeout(() => {
		ws.close();
	}, 4000);
};

ws.onmessage = (event) => {
	const message = JSON.parse(event.data);

	if (message.method === 'Runtime.consoleAPICalled') {
		console.log('console', JSON.stringify(message.params));
		return;
	}

	if (message.method === 'Runtime.exceptionThrown') {
		console.log('exception', JSON.stringify(message.params.exceptionDetails));
		return;
	}

	if (message.id) {
		console.log('response', JSON.stringify(message));
	}
};

ws.onerror = (error) => {
	console.error('ws-error', error.message || error);
	process.exit(1);
};

ws.onclose = () => {
	process.exit(0);
};
