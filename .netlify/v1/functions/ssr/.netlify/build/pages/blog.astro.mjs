import { c as createComponent, m as maybeRenderHead, r as renderTemplate } from '../chunks/astro/server_D1YkHzyb.mjs';
import 'piccolore';
import 'clsx';
export { renderers } from '../renderers.mjs';

const $$Blog = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<a href="/">main page</a> <a href="/about">about</a> <a href="/blog">blog</a> <h1> my blog</h1>`;
}, "/Users/minet/Code/vps/m0ne.top/src/pages/blog.astro", void 0);

const $$file = "/Users/minet/Code/vps/m0ne.top/src/pages/blog.astro";
const $$url = "/blog";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Blog,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
