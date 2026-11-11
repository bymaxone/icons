# Brand marks against their source

Each mark is the path of Simple Icons 16.37.0 (CC0-1.0), placed in the 20 x 20 live area by SVGO's `convertPathData` with `applyTransforms` from `translate(2 2) scale(5/6)`, at three decimals, then normalised by `pnpm generate`. The table compares, at 10x, the committed mark with the original path drawn under that same transform: the largest difference of coverage in one pixel (0 to 255), and the number of pixels that differ by more than 8. The differences are antialiasing at the edges; [`brands-compare.png`](./brands-compare.png) shows the original and the committed mark side by side at 48, the mark at 24 and 16 px, and the difference enlarged four times.

| Mark        | Largest difference (of 255) | Pixels over 8 |
| ----------- | --------------------------- | ------------- |
| `apple`     | 32                          | 51            |
| `discord`   | 48                          | 116           |
| `facebook`  | 16                          | 27            |
| `github`    | 32                          | 65            |
| `google`    | 16                          | 41            |
| `instagram` | 32                          | 93            |
| `pinterest` | 32                          | 86            |
| `spotify`   | 32                          | 53            |
| `threads`   | 16                          | 78            |
| `tiktok`    | 32                          | 34            |
| `vimeo`     | 48                          | 114           |
| `whatsapp`  | 32                          | 90            |
| `x`         | 16                          | 60            |
| `youtube`   | 32                          | 43            |
