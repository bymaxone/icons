# Filled variants: construction and measures

Each filled drawing is its line icon's silhouette made solid: every closed part of the line drawing is filled together with its stroke, every open part keeps its stroke, and a part that lies inside another is knocked out at the stroke width, 1.5 units, under `fill-rule="evenodd"`. Thirty-seven drawings are built that way with Skia's path operations (CanvasKit). Three are written from their geometry instead, as arcs and offset curves, because the Skia outline did not fit the per-component budget at a precision that kept the drawing: `eye`, `octopus` and `settings` (see [Analytic drawings](#analytic-drawings)). Two are built from the line drawing's own outline: `cloud-check`, whose open cloud is closed by its chord so the filled drawing keeps the line icon's bounding box, and `scene`, whose clapper stripes touch the arm's edges and are cut through it.

## Precision

Each drawing is written at the lowest precision (three, two or one decimal) that meets three conditions against the same drawing at three decimals:

1. every pixel stays within 32 of 255 at 1x, at 24 and at 16 px;
2. it has the same enclosed knockouts, none new (a rounding pinhole);
3. no knockout is narrower: its widest inscribed circle stays within 0.05 units.

Knockouts are measured at 480 px (20 px per unit). The analytic drawings are compared with themselves unrounded. In `octopus`, the arms are written at two decimals and the eye holes at one.

## Measures

Sizes are brotli bytes of the component bundled alone by `scripts/check-component-size.mjs` (budget 614.4), and with the runtime (budget 1536). The bounding box is compared with the line icon's, both rendered at 960 px. A knockout of 1.5 units measures 1.46 to 1.52 at this resolution. "Closes at 16 px" counts the knockouts that keep fewer than 2 clear pixels at 16 px 1x: the dots of `alert-circle`, `alert-triangle` and `info`, each a disc 1.5 units across.

| Icon              | Construction              | Precision | Max diff at 1x (of 255) | Alone (B) | With runtime (B) | Bbox vs line (units) | Knockouts | Narrowest knockout (units) | Closes at 16 px |
| ----------------- | ------------------------- | --------- | ----------------------- | --------- | ---------------- | -------------------- | --------- | -------------------------- | --------------- |
| `home`            | Skia                      | fp2       | 16                      | 334       | 1072             | 0.1                  | 1         | 1.63                       | -               |
| `dashboard`       | Skia                      | fp2       | 0                       | 239       | 1008             | 0                    | 0         | -                          | -               |
| `folder`          | Skia                      | fp2       | 0                       | 368       | 1108             | 0                    | 0         | -                          | -               |
| `folder-stack`    | Skia                      | fp2       | 0                       | 443       | 1204             | 0                    | 0         | -                          | -               |
| `library`         | Skia                      | fp2       | 16                      | 369       | 1126             | 0.025                | 0         | -                          | -               |
| `templates`       | Skia                      | fp2       | 0                       | 423       | 1182             | 0                    | 0         | -                          | -               |
| `settings`        | analytic                  | fp2       | 16                      | 383       | 1160             | 0                    | 1         | 1.52                       | -               |
| `user`            | Skia                      | fp1       | 32                      | 222       | 988              | 0.05                 | 0         | -                          | -               |
| `users`           | Skia                      | fp2       | 16                      | 412       | 1190             | 0.025                | 0         | -                          | -               |
| `file`            | Skia                      | fp1       | 16                      | 278       | 1040             | 0                    | 1         | 1.63                       | -               |
| `play`            | Skia                      | fp1       | 32                      | 202       | 945              | 0.1                  | 0         | -                          | -               |
| `pause`           | Skia                      | fp2       | 0                       | 195       | 956              | 0                    | 0         | -                          | -               |
| `scene`           | Skia, stripes cut through | fp2       | 32                      | 307       | 1080             | 0.05                 | 0         | -                          | -               |
| `video`           | Skia                      | fp1       | 16                      | 244       | 1011             | 0                    | 0         | -                          | -               |
| `camera`          | Skia                      | fp2       | 0                       | 263       | 1020             | 0                    | 1         | 1.63                       | -               |
| `mic`             | Skia                      | fp2       | 0                       | 415       | 1172             | 0                    | 0         | -                          | -               |
| `volume`          | Skia                      | fp2       | 16                      | 540       | 1298             | 0.025                | 0         | -                          | -               |
| `image`           | Skia                      | fp1       | 32                      | 292       | 1054             | 0                    | 2         | 1.63                       | -               |
| `layers`          | Skia                      | fp2       | 16                      | 483       | 1242             | 0.225                | 0         | -                          | -               |
| `bell`            | Skia                      | fp1       | 32                      | 283       | 1055             | 0.025                | 0         | -                          | -               |
| `message`         | Skia                      | fp1       | 16                      | 222       | 985              | 0.05                 | 0         | -                          | -               |
| `lock`            | Skia                      | fp2       | 16                      | 377       | 1138             | 0                    | 1         | 1.50                       | -               |
| `eye`             | analytic                  | fp2       | 16                      | 223       | 981              | 0                    | 1         | 2.05                       | -               |
| `pin`             | Skia                      | fp1       | 16                      | 264       | 1025             | 0.05                 | 0         | -                          | -               |
| `check-circle`    | Skia                      | fp2       | 16                      | 349       | 1111             | 0                    | 0         | -                          | -               |
| `alert-circle`    | Skia                      | fp2       | 0                       | 381       | 1138             | 0                    | 2         | 1.46                       | 1               |
| `alert-triangle`  | Skia                      | fp2       | 16                      | 388       | 1166             | 0.025                | 2         | 1.46                       | 1               |
| `info`            | Skia                      | fp2       | 0                       | 383       | 1133             | 0                    | 2         | 1.46                       | 1               |
| `cloud-check`     | Skia, closed by its chord | fp2       | 16                      | 512       | 1287             | 0                    | 0         | -                          | -               |
| `clock`           | Skia                      | fp2       | 16                      | 427       | 1194             | 0                    | 2         | 1.50                       | -               |
| `lightning`       | Skia                      | fp1       | 16                      | 233       | 995              | 0.025                | 0         | -                          | -               |
| `lightning-stack` | Skia                      | fp3       | 0                       | 582       | 1338             | 0                    | 0         | -                          | -               |
| `wallet`          | Skia                      | fp1       | 32                      | 320       | 1076             | 0                    | 1         | 1.63                       | -               |
| `card`            | Skia                      | fp2       | 0                       | 389       | 1147             | 0                    | 2         | 1.50                       | -               |
| `crown`           | Skia                      | fp2       | 16                      | 361       | 1127             | 0                    | 0         | -                          | -               |
| `sparkle`         | Skia                      | fp1       | 32                      | 278       | 1051             | 0.05                 | 0         | -                          | -               |
| `octopus`         | analytic                  | fp2, fp1  | 32                      | 566       | 1310             | 0.025                | 2         | 2.94                       | -               |
| `character`       | Skia                      | fp2       | 32                      | 476       | 1233             | 0.025                | 3         | 1.50                       | -               |
| `sun`             | Skia                      | fp2       | 16                      | 614       | 1374             | 0.025                | 0         | -                          | -               |
| `moon`            | Skia                      | fp1       | 32                      | 276       | 1034             | 0.05                 | 0         | -                          | -               |

## Analytic drawings

[`analytic-before-after.png`](./analytic-before-after.png) shows the Skia outline and the analytic drawing side by side, at 48 and at 24 and 16 px 1x.

| Icon       | Skia outline, alone (B) | Analytic, alone (B) | Geometry, 24 / 16 px (of 255) | Skia geometry, 24 / 16 px (of 255) |
| ---------- | ----------------------- | ------------------- | ----------------------------- | ---------------------------------- |
| `eye`      | 705                     | 223                 | 4 / 2                         | 30 / 21                            |
| `octopus`  | 631                     | 566                 | 13 / 9                        | 52 / 36                            |
| `settings` | 431 (one decimal)       | 383                 | 4 / 3                         | 68 / 33                            |

"Geometry" is the largest difference, 16x supersampled, against the exact definition drawn by resvg's own stroker: the line drawing's closed outline filled and stroked 1.5 with round joins and caps, its details knocked out with a mask. At one decimal, the Skia `settings` outline also opened two pinholes.

- `eye`: the almond the two lids enclose, its outer edge the lids' arcs at r 8.995 with round corners of r 0.75, and the ring between r 3.5 and r 5.5 knocked out around the pupil.
- `octopus`: the mantle's outer offset (its arc at r 6.75, the sides offset by 0.75, round corners where they meet the lower edge), each arm as a band 1.5 wide with a round end, and the two eyes knocked out as discs of r 1.5. The parts are unioned by the nonzero fill rule.
- `settings`: the gear outline (straight flanks, arcs about the centre at r 8.8 and r 7.25) offset by 0.75, round at the convex corners and meeting at the concave ones, with the ring between r 2 and r 3.5 knocked out around the hub.

## Sheets

[`filled-pairs-1.png`](./filled-pairs-1.png) to [`filled-pairs-4.png`](./filled-pairs-4.png) show, for each icon, the line and the filled drawing at 48 px on the light page, the filled drawing at 48 px on the dark page, both at 24 and 16 px 1x, enlarged four times, and the filled drawing at 16 px blurred (Gaussian, 1 px) for the silhouette test.
