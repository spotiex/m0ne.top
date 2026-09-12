# Mobile Editor Cross-Layer Contract

## 1. Scope / Trigger

Use this contract when changing the private `/editor/` UI, editor APIs, supported frontmatter, GitHub publishing, or content bundle paths. The feature crosses browser state, Astro API routes, GitHub repository content, and Astro content collections; changes must remain compatible across every layer.

## 2. Signatures

### Routes

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/editor/login.json` | Create the signed admin session |
| `POST` | `/api/editor/logout.json` | Clear current and legacy admin sessions |
| `GET` | `/api/editor/content/index.json` | List editable `.md` bundles |
| `GET` | `/api/editor/content/item.json?path=...` | Read and parse one bundle |
| `POST` | `/api/editor/content/publish.json` | Create or update one bundle |

### Shared functions

```ts
normalizeEditorPublishInput(value: unknown): EditorPublishInput
parseEditorDocument(source: string, path: string, sha: string): EditorDocument
serializeEditorDocument(input: EditorPublishInput): string
getEditorContentPath(input: EditorPublishInput): string
getEditorPublicPath(input): string
```

These signatures live in `src/lib/editorContent.ts` and are the single source of truth for content validation and Markdown serialization.

## 3. Contracts

### Publish request

```ts
interface EditorPublishInput {
  type: 'blog' | 'fragment';
  path?: string; // present only for updates
  sha?: string; // required with path
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  pubDate: string; // YYYY-MM-DD
  updatedDate: string; // empty or YYYY-MM-DD
  tags: string[];
  coverImage: string;
  location: string;
  weather: string;
  body: string;
}
```

New content is written only to:

```text
src/content/blog/<slug>/index.md
src/content/fragments/<slug>/index.md
```

Existing `.mdx` content is outside the editable path contract. Browser autosave uses `localStorage` key `m0ne.editor.draft.v1` and never calls the publish endpoint.

### Publish response

```json
{
  "ok": true,
  "mode": "create | update",
  "path": "src/content/.../index.md",
  "sha": "new file SHA",
  "commitSha": "commit SHA",
  "commitUrl": "GitHub commit URL",
  "publicPath": "/slug/"
}
```

### Environment

| Variable | Contract |
| --- | --- |
| `BLOG_ADMIN_USERNAME` | Preferred admin username; falls back to `PHOTO_ADMIN_USERNAME` |
| `BLOG_ADMIN_PASSWORD` | Preferred admin password; falls back to `PHOTO_ADMIN_PASSWORD` |
| `BLOG_ADMIN_SESSION_SECRET` | Preferred signing secret; falls back to `PHOTO_ADMIN_SESSION_SECRET` |
| `BLOG_EDITOR_GITHUB_TOKEN` | Server-only fine-grained token with Contents read/write |
| `BLOG_EDITOR_GITHUB_REPOSITORY` | Optional `owner/repository`; default `spotiex/m0ne.top` |
| `BLOG_EDITOR_GITHUB_BRANCH` | Optional branch; default `master` |

Never serialize `BLOG_EDITOR_GITHUB_TOKEN` into page props, inline scripts, JSON responses, logs, or client storage.

## 4. Validation & Error Matrix

| Condition | Status | Required behavior |
| --- | --- | --- |
| No valid admin cookie | `401` | Reject every content API request |
| Cross-origin login/logout/publish | `403` | Reject before reading or writing data |
| Invalid type, slug, date, path, or empty body | `400` | Return a stable error without contacting GitHub for writes |
| Update includes `path` but no `sha` | `400` | Reject; stale-safe updates require a loaded version |
| Path is outside the two `.md` bundle patterns | `400` | Reject path traversal and unsupported files |
| New path already exists | `409` | Do not overwrite the existing file |
| Update SHA is stale | `409` | Ask the user to reload; never silently overwrite |
| GitHub token missing | `503` | Keep editor available for drafting, disable publishing in UI |
| Other GitHub failure | GitHub status or `502` | Surface a useful failure and retain local draft |

## 5. Good / Base / Bad Cases

### Good

Load `src/content/blog/2026-09-12-post/index.md`, retain its SHA, edit the body, confirm the exact target path, and publish with the retained SHA. Store the returned new SHA for a later update.

### Base

Create a fragment with a valid slug, required metadata, and body. Autosave locally while typing; submit to GitHub only after explicit confirmation.

### Bad

Accepting `{ "path": "../../README.md", "sha": "..." }`, exposing the token to browser JavaScript, or updating a file without its loaded SHA violates this contract.

## 6. Tests Required

`tests/editorContent.test.ts` must assert:

- blog and fragment serialization/parsing preserve every supported field;
- generated repository and public paths match the content type;
- invalid calendar dates, slugs, and empty bodies are rejected;
- updates without SHA and paths outside the allowlist are rejected.

When API behavior changes, also verify locally:

- unauthenticated list returns `401`;
- login creates a usable cookie and logout clears it;
- missing GitHub token returns `503` without a remote write;
- a stale SHA maps to `409`.

## 7. Wrong vs Correct

### Wrong

```ts
fetch('https://api.github.com/repos/...', {
  headers: { Authorization: `Bearer ${tokenFromBrowserStorage}` }
});
```

### Correct

```ts
// Browser sends only validated document fields to the same-origin API.
await fetch('/api/editor/content/publish.json', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ ...document, path, sha })
});
```

The Astro server reads the token, validates the allowlisted path, and supplies the SHA to GitHub.
