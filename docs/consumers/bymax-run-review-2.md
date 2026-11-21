# Bymax Run icon review 2: after the switch to `@bymax-one/icons` 1.0.6

Second handoff from the first consumer of the package. The first review (`bymax-run-icon-review.md`, audited on 1.0.3) was answered by 1.0.5 and 1.0.6. This one was written after the switch: the app prototype now draws only package icons.

Sheets that go with this file: `bymax-run-icons-1.0.6-closeup.png` (the icons named below at 48, 20, 16 and 14 px, each beside `calendar` at 20 px) and `bymax-run-icons-1.0.6-all-1.png` / `-all-2.png` (every line icon the app shows, at 20 px and at 14 px).

## 1. Where the app stands

- 94 screens, 2,224 icon uses, 160 icons, 161 meanings. No placeholder drawing is left.
- 1,927 uses are line icons, 262 use a 16 px master, 21 use a filled variant (`star`, `heart`) and 14 are brand marks. The start button uses filled `play`, and the sign-in buttons use `apple` and `google`.
- Line icons are drawn with a 1.7 stroke on the 24 grid, a decision of the founder. 16 px masters keep their own stroke and are used at 16 px or less.
- Sizes on screen go from 11 to 44 px. Most uses are at 18 and 20 px.
- Every size below is ink: the drawing with its 1.5 stroke, in units of the 24 grid. "Uses" counts places in the 94 screens.

Confirmed at the app's sizes, nothing to ask: `running-shoe`, `crown` (line, filled and 16 px), `comb` at 20 px and above, `star`, `heart`, `eye`, `user`, `plus`, `close`, `minus`, `leaf`, `clock-round` at 16 px and above, `moon-crescent`, `upload` as the share mark, `strava`, `health-connect`, `apple-health`. The chevrons (7.5 × 13.5, 408 uses) are smaller than the placeholders were, and that is the usual size of a chevron, so the app sets the size where it needs more.

## 2. First: meaning or reach at stake

| Icon                    | Uses | Sizes (px) | Ink         | What happens in the app                                                                                                                                                                                                                                     | Suggestion                                                                                                                                                     |
| ----------------------- | ---- | ---------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `whistle`               | 53   | 18 to 26   | 19.0 × 17.8 | It is the mark of the coach and the coaching group, the second most used meaning icon, after `crown`. The box is full, but the three sound ticks take the top left third, so the body is about 13 units wide and reads small beside `calendar` or `target`. | Grow the body to about 16 units. Keep the ticks short or drop them in a 16 px master.                                                                          |
| `square-arrow-up-right` | 33   | 15 to 20   | 17.5 × 17.5 | 25 of the 33 uses are at 15 or 16 px, with no 16 px master: it is the "opens outside the app" mark on rows and links.                                                                                                                                       | Add a 16 px master.                                                                                                                                            |
| `link`                  | 5    | 16 to 20   | 14.7 × 14.7 | The smallest meaning icon in the app. It is drawn 30% larger to sit beside its neighbours.                                                                                                                                                                  | Grow to about 18 units on the diagonal. The two links read well, it is only the size.                                                                          |
| `garmin`                | 3    | 20         | wordmark    | The app shows each connection in a 40 px tile. At 37 px, the most that fits, the letters are about 5 px tall and do not read. The other three marks (`strava`, `health-connect`, `apple-health`) read well in the same tile.                                | A compact mark for tiles, if the owner's rules allow one. If they do not, say so in the metadata and the app keeps `watch` in the tile and the name beside it. |
| `dice`                  | 1    | 17         | 19.2 × 18.5 | It is "Surprise me" in the avatar builder. The second square behind the die makes it read as `duplicate` with dots.                                                                                                                                         | One die alone, larger, with the pips.                                                                                                                          |
| `google`                | 2    | 26         | brand       | One colour. Google's sign-in rules ask for the standard colour mark on the button.                                                                                                                                                                          | A note in the metadata, or a colour variant for sign-in buttons.                                                                                               |

## 3. 16 px masters that are missing

Line icons the app shows at 16 px or less, where the package has no 16 px master. Uses at those sizes only.

| Icon                                                                                   | Uses at 16 px or less | Sizes (px) | Note                                                      |
| -------------------------------------------------------------------------------------- | --------------------- | ---------- | --------------------------------------------------------- |
| `square-arrow-up-right`                                                                | 25                    | 15, 16     | Listed in section 2                                       |
| `play`                                                                                 | 8                     | 14         | Workout rows                                              |
| `loop`                                                                                 | 7                     | 16         | Repeats in a workout                                      |
| `shield-check`                                                                         | 6                     | 14, 16     | Trust notes under buttons                                 |
| `translate`                                                                            | 5                     | 14         | Language chip. The two glyphs close up at 14 px           |
| `running-shoe`                                                                         | 4                     | 16         | The lace ticks close up at 16 px                          |
| `cloud-upload`                                                                         | 3                     | 16         |                                                           |
| `run`, `fire`, `snowflake`                                                             | 2 each                | 14         | Warm up, run and cool down, in one row on the home screen |
| `map-pin`                                                                              | 2                     | 16         |                                                           |
| `medal`                                                                                | 1                     | 12         | Record tag                                                |
| `target`, `calendar-clock`, `watch`, `pause`, `award`, `hourglass`, `chevrons-up-down` | 1 each                | 15, 16     |                                                           |

`clock-round` has no 16 px master either (1.0.6 explains why). Under 16 px the app falls back to `clock`, so the same app shows two clock faces. One use today, so this is low.

