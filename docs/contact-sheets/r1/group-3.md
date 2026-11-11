# R1, group 3: lip-sync, folder-stack, agent, the aspect formats, extend, library

These drawings were weak concepts at 24 px on the dark page. Each item was drawn again in variants, shown beside the drawing it replaces in [`group-3-variants-a.png`](./group-3-variants-a.png) and [`group-3-variants-b.png`](./group-3-variants-b.png), and the delegated auditor chose one; `library` took a second round, in [`group-3-library.png`](./group-3-library.png). [`group-3.png`](./group-3.png) shows the chosen drawings.

## What each drawing fixes

| Icon                                                     | Was read as                | Now                                                                                                |
| -------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------- |
| `lip-sync`                                               | an eye, a fish             | lips with the line of the mouth from corner to corner, and two arcs of sound                       |
| `folder-stack`                                           | a folder and a loose scrap | two folders: the one behind shows its tab and its right side, apart from the front one by the cut  |
| `agent`                                                  | a cluttered badge          | a robot's head, with an antenna, two eyes and two ears                                             |
| `aspect-1-1`, `aspect-16-9`, `aspect-4-5`, `aspect-9-16` | "disabled", by their slash | the format's own rectangle, marked by two inner corner brackets                                    |
| `extend`                                                 | a box and an arrow         | a clip, a handle past its end and a short arrow outward: the end pulled to lengthen it             |
| `library`                                                | "0/"                       | two books with a label band near the top and a third leaning at 16 degrees toward them, on a shelf |

## Construction

- **`library`** is drawn at 87% of its size about the centre, which keeps it under the 21.5% ink ceiling: three outlined books and a shelf at full size measure 25 to 27%. Its books' base sits higher before the scaling so that every cut stays at least 1.5 after it. Three spines of different heights, the variant without a leaning book, read as a building or a bar chart, which B5 draws as `chart-bar`.
- **`library` filled** is drawn from its geometry: each outline grown by 0.75 (the books as rounded rectangles, the leaning one turned 16 degrees, the shelf as a band), with the label bands knocked out as rectangles. Skia's outline of the turned arcs measured 1022 bytes brotli; this one measures 319. Its **16 px master** keeps two books sharing a wall and the leaning one, without labels, which close at 16 px.
- **`folder-stack`** filled is the front folder made solid with the back folder as a band, built with Skia; its 16 px master stands the two folders 4.5 units apart on the pixel grid.
- **Rejected on the way.** A sparkle in an orbit for `agent` measures d = 0.30 against Tabler's `pokeball`, and the simplified hexagon d = 0.20 against `hexagon-plus`; corner brackets alone for the aspect formats measure d = 0.21 against Tabler's `border-corners` at 1:1; a clip with a plus segment for `extend` cannot keep the cut inside the segment, and an arrow leaving an open box reads as `log-out`.

## Measures

The cut is the smallest distance between two parts that do not touch, on the line drawing at 240 px. G and the ink of the 16 px masters are measured as for the B4c masters ([`../b4c/masters.md`](../b4c/masters.md)); d is the nearest drawing of Lucide, Tabler, Phosphor and Heroicons.

| Icon           | Cut  | Ink at 24 | 16 px master: ink, ratio, G | Nearest (d)                         |
| -------------- | ---- | --------- | --------------------------- | ----------------------------------- |
| `lip-sync`     | 1.53 | 14.1%     | none                        | 0.72                                |
| `folder-stack` | 1.6  | 20.1%     | 24.7%, 1.23, 0.25           | line 0.89, filled 0.54, master 1.11 |
| `agent`        | 1.6  | 13.8%     | none                        | 1.12                                |
| `aspect-1-1`   | 1.6  | 17.7%     | none                        | 0.59                                |
| `aspect-16-9`  | 1.5  | 17.2%     | none                        | 0.47                                |
| `aspect-4-5`   | 1.5  | 18.0%     | none                        | 0.55                                |
| `aspect-9-16`  | 1.5  | 17.2%     | none                        | 0.48                                |
| `extend`       | 1.6  | 12.4%     | none                        | 0.63                                |
| `library`      | 1.6  | 21.3%     | 29.6%, 1.39, 0.25           | line 0.91, filled 0.68, master 0.94 |
