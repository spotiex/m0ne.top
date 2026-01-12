import { c as createComponent, d as createAstro, m as maybeRenderHead, r as renderTemplate } from '../chunks/astro/server_D1YkHzyb.mjs';
import 'piccolore';
import 'clsx';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$About = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$About;
  return renderTemplate`${maybeRenderHead()}<body> <a href="/">main page</a> <a href="/about/">about</a> <h1>About Me</h1> <h2>......and my new Astro website!</h2> </body>`;
}, "/Users/minet/Code/vps/m0ne.top/src/pages/about.astro", void 0);

const $$file = "/Users/minet/Code/vps/m0ne.top/src/pages/about.astro";
const $$url = "/about";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$About,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
