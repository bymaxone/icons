# B7 batch 3: payments, operating systems and stores brand marks

Each mark is the path of Simple Icons 16.37.0, placed in the 20 x 20 live area as a whole by SVGO's `convertPathData` with `applyTransforms` from `translate(2 2) scale(5/6)` at three decimals, with the options that turn a curve into an arc, a curve into a line or a command into a shorthand switched off, then normalised by `pnpm generate`. The table compares each committed mark with the original path drawn under the same transform: the largest difference of coverage in one pixel (0 to 255) at 10x, where it falls, the number of pixels over 8 and how many of them are not on an edge, and the largest difference at 24 and at 16 px. The coverage steps of the rasteriser are multiples of 16, so a difference of 64 is a step of four, not a displacement of a quarter of a pixel. Placing the marks at four or five decimals did not lower the largest difference of the first batch (64) and made `github-actions` worse (208), so one method serves every mark.

Over the 21 marks: no pixel over 8 lies away from an edge, the largest difference at 10x is 240 (7 marks reach more than 48), at 24 px it is 48 (`steam`) and at 16 px 16. [`brands.png`](./brands.png) shows every mark at 48 and 24 px on the dark and the light page, and [`brands-compare.png`](./brands-compare.png) shows, for the marks over 48 at 10x, the original, the committed mark and the difference enlarged four times.

| Mark              | Largest at 10x | Where | Pixels over 8 | Off an edge | At 24 px | At 16 px |
| ----------------- | -------------- | ----- | ------------- | ----------- | -------- | -------- |
| `android`         | 64             | edge  | 83            | 0           | 32       | 16       |
| `apple-pay`       | 31             | edge  | 34            | 0           | 0        | 0        |
| `appstore`        | 32             | edge  | 55            | 0           | 16       | 0        |
| `arch-linux`      | 32             | edge  | 45            | 0           | 16       | 16       |
| `brave`           | 32             | edge  | 124           | 0           | 16       | 16       |
| `ebay`            | 16             | edge  | 34            | 0           | 0        | 16       |
| `firefox`         | 32             | edge  | 54            | 0           | 16       | 0        |
| `google-pay`      | 64             | edge  | 75            | 0           | 15       | 0        |
| `google-play`     | 64             | edge  | 48            | 0           | 0        | 0        |
| `ios`             | 16             | edge  | 41            | 0           | 0        | 0        |
| `klarna`          | 16             | edge  | 27            | 0           | 0        | 0        |
| `linux`           | 32             | edge  | 85            | 0           | 16       | 0        |
| `macos`           | 16             | edge  | 29            | 0           | 16       | 16       |
| `opera`           | 64             | edge  | 124           | 0           | 16       | 16       |
| `safari`          | 32             | edge  | 118           | 0           | 16       | 0        |
| `samsungpay`      | 32             | edge  | 55            | 0           | 0        | 16       |
| `shopify`         | 64             | edge  | 86            | 0           | 16       | 0        |
| `square-payments` | 31             | edge  | 14            | 0           | 16       | 0        |
| `steam`           | 240            | edge  | 180           | 0           | 48       | 16       |
| `ubuntu`          | 64             | edge  | 85            | 0           | 0        | 16       |
| `visa`            | 32             | edge  | 32            | 0           | 0        | 0        |
