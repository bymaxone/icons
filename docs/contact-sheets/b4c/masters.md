# 16 px masters: construction and measures

Each 16 px master is a separate drawing of its icon, made for 16 px: it sits on the same 24-unit grid as the line icon, its root is `width="16" height="16"`, and its stroke is the set's 1.5 px at 16, written as 2.25 units. A master keeps what the icon means and drops what does not survive at 16 px.

## Rules

- **Stroke and gap.** Distinct parts stand 3.75 units apart between centrelines, a 1 px gap of ink; a diagonal gap takes 4.5 units, because a 1 px gap at 45 degrees closes on the pixel grid.
- **Crispness.** Straight horizontal and vertical strokes sit on odd multiples of 0.75 units, the centres of the 16 px pixels, so each renders one full pixel and two fringes of 0.25. A pair symmetric about 12 (3.75 and 20.25) is crisp on both sides; a single centred stroke uses the axis 12.75.
- **Ink.** At 16 px a master covers at most 32.25% of the canvas, the ink ceiling of spec section 2.5 at the same weight (21.5% x 24 / 16), and at most 1.5 times the ink of its line icon at 24 px: a master simplifies and never adds geometry.
- **Light between strokes.** G is the darkest pixel on the lightest path between two distinct parts, at 16 px 1x, rendered by resvg: 0 is a fully clear pixel between them, 0.25 a single stroke's antialiased fringe, 0.5 two fringes on one pixel, which is a cut that has closed. Every master has G of at most 0.25; a fully clear pixel between two crisp 1.5 px strokes needs 4 px between their axes, so G = 0 is a target where there is room.

## What changed against the line drawing

- **Removed at 16 px:** the crease of `file`, `file-audio`, `file-video` and `script`, which fuses with the page; the capsule of the `search` handle, now a single stroke; the clasp of `wallet`, now a short mark.
- **Simplified:** `share` draws its nodes as solid dots; `timeline` draws its clips as bars; `frame` draws its perforations as two rows of three holes along its edges; `octopus` keeps its mantle, eyes and four arms in one outline; `eye` has a smaller pupil ring; `more-horizontal` and `more-vertical` draw 2 px dots on pixel corners; `duplicate` enlarges its front square for a plus 3 px across.
- **`eye-off`** keeps the whole almond and crosses it with a slash that meets both lids: a cut on each side of a diagonal slash costs about 6 px of each 11 px lid at 16 px, and the eye no longer reads. It is the one master whose slash touches the parts it crosses.
- **`alert-triangle`** keeps the bar and the dot of "!": a bar of 2.5 px and a dot at a 1 px cut, the only placement inside the triangle that keeps both clear of its sides.

## Measures

Ink is coverage at the size given, with the stroke. G and the parts it is measured between come from the production files at 16 px 1x. Sizes are brotli bytes of the component bundled alone by `scripts/check-component-size.mjs`, and with the runtime. The nearest reference and d come from `pnpm similarity`.