## 4. Drawings that sit small in the box

The app draws these 12% larger to match their neighbours. Each is under 17 units on its longest side, or narrow.

| Icon                                | Uses   | Ink                                   | Suggestion                                                                                                                                                   |
| ----------------------------------- | ------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pencil`                            | 22     | 17.0 × 17.0                           | Grow to about 18.5. 1.0.6 kept it because a diagonal reads larger than its box, but at 18 to 22 px it still reads smaller than `trash` and `copy` beside it. |
| `refresh`                           | 14     | 17.0 × 17.0                           | Same case. Beside `calendar` at 20 px it reads one size down.                                                                                                |
| `lifebuoy`                          | 5      | 16.5 × 16.5                           | Grow to the circle's size, 18.5.                                                                                                                             |
| `library`                           | 5      | 16.7 × 15.2                           | Grow to about 18 wide.                                                                                                                                       |
| `stethoscope`                       | 3      | 15.5 × 17.2                           | Grow, and centre it: its centre is at 13.25, 11.12.                                                                                                          |
| `key`, `undo`                       | 2 each | 17.2 × 17.2, 16.8 × 15.2              | Grow by about a unit.                                                                                                                                        |
| `skip-forward`, `list`, `templates` | 1 each | 15.0 × 15.0, 16.0 × 13.5, 17.0 × 16.0 | Grow by about a unit.                                                                                                                                        |
| `medal`                             | 8      | 11.5 × 18.5                           | Narrow. A wider disc, about 13.5 units, would hold at 12 to 16 px.                                                                                           |
| `award`                             | 2      | 13.0 × 19.0                           | Same as `medal`.                                                                                                                                             |

## 5. Wide and low drawings

These fill the width and leave half the box empty. In a round or square tile they read small, and two of them sit low.

| Icon                      | Uses   | Ink                     | Centre (x, y) | Suggestion                                                                                         |
| ------------------------- | ------ | ----------------------- | ------------- | -------------------------------------------------------------------------------------------------- |
| `podium`                  | 6      | 19.5 × 11.5             | 12.25, 15.25  | It sits 3 units low. The app lifts it by 3. Centre it, or make the steps taller.                   |
| `mountain`                | 2      | 20.0 × 12.5             | 12.00, 14.25  | It sits 2 units low. The app lifts it by 2. 1.0.6 kept the shape, so the ask is only to centre it. |
| `speedometer`             | 4      | 18.80, 12.38            |               | It is the effort mark at 17 to 22 px. A taller dial, about 14 units, would read at 17 px.          |
| `glasses`                 | 2      | 18.5 × 10.8             | 12.25, 13.13  | Larger lenses, and centre it.                                                                      |
| `activity`                | 2      | 19.0 × 13.0             | 12.00, 12.25  | Taller peaks.                                                                                      |
| `infinity`, `trending-up` | 1 each | 18.5 × 8.5, 18.0 × 12.0 | centred       | Low priority.                                                                                      |

`cloud-upload` (centre y 13.78) and `gift` (centre y 13.40) also sit low, by less than 2 units. The app does not correct them.

## 6. Detail that closes up at the app's sizes

Seen at 1.7 stroke. Worth a look on the family sheet at 16 and 20 px.

- `calendar-clock` (8 uses, 16 to 20 px): the clock badge fills in at 16 px.
- `regenerate` (4 uses, 17 to 20 px): the sparkle inside the arrow fills in under 20 px.
- `replace` (1 use, 20 px): two boxes and two arrows, busy at 20 px.
- `wifi-off` (5 uses, 18 px): the dashed arcs under the slash turn to noise at 18 px.
- `thermometer-hot` (1 use, 20 px): the heat waves touch the stem.
- `comb` (2 uses, 22 px): good at 22 px. At 16 px and under the five teeth merge, so it needs a 16 px master with three teeth if it is ever used small.
- `pencil` 16 px master: it reads as a filled pencil, much heavier than the line `pencil` at 18 px on the same screen. A 16 px master closer to the line drawing would keep the two alike.

## 7. What the app does until then

So nothing here blocks the app. These are the workarounds in place, each to be removed when the drawing changes:

- size + 30% for `link`; + 12% for `pencil`, `refresh`, `lifebuoy`, `library`, `stethoscope`, `key`, `undo`, `list`, `templates`; + 15% for `skip-forward`;
- `podium` lifted by 3 units and `mountain` by 2;
- `clock` in place of `clock-round` under 16 px;
- `garmin` at 37 px inside its 40 px tile;
- tab bar icons at 26 px.

## 8. Checklist

- [ ] `whistle`: larger body
- [ ] `square-arrow-up-right`: 16 px master
- [ ] `link`: larger
- [ ] `garmin`: compact mark, or a note that there is none
- [ ] `dice`: one die
- [ ] `google`: note on sign-in rules, or a colour variant
- [ ] 16 px masters: `play`, `loop`, `shield-check`, `translate`, `running-shoe`, `cloud-upload`, `run`, `fire`, `snowflake`, `map-pin`, `medal`
- [ ] larger: `pencil`, `refresh`, `lifebuoy`, `library`, `stethoscope`, `key`, `undo`, `skip-forward`, `list`, `templates`, `medal`, `award`
- [ ] centred or taller: `podium`, `mountain`, `speedometer`, `glasses`, `activity`
- [ ] look at 16 and 20 px: `calendar-clock`, `regenerate`, `replace`, `wifi-off`, `thermometer-hot`, `comb`, the 16 px `pencil`
