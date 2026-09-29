import assert from 'node:assert/strict';
import test from 'node:test';
import { findEditorMediaBlock, serializeEditorMediaBlock, type EditorMediaBlock } from '../src/lib/editorMedia.ts';

test('round-trips a gallery directive and finds it from a cursor inside the block', () => {
	const block: EditorMediaBlock = {
		kind: 'gallery',
		images: [
			{ src: 'https://example.com/a.jpg', alt: '图 A', caption: '' },
			{ src: 'https://example.com/b.jpg', alt: '图 B', caption: '说明 "B"' }
		],
		width: 'wide',
		columns: '2',
		ratio: 'portrait',
		fit: 'cover',
		caption: '旅行途中 {第二天}'
	};
	const directive = serializeEditorMediaBlock(block);
	const markdown = `前文\n\n${directive}\n\n后文`;
	const match = findEditorMediaBlock(markdown, markdown.indexOf('图 B'));

	assert.ok(match);
	assert.deepEqual(match.block, block);
	assert.equal(markdown.slice(match.start, match.end), directive);
});

test('round-trips a single image including layout settings', () => {
	const block: EditorMediaBlock = {
		kind: 'image',
		images: [{ src: 'https://example.com/one.jpg', alt: '', caption: '装饰图' }],
		width: 'compact',
		columns: '1',
		ratio: 'square',
		fit: 'cover',
		caption: ''
	};
	const directive = serializeEditorMediaBlock(block);
	const match = findEditorMediaBlock(directive, 3);

	assert.ok(match);
	assert.deepEqual(match.block, block);
});
