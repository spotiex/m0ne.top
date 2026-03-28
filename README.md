# Devolio

Devolio is a free portfolio and blog template to help you setup your personal website quickly.

[Demo](https://devolio.devaradise.com) [Article](https://devaradise.com/devolio-astro-portfolio-blog-theme/)

---

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/devaradise/devolio)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/devaradise/devolio)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/devaradise/devolio?devcontainer_path=.devcontainer/blog/devcontainer.json)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/netlify-templates/next-netlify-starter)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdevaradise%2Fdevolio)

Features:

- ✅ Minimal styling (make it your own!)
- ✅ 100/100 Lighthouse performance
- ✅ SEO-friendly with canonical URLs and OpenGraph data
- ✅ Sitemap support
- ✅ RSS Feed support
- ✅ Markdown & MDX support
- ✅ Post tags
- ✅ Projects
- ✅ Table of content

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
│   └── styles/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm run dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm run build`           | Build your production site to `./dist/`          |
| `pnpm run preview`         | Preview your build locally, before deploying     |
| `pnpm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm run astro -- --help` | Get help using the Astro CLI                     |

## 📝 Visual Editing + R2 Uploads (Netlify)

This project includes Decap CMS at `/admin` and an R2 upload API at `/api/admin/r2-upload`.

1. Keep Netlify Identity + Git Gateway enabled for CMS auth/editor access.
2. Add these Netlify environment variables:

| Variable | Example | Notes |
| :-- | :-- | :-- |
| `R2_ACCOUNT_ID` | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Cloudflare account id |
| `R2_ACCESS_KEY_ID` | `...` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | `...` | R2 API token secret |
| `R2_BUCKET` | `blog-images` | Target bucket |
| `R2_PUBLIC_BASE_URL` | `https://img.example.com` | Public bucket/CDN domain (no trailing slash) |
| `R2_REGION` | `auto` | Optional, defaults to `auto` |
| `R2_MAX_UPLOAD_SIZE_MB` | `15` | Optional, defaults to `15` |
| `R2_UPLOAD_BYPASS_AUTH` | `1` | Optional for local/dev only; skip Netlify Identity token verification |

`coverImage` in post frontmatter now supports both local Astro-managed images and external URLs (e.g. R2 CDN links).

## 👀 Want to learn more?

Check out [Astro documentation](https://docs.astro.build).
