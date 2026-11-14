# B7 batch 1: developer tools, cloud, AI and design brand marks

Each mark is the path of Simple Icons 16.37.0, placed in the 20 x 20 live area as a whole by SVGO's `convertPathData` with `applyTransforms` from `translate(2 2) scale(5/6)` at three decimals, with the options that turn a curve into an arc, a curve into a line or a command into a shorthand switched off, then normalised by `pnpm generate`. The table compares each committed mark with the original path drawn under the same transform: the largest difference of coverage in one pixel (0 to 255) at 10x, where it falls, the number of pixels over 8 and how many of them are not on an edge, and the largest difference at 24 and at 16 px. The coverage steps of the rasteriser are multiples of 16, so a difference of 64 is a step of four, not a displacement of a quarter of a pixel. Placing the marks at four or five decimals, or with SVGO's default options, did not lower the largest difference of the first batch (64) and made `github-actions` worse (208), so one method serves every mark.

Over the 53 marks: no pixel over 8 lies away from an edge, the largest difference at 10x is 64 (13 marks reach more than 48), at 24 px it is 64 (`tailwindcss`) and at 16 px 48. [`brands.png`](./brands.png) shows every mark at 48 and 24 px on the dark and the light page, and [`brands-compare.png`](./brands-compare.png) shows, for the marks over 48 at 10x, the original, the committed mark and the difference enlarged four times.

| Mark             | Largest at 10x | Where | Pixels over 8 | Off an edge | At 24 px | At 16 px |
| ---------------- | -------------- | ----- | ------------- | ----------- | -------- | -------- |
| `angular`        | 16             | edge  | 30            | 0           | 0        | 16       |
| `ansible`        | 64             | edge  | 34            | 0           | 16       | 16       |
| `anthropic`      | 16             | edge  | 41            | 0           | 0        | 0        |
| `astro`          | 16             | edge  | 43            | 0           | 0        | 0        |
| `bitbucket`      | 64             | edge  | 47            | 0           | 0        | 0        |
| `bun`            | 16             | edge  | 36            | 0           | 0        | 0        |
| `circleci`       | 32             | edge  | 63            | 0           | 16       | 0        |
| `claude`         | 16             | edge  | 74            | 0           | 16       | 0        |
| `cloudflare`     | 48             | edge  | 87            | 0           | 16       | 16       |
| `datadog`        | 32             | edge  | 88            | 0           | 16       | 16       |
| `digitalocean`   | 16             | edge  | 40            | 0           | 0        | 31       |
| `django`         | 16             | edge  | 25            | 0           | 0        | 16       |
| `docker`         | 64             | edge  | 98            | 0           | 63       | 0        |
| `eslint`         | 16             | edge  | 60            | 0           | 0        | 0        |
| `figma`          | 64             | edge  | 152           | 0           | 0        | 0        |
| `firebase`       | 48             | edge  | 84            | 0           | 16       | 0        |
| `flyio`          | 16             | edge  | 45            | 0           | 16       | 0        |
| `framer`         | 0              | edge  | 0             | 0           | 0        | 0        |
| `git`            | 32             | edge  | 37            | 0           | 0        | 0        |
| `github-actions` | 64             | edge  | 185           | 0           | 16       | 0        |
| `gitlab`         | 32             | edge  | 34            | 0           | 0        | 0        |
| `go`             | 64             | edge  | 58            | 0           | 0        | 0        |
| `google-gemini`  | 16             | edge  | 26            | 0           | 0        | 0        |
| `grafana`        | 32             | edge  | 134           | 0           | 16       | 0        |
| `kotlin`         | 0              | edge  | 0             | 0           | 0        | 0        |
| `kubernetes`     | 16             | edge  | 96            | 0           | 16       | 0        |
| `langchain`      | 63             | edge  | 51            | 0           | 32       | 16       |
| `laravel`        | 16             | edge  | 96            | 0           | 16       | 0        |
| `meta`           | 32             | edge  | 97            | 0           | 16       | 0        |
| `mistral-ai`     | 0              | edge  | 0             | 0           | 0        | 0        |
| `mongodb`        | 32             | edge  | 26            | 0           | 0        | 0        |
| `mysql`          | 64             | edge  | 255           | 0           | 32       | 16       |
| `netlify`        | 48             | edge  | 8             | 0           | 0        | 0        |
| `nextjs`         | 16             | edge  | 35            | 0           | 16       | 0        |
| `nodejs`         | 16             | edge  | 54            | 0           | 16       | 16       |
| `npm`            | 64             | edge  | 14            | 0           | 0        | 0        |
| `nuxt`           | 16             | edge  | 50            | 0           | 0        | 0        |
| `perplexity`     | 16             | edge  | 41            | 0           | 16       | 0        |
| `pnpm`           | 0              | edge  | 0             | 0           | 0        | 0        |
| `postgresql`     | 64             | edge  | 148           | 0           | 16       | 16       |
| `prometheus`     | 16             | edge  | 34            | 0           | 0        | 0        |
| `python`         | 16             | edge  | 45            | 0           | 16       | 0        |
| `redis`          | 48             | edge  | 41            | 0           | 16       | 0        |
| `sentry`         | 32             | edge  | 100           | 0           | 16       | 0        |
| `stripe`         | 16             | edge  | 49            | 0           | 0        | 16       |
| `supabase`       | 32             | edge  | 23            | 0           | 16       | 16       |
| `swift`          | 16             | edge  | 39            | 0           | 16       | 16       |
| `tailwindcss`    | 64             | edge  | 230           | 0           | 64       | 48       |
| `terraform`      | 16             | edge  | 25            | 0           | 0        | 0        |
| `typescript`     | 64             | edge  | 80            | 0           | 0        | 16       |
| `unity`          | 16             | edge  | 24            | 0           | 0        | 0        |
| `vercel`         | 0              | edge  | 0             | 0           | 0        | 0        |
| `webflow`        | 64             | edge  | 86            | 0           | 0        | 0        |
