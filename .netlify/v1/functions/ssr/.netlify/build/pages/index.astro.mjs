import { c as createComponent, d as createAstro, f as addAttribute, i as renderHead, r as renderTemplate } from '../chunks/astro/server_D1YkHzyb.mjs';
import 'piccolore';
import 'clsx';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Index = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  return renderTemplate`<html lang="en"> <head><meta charset="utf-8"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="viewport" content="width=device-width"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>Astro</title>${renderHead()}</head> <body> <a href="/about">about
</a><a href="/blog">blog
<h1>Astro</h1> </a></body></html>`;
}, "/Users/minet/Code/vps/m0ne.top/src/pages/index.astro", void 0);

const $$file = "/Users/minet/Code/vps/m0ne.top/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
