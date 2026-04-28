# m0ne.top

Personal blog and digital garden for `m0ne`, built with Astro and Tailwind CSS.

The site keeps longer posts, short fragments, photos, project notes, a donation page, RSS, sitemap, Twikoo comments, and a NetEase Cloud Music panel in one static-first Astro project.

This site is customized from the [Devolio](https://devolio.devaradise.com) Astro portfolio and blog template by [devaradise](https://devaradise.com/). The current repository keeps that origin visible out of respect for the original creator's work.

## Tech Stack

- Astro 5
- TypeScript
- Tailwind CSS
- Astro Content Collections for blog posts and fragments
- MDX support
- Netlify adapter
- Twikoo comments
- NetEase Cloud Music API integration

## Project Structure

```text
├── public/                  # Static files and Netlify headers
├── src/
│   ├── assets/              # Local images and icons
│   ├── components/          # Astro UI components
│   ├── content/
│   │   ├── blog/            # Long-form posts
│   │   └── fragments/       # Short notes / fragments
│   ├── data/                # Project list data
│   ├── layouts/             # Shared page layouts
│   ├── lib/                 # Runtime integrations
│   ├── pages/               # Site routes and API endpoints
│   └── styles/              # Global CSS
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Main Routes

- `/` - home page with recent posts, fragments, photos, projects, and music
- `/posts/` - long-form blog archive
- `/fragments/` - short-form notes
- `/photos/` - photo gallery backed by `HOME_GALLERY_ITEMS`
- `/photos/management/` - local development helper for adding gallery items
- `/projects/` - project list from `src/data/projects.ts`
- `/tags/` - tag index
- `/about/` - about page
- `/donate/` - donation page
- `/rss.xml` - RSS feed

## Content

Long-form posts live in `src/content/blog/`:

```yaml
---
title: "Post title"
seoTitle: "Optional SEO title"
description: "Short summary"
pubDate: 2026-04-28
updatedDate: 2026-04-28
tags: ["博客"]
coverImage: "./cover.jpg"
---
```

Short fragments live in `src/content/fragments/`:

```yaml
---
title: "Fragment title"
description: "Short summary"
pubDate: 2026-04-28
tags: ["随笔"]
location: "Beijing"
weather: "Sunny"
---
```

Photo gallery items are currently maintained in `src/consts.ts` through `HOME_GALLERY_ITEMS`. The `/api/photos/add.json` endpoint only works in local development and updates that array.

Project cards are maintained in `src/data/projects.ts`.

## Environment Variables

Twikoo comments:

| Variable | Required | Notes |
| :-- | :-- | :-- |
| `TWIKOO_ENV_ID` | Yes | Twikoo env id or service URL |
| `TWIKOO_REGION` | No | Region for some Tencent Cloud deployments |

NetEase music panel:

| Variable | Required | Notes |
| :-- | :-- | :-- |
| `NETEASE_PLAYLIST_ID` | Yes | Source playlist id |
| `NETEASE_COOKIE` | Yes, unless split fields are used | Full NetEase cookie |
| `NETEASE_MUSIC_U` | Optional | Cookie split field fallback |
| `NETEASE_CSRF` | Optional | Cookie split field fallback |
| `NETEASE_NMTID` | Optional | Cookie split field fallback |
| `NETEASE_TOP_K` | No | Number of tracks to show, defaults to 8 |
| `NETEASE_REFRESH_INTERVAL_HOURS` | No | Login refresh interval, defaults to 12 |

The music integration writes fallback cache files under `.cache/` during runtime.

## Commands

Use pnpm from the repository root:

| Command | Action |
| :-- | :-- |
| `pnpm install` | Install dependencies |
| `pnpm run dev` | Start the local dev server |
| `pnpm run build` | Run `astro check` and build the production site |
| `pnpm run preview` | Preview the production build locally |
| `pnpm run astro -- --help` | Show Astro CLI help |

## Deployment

The Astro config uses `@astrojs/netlify`, with the production site set to `https://m0ne.top`.

Before deploying, configure the Twikoo and NetEase environment variables in the hosting provider. `public/_headers` also sets cache headers for `/api/music/random.json`.

## Credits

- Original template: [Devolio](https://devolio.devaradise.com)
- Creator: [devaradise](https://devaradise.com/)
- This repository is a personal modification and continuation of that template for `m0ne.top`.
