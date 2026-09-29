import assert from 'node:assert/strict';
import test from 'node:test';
import { renderEditorMarkdown } from '../src/lib/server/editorPreview.ts';

test('renders GFM and preserves the trusted image-layout HTML used by existing posts', async () => {
	const html = await renderEditorMarkdown(`## 标题

| A | B |
| - | - |
| 1 | 2 |

<figure class="img-group"><div class="img-row-2"><img src="https://example.com/a.jpg" alt="A"></div></figure>`);

	assert.match(html, /<h2 id="标题">标题<\/h2>/);
	assert.match(html, /<table>/);
	assert.match(html, /<figure class="img-group">/);
	assert.match(html, /<div class="img-row-2">/);
	assert.doesNotMatch(html, /&lt;figure/);
});

test('renders image and gallery directives into semantic image markup', async () => {
	const html =
		await renderEditorMarkdown(`::image{src="https://example.com/one.jpg" alt="单图" caption="单图说明" width="compact" ratio="square" fit="cover"}

:::gallery{columns="2" ratio="portrait" fit="cover" width="wide" caption="整组说明"}
::image{src="https://example.com/a.jpg" alt="图 A"}
::image{src="https://example.com/b.jpg" alt="图 B" caption="图 B 说明"}
:::`);

	assert.match(html, /class="img-figure media-width-compact img-crop-square"/);
	assert.match(html, /class="img-group media-width-wide img-crop-portrait"/);
	assert.match(html, /class="img-row-2"/);
	assert.match(html, /alt="图 A"/);
	assert.match(html, /<figcaption>整组说明<\/figcaption>/);
});

test('escapes directive attributes before emitting raw HTML', async () => {
	const html = await renderEditorMarkdown(
		'::image{src="https://example.com/a.jpg" alt="safe" caption="&lt;script&gt;alert(1)&lt;/script&gt;"}'
	);

	assert.doesNotMatch(html, /<script>/);
	assert.match(html, /(?:&lt;|&#x3C;)script>alert\(1\)(?:&lt;|&#x3C;)\/script>/);
});
