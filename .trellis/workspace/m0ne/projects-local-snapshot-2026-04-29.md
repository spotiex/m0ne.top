# Projects Local Snapshot - 2026-04-29

Purpose: preserve local Projects page context before re-aligning layout with the Devolio template.

Files involved:
- `src/pages/projects/index.astro`
- `src/components/ProjectList.astro`
- `src/data/projects.ts`
- `src/utils.ts`

Current content source:
- Project data is stored in `src/data/projects.ts`.
- Repository metadata is loaded with `getRepositoryDetails()` from `src/utils.ts`.
- The visible page imports `projects` from `../../data/projects`.

Current selected repositories:
- `spotiex/m0ne.top`
- `spotiex/CS336-From-Scratch-Spring2026`
- `spotiex/subscription-manager`
- `spotiex/Shadowrocket-ADBlock-Rules-Forever`
- `spotiex/Primitive-Analysis`
- `spotiex/watermark`
- `spotiex/spotiex.github.io`

Template reference cloned to:
- `/tmp/devolio-template`

Original template reference files:
- `/tmp/devolio-template/src/pages/projects/index.astro`
- `/tmp/devolio-template/src/pages/projects/projects.ts`
- `/tmp/devolio-template/src/components/ProjectList.astro`
