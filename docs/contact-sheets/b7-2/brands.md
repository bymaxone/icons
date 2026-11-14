# B7 batch 2: social, messaging and streaming brand marks

Each mark is the path of Simple Icons 16.37.0, placed in the 20 x 20 live area as a whole by SVGO's `convertPathData` with `applyTransforms` from `translate(2 2) scale(5/6)` at three decimals, with the options that turn a curve into an arc, a curve into a line or a command into a shorthand switched off, then normalised by `pnpm generate`. The table compares each committed mark with the original path drawn under the same transform: the largest difference of coverage in one pixel (0 to 255) at 10x, where it falls, the number of pixels over 8 and how many of them are not on an edge, and the largest difference at 24 and at 16 px. The coverage steps of the rasteriser are multiples of 16, so a difference of 64 is a step of four, not a displacement of a quarter of a pixel. Placing the marks at four or five decimals did not lower the largest difference of the first batch (64) and made `github-actions` worse (208), so one method serves every mark.

Over the 22 marks: no pixel over 8 lies away from an edge, the largest difference at 10x is 128 (8 marks reach more than 48), at 24 px it is 32 (`kakaotalk`, `hbo`) and at 16 px 32. [`brands.png`](./brands.png) shows every mark at 48 and 24 px on the dark and the light page, and [`brands-compare.png`](./brands-compare.png) shows, for the marks over 48 at 10x, the original, the committed mark and the difference enlarged four times.

| Mark               | Largest at 10x | Where | Pixels over 8 | Off an edge | At 24 px | At 16 px |
| ------------------ | -------------- | ----- | ------------- | ----------- | -------- | -------- |
| `apple-music`      | 16             | edge  | 33            | 0           | 16       | 16       |
| `bluesky`          | 16             | edge  | 26            | 0           | 0        | 0        |
| `dribbble`         | 64             | edge  | 204           | 0           | 16       | 32       |
| `hbo`              | 128            | edge  | 108           | 0           | 32       | 16       |
| `kakaotalk`        | 96             | edge  | 74            | 0           | 32       | 16       |
| `line-messenger`   | 111            | edge  | 71            | 0           | 0        | 0        |
| `mastodon`         | 64             | edge  | 76            | 0           | 16       | 0        |
| `messenger`        | 16             | edge  | 32            | 0           | 16       | 0        |
| `netflix`          | 16             | edge  | 36            | 0           | 16       | 16       |
| `nextdoor`         | 16             | edge  | 37            | 0           | 0        | 16       |
| `patreon`          | 16             | edge  | 14            | 0           | 16       | 0        |
| `qq`               | 16             | edge  | 36            | 0           | 0        | 0        |
| `reddit`           | 64             | edge  | 144           | 0           | 16       | 16       |
| `signal-messenger` | 32             | edge  | 90            | 0           | 16       | 0        |
| `snapchat`         | 48             | edge  | 47            | 0           | 16       | 0        |
| `soundcloud`       | 63             | edge  | 109           | 0           | 16       | 0        |
| `substack`         | 16             | edge  | 12            | 0           | 0        | 0        |
| `telegram`         | 16             | edge  | 22            | 0           | 0        | 0        |
| `tumblr`           | 16             | edge  | 12            | 0           | 0        | 0        |
| `viber`            | 48             | edge  | 122           | 0           | 16       | 16       |
| `wechat`           | 32             | edge  | 46            | 0           | 16       | 0        |
| `zoom`             | 128            | edge  | 288           | 0           | 16       | 16       |