| Icon              | Ink sm@16 (%) | Ink line@24 (%) | Ratio | G at 16 px | Parts at G        | Bbox at 16 (units)    | Centroid (units) | Alone (B) | With runtime (B) | Nearest reference            | d    |
| ----------------- | ------------- | --------------- | ----- | ---------- | ----------------- | --------------------- | ---------------- | --------- | ---------------- | ---------------------------- | ---- |
| `home`            | 24.8          | 16.9            | 1.47  | 0.25       | path 1 / path 2   | 4.5, 3, 21, 21        | 12.73, 13.58     | 231       | 1056             | lucide/home                  | 0.50 |
| `dashboard`       | 29.3          | 20.7            | 1.42  | 0.25       | path 2 / path 3   | 4.5, 4.5, 21, 21      | 12.66, 12.5      | 254       | 1079             | tabler/category-2            | 0.61 |
| `folder-stack`    | 26.4          | 20.8            | 1.27  | 0.25       | path 1 / path 3   | 3, 3, 21, 21          | 12.13, 12.79     | 248       | 1077             | lucide/calendars             | 1.03 |
| `library`         | 30.6          | 20.9            | 1.46  | 0.25       | path 1 / path 2   | 3, 3, 19.5, 21        | 10.68, 12.04     | 227       | 1064             | lucide/test-tubes            | 1.02 |
| `templates`       | 25.7          | 17.9            | 1.44  | 0.25       | path 4 / path 5   | 3, 3, 19.5, 21        | 9.84, 11.07      | 210       | 1045             | tabler/layout-kanban         | 0.97 |
| `sidebar`         | 25            | 19.4            | 1.29  | 0.25       | path 1 / path 2   | 3, 4.5, 21, 19.5      | 11.72, 12        | 191       | 1018             | phosphor/sidebar-simple      | 0.53 |
| `chevron-up`      | 6.9           | 5               | 1.38  | 0          | -                 | 6, 9, 19.5, 16.5      | 12.75, 13.05     | 158       | 970              | lucide/chevron-up            | 0.01 |
| `chevron-down`    | 6.9           | 5               | 1.38  | 0          | -                 | 6, 9, 19.5, 16.5      | 12.75, 12.45     | 145       | 974              | lucide/chevron-down          | 0.01 |
| `chevron-left`    | 6.9           | 5               | 1.38  | 0          | -                 | 9, 6, 16.5, 19.5      | 13.05, 12.75     | 146       | 969              | lucide/chevron-left          | 0.01 |
| `chevron-right`   | 6.9           | 5               | 1.38  | 0          | -                 | 9, 6, 16.5, 19.5      | 12.45, 12.75     | 147       | 972              | lucide/chevron-right         | 0.01 |
| `search`          | 16.3          | 14.7            | 1.11  | 0.19       | circle 1 / path 2 | 3, 3, 21, 21          | 11.27, 11.23     | 151       | 973              | tabler/search                | 0.58 |
| `settings`        | 24.6          | 21.1            | 1.17  | 0.19       | path 1 / circle 2 | 4.5, 4.5, 21, 21      | 12.73, 12.75     | 253       | 1085             | tabler/settings-2            | 0.31 |
| `plus`            | 8.9           | 7.1             | 1.25  | 0          | -                 | 6, 6, 19.5, 19.5      | 12.75, 12.75     | 134       | 967              | lucide/plus                  | 0.00 |
| `close`           | 12.9          | 9.3             | 1.39  | 0          | -                 | 6, 6, 19.5, 19.5      | 12.75, 12.75     | 130       | 964              | lucide/x                     | 0.00 |
| `check`           | 9.3           | 6.2             | 1.50  | 0          | -                 | 4.5, 7.5, 21, 18      | 12.58, 13.27     | 133       | 960              | tabler/check                 | 0.01 |
| `pencil`          | 14.2          | 11.6            | 1.22  | 0.06       | path 1 / path 2   | 3, 4.5, 19.5, 21      | 11.32, 12.68     | 177       | 1014             | lucide/pencil                | 0.74 |
| `trash`           | 21.5          | 14.4            | 1.49  | 0.25       | path 1 / path 2   | 3, 3, 21, 21          | 12, 11.41        | 195       | 1024             | heroicons/clipboard          | 0.68 |
| `copy`            | 24            | 17.1            | 1.40  | 0          | -                 | 3, 3, 21, 21          | 11.92, 11.93     | 199       | 1038             | lucide/copy                  | 0.79 |
| `download`        | 20.2          | 13.8            | 1.46  | 0.19       | path 1 / path 2   | 4.5, 3, 21, 21        | 12.73, 14.59     | 182       | 1009             | phosphor/download-simple     | 0.35 |
| `upload`          | 20.7          | 13.8            | 1.50  | 0          | -                 | 4.5, 3, 21, 21        | 12.73, 13.49     | 191       | 1015             | phosphor/upload-simple       | 0.32 |
| `more-horizontal` | 4.4           | 3.6             | 1.22  | 0          | -                 | 4.5, 10.5, 19.5, 13.5 | 12, 12           | 157       | 982              | phosphor/dots-three          | 0.08 |
| `more-vertical`   | 4.4           | 3.6             | 1.22  | 0          | -                 | 10.5, 4.5, 13.5, 19.5 | 12, 12           | 156       | 984              | phosphor/dots-three-vertical | 0.08 |
| `filter`          | 16.4          | 11.6            | 1.41  | 0          | -                 | 4.5, 3, 21, 21        | 12.75, 8.24      | 219       | 1034             | lucide/split                 | 0.99 |
| `check-circle`    | 22.4          | 17.5            | 1.28  | 0.25       | path 1 / path 2   | 4.5, 4.5, 21, 21      | 12.6, 12.89      | 177       | 1003             | lucide/check-circle          | 0.36 |
| `alert-triangle`  | 23            | 15.9            | 1.45  | 0.25       | path 2 / path 3   | 3, 3, 22.5, 21        | 12.74, 14.54     | 176       | 1008             | lucide/baseline              | 0.52 |
| `alert-circle`    | 21.8          | 15.6            | 1.40  | 0.25       | path 2 / path 3   | 3, 3, 22.5, 21        | 12.75, 12.25     | 177       | 996              | tabler/alert-circle          | 0.18 |
| `info`            | 21.8          | 15.6            | 1.40  | 0.25       | path 2 / path 3   | 3, 3, 22.5, 21        | 12.75, 12.37     | 169       | 991              | lucide/badge-info            | 0.21 |
| `loader`          | 10.8          | 8.5             | 1.27  | 0          | -                 | 4.5, 4.5, 21, 21      | 14.7, 13.13      | 195       | 1024             | tabler/border-sides          | 2.53 |
| `lock`            | 24.1          | 16.3            | 1.48  | 0.25       | path 1 / path 3   | 4.5, 3, 21, 21        | 12.76, 13.39     | 211       | 1039             | lucide/lock                  | 0.50 |
| `eye`             | 21.5          | 14.6            | 1.47  | 0          | -                 | 4.5, 4.5, 21, 21      | 12.71, 12.76     | 200       | 1020             | tabler/gradienter            | 0.24 |
| `eye-off`         | 20.8          | 13.9            | 1.50  | 0          | -                 | 4.5, 6, 21, 19.5      | 12.74, 12.73     | 165       | 990              | phosphor/cloud-slash         | 0.85 |
| `lightning`       | 17.1          | 11.9            | 1.44  | 0          | -                 | 6, 1.5, 18, 22.5      | 12, 12.01        | 178       | 1019             | tabler/clef                  | 0.94 |
| `wallet`          | 26.1          | 20.2            | 1.29  | 0.25       | path 2 / path 3   | 3, 3, 21, 21          | 12.05, 12.52     | 201       | 1026             | phosphor/bag                 | 0.51 |
| `users`           | 26.1          | 19.4            | 1.35  | 0.25       | circle 1 / path 2 | 3, 4.5, 21, 21        | 12.13, 12.58     | 208       | 1031             | heroicons/users              | 1.07 |
| `bell`            | 19.9          | 13.8            | 1.44  | 0.25       | path 1 / path 2   | 4.5, 4.5, 21, 21      | 12.74, 13.12     | 231       | 1069             | lucide/bell                  | 0.31 |
| `duplicate`       | 29.4          | 20.3            | 1.45  | 0.25       | path 2 / path 3   | 3, 3, 21, 21          | 12.16, 12.17     | 223       | 1053             | lucide/copy-minus            | 0.38 |
| `file`            | 21.1          | 16.1            | 1.31  | 0          | -                 | 4.5, 3, 19.5, 21      | 11.6, 12.46      | 193       | 1000             | tabler/file                  | 0.48 |
| `file-audio`      | 25.5          | 21              | 1.21  | 0.13       | path 1 / circle 2 | 4.5, 3, 19.5, 21      | 11.68, 12.62     | 219       | 1039             | tabler/file-function         | 0.49 |
| `file-video`      | 26.6          | 19.8            | 1.34  | 0.25       | path 1 / path 2   | 4.5, 3, 19.5, 21      | 11.65, 12.6      | 202       | 1025             | tabler/file-unknown          | 0.50 |
| `script`          | 26.5          | 19.6            | 1.35  | 0.25       | path 2 / path 3   | 4.5, 3, 19.5, 21      | 11.56, 12.69     | 196       | 1022             | tabler/file-lambda           | 0.56 |
| `frame`           | 30.1          | 21.1            | 1.43  | 0.25       | path 6 / path 7   | 1.5, 3, 22.5, 21      | 12.11, 12        | 214       | 1046             | heroicons/window             | 0.51 |
| `timeline`        | 12.9          | 21.2            | 0.61  | 0          | -                 | 3, 4.5, 21, 21        | 11.91, 13.44     | 162       | 990              | tabler/corner-left-up-double | 2.42 |
| `volume`          | 22.5          | 17.7            | 1.27  | 0.25       | path 2 / path 3   | 3, 4.5, 21, 21        | 11.37, 12.75     | 199       | 1020             | tabler/volume                | 0.49 |
| `octopus`         | 24.6          | 20.9            | 1.18  | 0.25       | path 2 / path 3   | 3, 1.5, 22.5, 21      | 12.71, 11.73     | 251       | 1092             | phosphor/linux-logo          | 0.90 |
| `share`           | 11.7          | 14.8            | 0.79  | 0          | -                 | 4.5, 3, 21, 22.5      | 14.11, 12.75     | 183       | 1013             | tabler/math-lower            | 1.17 |

## Similarity

Masters within d = 0.30 of a third-party drawing are primitives that every set draws alike: the four chevrons, `plus`, `close` and `check`, as their line icons are. `alert-circle` (d = 0.18, `tabler/alert-circle`) and `info` (d = 0.21, `lucide/badge-info`) are conventions of spec section 3, item 5, a circle with a bar and a dot, as their line icons are (d = 0.06). [`similarity-sheet.png`](./similarity-sheet.png) shows every master beside its nearest references.

`eye` is at d = 0.24 from `tabler/gradienter`, a spirit level, not an eye. A solid pupil reaches d = 0.43 but turns the lids and the dot into a radio button at 16 px, so the ring stays.

## Sheets

The `masters-*.png` sheets show, for each icon, the line icon scaled to 16 px at 1x, the master at 16 px at 1x, both enlarged four times, the master's 16 px render blurred (Gaussian, 1 px), the master at 48 px on the light and the dark page, and the line icon at 24 px at 1x, enlarged three times.
