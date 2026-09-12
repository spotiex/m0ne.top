import assert from 'node:assert/strict';
import test from 'node:test';
import {
	getEditorContentPath,
	getEditorPublicPath,
	normalizeEditorPublishInput,
	parseEditorDocument,
	serializeEditorDocument
} from '../src/lib/editorContent.ts';

const blogInput = {
	type: 'blog',
	slug: '2026-09-12-post',
	title: '手机里的灵感',
	seoTitle: '手机里的灵感 - 测试',
	description: '在路上记录的两句话',
	pubDate: '2026-09-12',
	updatedDate: '',
	tags: ['博客', "O'Reilly"],
	coverImage: 'https://example.com/cover.jpg',
	location: '',
	weather: '',
	body: '第一段。\n\n## 小标题\n\n第二段。'
};

test('normalizes, serializes, and parses a blog document without losing supported fields', () => {
	const normalized = normalizeEditorPublishInput(blogInput);
	const path = getEditorContentPath(normalized);
	const source = serializeEditorDocument(normalized);
	const parsed = parseEditorDocument(source, path, 'abc123');

	assert.equal(path, 'src/content/blog/2026-09-12-post/index.md');
	assert.equal(parsed.sha, 'abc123');
	assert.equal(parsed.title, blogInput.title);
	assert.equal(parsed.seoTitle, blogInput.seoTitle);
	assert.deepEqual(parsed.tags, blogInput.tags);
	assert.equal(parsed.coverImage, blogInput.coverImage);
	assert.equal(parsed.body, blogInput.body);
	assert.equal(getEditorPublicPath(normalized), '/2026-09-12-post/');
});

test('serializes and parses fragment-only metadata', () => {
	const normalized = normalizeEditorPublishInput({
		...blogInput,
		type: 'fragment',
		slug: '2026-09-12-fragment',
		seoTitle: '',
		coverImage: '',
		location: '北京 海淀',
		weather: '晴'
	});
	const path = getEditorContentPath(normalized);
	const parsed = parseEditorDocument(serializeEditorDocument(normalized), path, 'def456');

	assert.equal(parsed.type, 'fragment');
	assert.equal(parsed.location, '北京 海淀');
	assert.equal(parsed.weather, '晴');
	assert.equal(getEditorPublicPath(normalized), '/fragments/2026-09-12-fragment/');
});

test('requires a version SHA for updates and rejects paths outside content collections', () => {
	assert.throws(() => normalizeEditorPublishInput({ ...blogInput, path: 'src/content/blog/existing/index.md' }), /loaded file version/);
	assert.throws(() => normalizeEditorPublishInput({ ...blogInput, path: '../../README.md', sha: 'abc' }), /Existing path is invalid/);
});

test('rejects invalid dates, slugs, and empty bodies at the server boundary', () => {
	assert.throws(() => normalizeEditorPublishInput({ ...blogInput, pubDate: '2026-02-30' }), /valid YYYY-MM-DD/);
	assert.throws(() => normalizeEditorPublishInput({ ...blogInput, slug: '../escape' }), /Slug must use/);
	assert.throws(() => normalizeEditorPublishInput({ ...blogInput, body: '  ' }), /Body is required/);
});
