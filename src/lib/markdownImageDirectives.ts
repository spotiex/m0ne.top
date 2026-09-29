import type { RemarkPlugin } from '@astrojs/markdown-remark';
import { visit } from 'unist-util-visit';

type DirectiveKind = 'containerDirective' | 'leafDirective' | 'textDirective';

interface DirectiveNode {
	type: DirectiveKind | 'html';
	name?: string;
	attributes?: Record<string, string | null | undefined>;
	children?: DirectiveNode[];
	value?: string;
}

type DirectiveFile = {
	fail: (reason: string, node?: unknown) => never;
};

const WIDTHS = new Set(['normal', 'wide', 'compact']);
const RATIOS = new Set(['original', 'landscape', 'portrait', 'square']);
const FITS = new Set(['cover', 'contain']);
const COLUMNS = new Set(['auto', '1', '2', '3']);

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const getAttribute = (node: DirectiveNode, name: string) => node.attributes?.[name]?.trim() ?? '';

const getEnumAttribute = (node: DirectiveNode, name: string, allowed: Set<string>, fallback: string, file: DirectiveFile) => {
	const value = getAttribute(node, name) || fallback;
	if (!allowed.has(value)) file.fail(`Invalid ${name} value on ::${node.name}: ${value}`, node);
	return value;
};

const isImageSource = (value: string) => {
	if (/^https?:\/\//i.test(value)) return true;
	return value.startsWith('/') || value.startsWith('./') || value.startsWith('../');
};

const renderImage = (node: DirectiveNode, file: DirectiveFile, nested = false) => {
	const src = getAttribute(node, 'src');
	if (!src || !isImageSource(src)) file.fail('::image requires an http(s), absolute, or relative src.', node);

	const alt = getAttribute(node, 'alt');
	const caption = getAttribute(node, 'caption');
	const width = getEnumAttribute(node, 'width', WIDTHS, 'normal', file);
	const ratio = getEnumAttribute(node, 'ratio', RATIOS, 'original', file);
	const fit = getEnumAttribute(node, 'fit', FITS, ratio === 'original' ? 'contain' : 'cover', file);
	const image = `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">`;
	const figcaption = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : '';
	if (nested) return `<figure>${image}${figcaption}</figure>`;
	const ratioClass = ratio === 'original' ? '' : ` img-crop-${ratio}`;
	const fitClass = fit === 'contain' ? ' img-contain' : '';
	return `<figure class="img-figure media-width-${width}${ratioClass}${fitClass}">${image}${figcaption}</figure>`;
};

const renderGallery = (node: DirectiveNode, file: DirectiveFile) => {
	const images = (node.children ?? []).filter((child) => child.type === 'leafDirective' && child.name === 'image');
	if (images.length === 0) file.fail(':::gallery requires at least one ::image child.', node);

	const columns = getEnumAttribute(node, 'columns', COLUMNS, 'auto', file);
	const ratio = getEnumAttribute(node, 'ratio', RATIOS, 'original', file);
	const fit = getEnumAttribute(node, 'fit', FITS, ratio === 'original' ? 'contain' : 'cover', file);
	const width = getEnumAttribute(node, 'width', WIDTHS, 'wide', file);
	const caption = getAttribute(node, 'caption');
	const columnClass = columns === 'auto' ? 'img-gallery-auto' : `img-row-${columns}`;
	const ratioClass = ratio === 'original' ? '' : ` img-crop-${ratio}`;
	const fitClass = fit === 'contain' ? ' img-contain' : '';
	const children = images.map((image) => renderImage(image, file, true)).join('');
	const figcaption = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : '';

	return `<figure class="img-group media-width-${width}${ratioClass}${fitClass}"><div class="${columnClass}">${children}</div>${figcaption}</figure>`;
};

const replaceWithHtml = (node: DirectiveNode, value: string) => {
	node.type = 'html';
	node.value = value;
	delete node.name;
	delete node.attributes;
	delete node.children;
};

export const imageDirectivePlugin: RemarkPlugin = () => (tree, file) => {
	visit(tree, (candidate: unknown) => {
		const node = candidate as DirectiveNode;
		if (node.type === 'leafDirective' && node.name === 'image') {
			replaceWithHtml(node, renderImage(node, file as DirectiveFile));
			return;
		}
		if (node.type === 'containerDirective' && node.name === 'gallery') {
			replaceWithHtml(node, renderGallery(node, file as DirectiveFile));
		}
	});
};
