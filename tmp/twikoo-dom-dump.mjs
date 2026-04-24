const wsUrl = process.argv[2];

if (!wsUrl) {
	console.error('Missing websocket url');
	process.exit(1);
}

const ws = new WebSocket(wsUrl);
let id = 0;
let pendingEvaluate = false;

const send = (method, params = {}) => {
	console.log('send', method);
	ws.send(JSON.stringify({ id: ++id, method, params }));
};

ws.onopen = () => {
	console.log('opened', wsUrl);
	send('Runtime.enable');
	send('Page.enable');

	setTimeout(() => {
		pendingEvaluate = true;
		send('Runtime.evaluate', {
			expression: `(() => {
				const container = document.querySelector('.twikoo') || document.querySelector('#tcomment');
				const timeNodes = Array.from(document.querySelectorAll('.twikoo .tk-time, .twikoo .tk-time time, #tcomment .tk-time, #tcomment .tk-time time')).map((node) => ({
					tag: node.tagName,
					html: node.outerHTML,
					text: node.textContent,
					title: node.getAttribute('title'),
					datetime: node.getAttribute('datetime'),
					className: node.getAttribute('class')
				}));
				return {
					hasContainer: !!container,
					hasTwikoo: !!window.twikoo,
					timeNodes,
					containerHtml: container ? container.outerHTML : null
				};
			})()`,
			returnByValue: true
		});
	}, 5000);

	setTimeout(() => {
		console.log('timeout-close');
		ws.close();
	}, 12000);
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
		console.log('result', JSON.stringify(message.result?.result?.value ?? message.result ?? message));
		if (pendingEvaluate) {
			pendingEvaluate = false;
			ws.close();
		}
	}
};

ws.onerror = (error) => {
	console.error('ws-error', error.message || error);
	process.exit(1);
};

ws.onclose = () => {
	console.log('closed');
	process.exit(0);
};
