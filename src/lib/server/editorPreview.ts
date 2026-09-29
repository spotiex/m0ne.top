import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkDirective from 'remark-directive';
import { imageDirectivePlugin } from '../markdownImageDirectives.ts';

const processor = createMarkdownProcessor({
	gfm: true,
	smartypants: true,
	syntaxHighlight: false,
	remarkPlugins: [remarkDirective, imageDirectivePlugin]
});

export const renderEditorMarkdown = async (markdown: string) => {
	const renderer = await processor;
	const result = await renderer.render(markdown);
	return result.code;
};
