# The 16 px check

Every drawing of the set, rendered at 16 px and 1x with resvg, with two objective tests. The 16 px master of spec §2.1 is drawn for the icons that fail one of them, and for the icons the shell of the Studio shows at 16 px (spec §4.2).

## Parts that fuse

For every two distinct parts of a drawing (parts the vector keeps 0.5 units or more apart; attached parts are skipped), the parts are said to fuse when their inked pixels (alpha 0.5 or more) connect through pixels whose combined ink is 0.35 or more, or when a pixel carries both. A fused pair is a cut that no longer reads. The gap is the smallest distance between inked pixels of the two parts, less one pixel.

| Icon              | Smallest gap at 16 px (clear px) | Parts share a pixel | Pair |
| ----------------- | -------------------------------- | ------------------- | ---- |
| `copy`            | 0.00                             | yes                 | 0-1  |
| `duplicate`       | 0.00                             | yes                 | 0-1  |
| `file-audio`      | 0.00                             | yes                 | 0-1  |
| `file-video`      | 0.00                             | yes                 | 0-1  |
| `file`            | 0.00                             | yes                 | 0-1  |
| `frame`           | 0.00                             | yes                 | 0-6  |
| `lock`            | 0.00                             | yes                 | 0-1  |
| `timeline`        | 0.00                             | yes                 | 0-1  |
| `volume`          | 0.00                             | yes                 | 2-3  |
| `asset`           | 0.41                             | no                  | 0-1  |
| `layers`          | 0.41                             | no                  | 1-2  |
| `lip-sync`        | 0.41                             | no                  | 0-1  |
| `share`           | 0.41                             | no                  | 0-3  |
| `alert-circle`    | 1.00                             | no                  | 1-2  |
| `camera-motion`   | 1.00                             | no                  | 0-1  |
| `camera`          | 1.00                             | no                  | 0-1  |
| `captions`        | 1.00                             | no                  | 0-2  |
| `crop`            | 1.00                             | no                  | 0-1  |
| `dashboard`       | 1.00                             | no                  | 0-1  |
| `download`        | 1.00                             | no                  | 0-1  |
| `export-video`    | 1.00                             | no                  | 0-1  |
| `eye`             | 1.00                             | no                  | 0-2  |
| `filter`          | 1.00                             | no                  | 0-1  |
| `folder-stack`    | 1.00                             | no                  | 0-2  |
| `grid`            | 1.00                             | no                  | 0-2  |
| `hand`            | 1.00                             | no                  | 1-2  |
| `home`            | 1.00                             | no                  | 0-1  |
| `image`           | 1.00                             | no                  | 0-1  |
| `library`         | 1.00                             | no                  | 0-2  |
| `mask`            | 1.00                             | no                  | 0-1  |
| `mic-off`         | 1.00                             | no                  | 0-1  |
| `mic`             | 1.00                             | no                  | 0-1  |
| `narration`       | 1.00                             | no                  | 0-2  |
| `palette`         | 1.00                             | no                  | 0-1  |
| `queued`          | 1.00                             | no                  | 0-1  |
| `reference-card`  | 1.00                             | no                  | 0-1  |
| `render`          | 1.00                             | no                  | 0-2  |
| `scene`           | 1.00                             | no                  | 0-2  |
| `sidebar`         | 1.00                             | no                  | 0-1  |
| `skip-back`       | 1.00                             | no                  | 0-1  |
| `split`           | 1.00                             | no                  | 0-1  |
| `templates`       | 1.00                             | no                  | 0-1  |
| `text`            | 1.00                             | no                  | 0-1  |
| `trash`           | 1.00                             | no                  | 0-1  |
| `upload`          | 1.00                             | no                  | 0-1  |
| `user`            | 1.00                             | no                  | 0-1  |
| `version`         | 1.00                             | no                  | 0-1  |
| `video`           | 1.00                             | no                  | 0-1  |
| `voice`           | 1.00                             | no                  | 2-3  |
| `volume-off`      | 1.00                             | no                  | 0-1  |
| `waveform`        | 1.00                             | no                  | 0-1  |
| `zoom-in`         | 1.00                             | no                  | 0-2  |
| `zoom-out`        | 1.00                             | no                  | 0-2  |
| `alert-triangle`  | 1.24                             | no                  | 0-1  |
| `cloud-check`     | 1.24                             | no                  | 0-1  |
| `eraser`          | 1.24                             | no                  | 0-1  |
| `eye-off`         | 1.24                             | no                  | 0-2  |
| `history`         | 1.24                             | no                  | 0-1  |
| `keyframe`        | 1.24                             | no                  | 0-1  |
| `link`            | 1.24                             | no                  | 0-2  |
| `loader`          | 1.24                             | no                  | 0-1  |
| `loop`            | 1.24                             | no                  | 0-1  |
| `repair`          | 1.24                             | no                  | 0-1  |
| `search`          | 1.24                             | no                  | 0-1  |
| `check-circle`    | 1.83                             | no                  | 0-1  |
| `clock`           | 1.83                             | no                  | 1-2  |
| `folder`          | 1.83                             | no                  | 0-1  |
| `move`            | 1.83                             | no                  | 0-2  |
| `scissors`        | 1.83                             | no                  | 1-2  |
| `align-center`    | 2.00                             | no                  | 0-1  |
| `extend`          | 2.00                             | no                  | 0-1  |
| `fullscreen`      | 2.00                             | no                  | 1-3  |
| `grip`            | 2.00                             | no                  | 0-1  |
| `info`            | 2.00                             | no                  | 0-2  |
| `minimize`        | 2.00                             | no                  | 0-1  |
| `pause`           | 2.00                             | no                  | 0-1  |
| `pin`             | 2.00                             | no                  | 0-1  |
| `settings`        | 2.00                             | no                  | 0-1  |
| `skip-forward`    | 2.00                             | no                  | 0-1  |
| `transition`      | 2.00                             | no                  | 0-1  |
| `music`           | 2.16                             | no                  | 1-2  |
| `brush`           | 2.61                             | no                  | 0-1  |
| `pencil`          | 2.61                             | no                  | 0-1  |
| `shot`            | 2.61                             | no                  | 3-4  |
| `menu`            | 3.00                             | no                  | 0-1  |
| `more-horizontal` | 3.00                             | no                  | 0-1  |
| `more-vertical`   | 3.00                             | no                  | 0-1  |
| `refresh`         | 3.00                             | no                  | 0-1  |
| `sort`            | 3.47                             | no                  | 0-1  |

## Interiors that close

A closed part keeps its interior when at least two of the pixels inside it carry less than 0.35 of ink. Solid dots (`grip`, `more-horizontal`, `more-vertical`) and the small circles that read as dots at this size (the sun of `image`, the head of the note of `file-audio`, the centre of `keyframe`) are listed and need no master.

| Icon              | Part | Interior pixels clear |
| ----------------- | ---- | --------------------- |
| `file-audio`      | 3    | 0 of 4                |
| `grip`            | 2    | 0 of 1                |
| `grip`            | 5    | 0 of 1                |
| `image`           | 2    | 0 of 3                |
| `keyframe`        | 1    | 0 of 4                |
| `more-horizontal` | 0    | 0 of 1                |
| `more-vertical`   | 0    | 0 of 1                |
| `share`           | 1    | 1 of 7                |
| `share`           | 2    | 1 of 4                |
