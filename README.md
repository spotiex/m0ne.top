# m0ne.top

Personal blog and digital garden for `m0ne`, built with Astro and Tailwind CSS.

The site keeps longer posts, short fragments, an R2-backed photo gallery, project notes, a donation page, RSS, sitemap, Twikoo comments, and a NetEase Cloud Music panel in one Astro project.

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
- Cloudflare R2-compatible S3 API for photo storage

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
│   ├── lib/                 # Tags, stats, photo archive, and runtime integrations
│   │   └── server/          # Server-only photo admin, gallery, and R2 helpers
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
- `/photos/` - full photo gallery loaded from the R2 gallery index
- `/photos/[year]/` - photo archive filtered by year
- `/photos/[year]/[month]/` - photo archive filtered by year and month
- `/photos/management/` - authenticated photo management console
- `/projects/` - project list from `src/data/projects.ts`
- `/tags/` - grouped tag index across posts, fragments, projects, and photos
- `/tags/[tag]/` - all content for one tag
- `/tags/[tag]/[section]/` - one tag filtered to posts, fragments, projects, or photos
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

Project cards are maintained in `src/data/projects.ts`.

## Photo Gallery Architecture

Photo metadata is no longer stored in `src/consts.ts`. The gallery now reads a JSON index from Cloudflare R2 through `src/lib/server/gallery.ts`.

Each gallery item uses the shared `GalleryItem` shape from `src/consts.ts`:

```ts
{
	src: string;
	alt: string;
	title?: string;
	date?: string;
	description?: string;
	tags?: string[];
}
```

The photo pages use `src/lib/photoArchive.ts` and `src/lib/photoDate.ts` to derive archive routes from `date` first, then from dated image paths such as `2026/04/28/...`.

The management workflow is:

1. Log in at `/photos/management/`.
2. Select or drag in a local image.
3. `/api/photos/prepare.json` generates an R2 object key, public URL, and signed browser upload target.
4. Saving uploads the image directly to R2, then calls `/api/photos/add.json`.
5. `/api/photos/add.json` creates or updates the item in the R2 gallery index JSON.

Recent gallery items can also be loaded in the management page and edited as metadata-only updates.

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

Photo gallery and admin console:

| Variable | Required | Notes |
| :-- | :-- | :-- |
| `IMAGEPORT_S3_ENDPOINT` | Yes | R2 S3 API endpoint |
| `IMAGEPORT_S3_BUCKET` | Yes | R2 bucket name |
| `IMAGEPORT_S3_REGION` | No | Defaults to `auto` |
| `IMAGEPORT_S3_ACCESS_KEY_ID` | Yes | R2 access key |
| `IMAGEPORT_S3_SECRET_ACCESS_KEY` | Yes | R2 secret key |
| `IMAGEPORT_S3_PUBLIC_URL` | Yes | Public base URL for photo objects |
| `IMAGEPORT_GALLERY_INDEX_KEY` | No | Gallery JSON key, defaults to `gallery.json` |
| `IMAGEPORT_IMAGE_PREFIX` | No | Optional object prefix for uploaded images |
| `IMAGEPORT_S3_PREFIX` | No | Fallback image prefix if `IMAGEPORT_IMAGE_PREFIX` is not set |
| `IMAGEPORT_PHOTO_TIMEZONE` | No | Photo date/key timezone, defaults to `Asia/Hong_Kong` |
| `PHOTO_ADMIN_USERNAME` | Yes, for management | Management console username |
| `PHOTO_ADMIN_PASSWORD` | Yes, for management | Management console password |
| `PHOTO_ADMIN_SESSION_SECRET` | Yes, for management | HMAC secret for signed admin cookies |

## Commands

Use npm from the repository root. For Netlify-local development, run `ntl dev` after installing dependencies.

| Command | Action |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the Astro dev server |
| `ntl dev` | Start the local Netlify development server |
| `npm run build` | Run `astro check` and build the production site |
| `npm run preview` | Preview the production build locally |
| `npm run astro -- --help` | Show Astro CLI help |

## Deployment

The Astro config uses `@astrojs/netlify`, with the production site set to `https://m0ne.top`. `netlify.toml` runs `npm run build` and publishes `dist`.

Before deploying, configure the Twikoo, NetEase, R2, and photo admin environment variables in the hosting provider. `public/_headers` also sets cache headers for `/api/music/random.json`.

## Credits

- Original template: [Devolio](https://devolio.devaradise.com)
- Creator: [devaradise](https://devaradise.com/)
- This repository is a personal modification and continuation of that template for `m0ne.top`.
