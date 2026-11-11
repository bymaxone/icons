# B5e: text and development

The last sub-batch of B5. [`b5e-1.png`](./b5e-1.png) shows the 10 line drawings at 48 and at 24 and 16 px 1x on the dark and light pages, and blurred. The delegated auditor approved them on behalf of the founder.

## Language

- **`bold`, `italic` and `underline`** are the letters B, I and U built from the set's own 1.5 stroke, not taken from a font: the one accepted exception to "no part reads as a letter" (spec section 3.5).
- **`align-left`, `align-right` and `align-justify`** keep the four lines of `align-center` and change only how they align.
- **`columns`** is the frame of `sidebar` with a full divider in the middle; a loose divider reads as the letter I.
- **`code`** sets a short slash between two angle brackets, apart from them by the cut; `prompt` is a frame with a chevron and a cursor.
- **`branch` and `pull-request`** draw the git family as a graph of rings, each apart from its lines by the cut.
- **No 16 px master.** None fuses at 16 px.

## Similarity

`align-justify` (d = 0.28) is four equal lines, the same in every set. Every other drawing has d > 0.30.

## Measures

The cut is the smallest distance between two parts that do not touch, on the line drawing at 240 px; the ink is at 24 px, under the 21.5% ceiling; d is the nearest drawing of Lucide, Tabler, Phosphor and Heroicons.

| Icon            | Cut  | Ink at 24 | Nearest (d)                                   |
| --------------- | ---- | --------- | --------------------------------------------- |
| `bold`          | none | 13.1%     | 0.33 (tabler/bold)                            |
| `italic`        | none | 7.6%      | 0.45 (tabler/italic)                          |
| `underline`     | 2.6  | 11.5%     | 0.42 (tabler/underline)                       |
| `align-left`    | 3.1  | 13.9%     | 1.01 (tabler/mist)                            |
| `align-right`   | 3.1  | 13.9%     | 1.35 (lucide/align-vertical-distribute-start) |
| `align-justify` | 3.1  | 17%       | 0.28 (heroicons/bars-4)                       |
| `columns`       | none | 20.2%     | 0.40 (lucide/book-open)                       |
| `code`          | 2.37 | 10.5%     | 0.63 (heroicons/code-bracket)                 |
| `branch`        | 1.6  | 13.8%     | 1.41 (tabler/letter-p)                        |
| `pull-request`  | 1.6  | 15.8%     | 0.92 (tabler/git-pull-request)                |
