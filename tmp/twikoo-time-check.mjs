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

ws.onopen = () => {
	send('Runtime.enable');
	send('Page.enable');

	setTimeout(() => {
		send('Runtime.evaluate', {
			expression: `(() => {
				const times = Array.from(document.querySelectorAll('.twikoo .tk-time time, #tcomment .tk-time time')).map((node) => ({
					text: node.textContent,
					title: node.getAttribute('title'),
					datetime: node.getAttribute('datetime'),
					html: node.outerHTML
				}));

				return {
					count: times.length,
					times,
					hasTwikooRoot: !!document.querySelector('.twikoo') || !!document.querySelector('#tcomment .twikoo'),
					hasCommentList:
						!!document.querySelector('.twikoo .tk-comments') || !!document.querySelector('#tcomment .tk-comments'),
					hasPageLoadFlag: !!window.__twikooPageLoadBound,
					hasObserver: !!window.__twikooTimeObserver,
					hasInterval: !!window.__twikooTimeInterval,
					activeScript: Array.from(document.scripts)
						.map((script) => script.src)
						.find((src) => src.includes('TwikooComments'))
				};
			})()`,
			returnByValue: true
		});
	}, 3500);

	setTimeout(() => {
		ws.close();
	}, 6000);
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
		console.log(JSON.stringify(message.result?.result?.value ?? message.result ?? message));
	}
};

ws.onerror = (error) => {
	console.error('ws-error', error.message || error);
	process.exit(1);
};

ws.onclose = () => {
	process.exit(0);
};
