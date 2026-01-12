import { c as createComponent, m as maybeRenderHead, u as unescapeHTML, r as renderTemplate } from '../../chunks/astro/server_D1YkHzyb.mjs';
import 'piccolore';
import 'clsx';
export { renderers } from '../../renderers.mjs';

const html = () => "<h1 id=\"我的第一篇博客文章\">我的第一篇博客文章</h1>\n<p>发表于：2022-07-01</p>\n<p>欢迎来到我学习关于 Astro 的新博客！在这里，我将分享我建立新网站的学习历程。</p>\n<h2 id=\"我做了什么\">我做了什么</h2>\n<ol>\n<li>\n<p><strong>安装 Astro</strong>：首先，我创建了一个新的 Astro 项目并设置好了我的在线账号。</p>\n</li>\n<li>\n<p><strong>制作页面</strong>：然后我学习了如何通过创建新的 <code>.astro</code> 文件并将它们保存在 <code>src/pages/</code> 文件夹里来制作页面。</p>\n</li>\n<li>\n<p><strong>发表博客文章</strong>：这是我的第一篇博客文章！我现在有用 Astro 编写的页面和用 Markdown 写的文章了！</p>\n</li>\n</ol>\n<h2 id=\"下一步计划\">下一步计划</h2>\n<p>我将完成 Astro 教程，然后继续编写更多内容。关注我以获取更多信息。</p>";

				const frontmatter = {"title":"我的第一篇博客文章","pubDate":"2022-07-01T00:00:00.000Z","description":"这是我 Astro 博客的第一篇文章。","author":"Astro 学习者","image":{"url":"https://docs.astro.build/assets/rose.webp","alt":"The Astro logo on a dark background with a pink glow."},"tags":["astro","blogging","learning in public"]};
				const file = "/Users/minet/Code/vps/m0ne.top/src/pages/posts/post-1.md";
				const url = "/posts/post-1";
				function rawContent() {
					return "   \n                  \n                   \n                                  \n                   \n      \n                                                    \n                                                                \n                                                 \n   \n\n# 我的第一篇博客文章\n\n 发表于：2022-07-01\n\n 欢迎来到我学习关于 Astro 的新博客！在这里，我将分享我建立新网站的学习历程。\n\n ## 我做了什么\n\n 1. **安装 Astro**：首先，我创建了一个新的 Astro 项目并设置好了我的在线账号。\n\n 2. **制作页面**：然后我学习了如何通过创建新的 `.astro` 文件并将它们保存在 `src/pages/` 文件夹里来制作页面。\n\n 3. **发表博客文章**：这是我的第一篇博客文章！我现在有用 Astro 编写的页面和用 Markdown 写的文章了！\n\n ## 下一步计划\n\n 我将完成 Astro 教程，然后继续编写更多内容。关注我以获取更多信息。";
				}
				async function compiledContent() {
					return await html();
				}
				function getHeadings() {
					return [{"depth":1,"slug":"我的第一篇博客文章","text":"我的第一篇博客文章"},{"depth":2,"slug":"我做了什么","text":"我做了什么"},{"depth":2,"slug":"下一步计划","text":"下一步计划"}];
				}

				const Content = createComponent((result, _props, slots) => {
					const { layout, ...content } = frontmatter;
					content.file = file;
					content.url = url;

					return renderTemplate`<meta charset="utf-8">${maybeRenderHead()}${unescapeHTML(html())}`;
				});

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	Content,
	compiledContent,
	default: Content,
	file,
	frontmatter,
	getHeadings,
	rawContent,
	url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
