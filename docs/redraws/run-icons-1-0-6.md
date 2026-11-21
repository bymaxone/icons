# Redraws for the first consumer (1.0.6)

The first consumer of the package, a running app, measured every icon it shows against the optical balance rule (spec section 2.5: a 20 px circle, an 18 px square and a 21 px triangle read as the same size). Each drawing below sat well inside the circle and the square of the set (ink 18.5 and 17.5 units wide) and was drawn larger, about the same shape, within the live area and the ink ceiling.

- `star`: 18.3 units wide, now 20.3; the filled variant follows (approved by the auditor for the founder, 2026-11-21)
- `heart`: 18.0 units wide, now 20.0 (19.5 filled, which the live area bounds). The similarity check flags the line heart (d=0.05 against `phosphor/heart-straight`; it was 0.10 before), and the flag stays: a heart is a convention, the drawing is the one that was already in the set, and a normalised score cannot move under a uniform scaling; the filled variant follows (approved by the auditor for the founder, 2026-11-21)
- `eye`: the lids were 16.0 units wide, now 19.0; the filled variant follows (approved by the auditor for the founder, 2026-11-21)
- `user`: the bust was 15.5 units wide, now 16.8; the filled variant follows (approved by the auditor for the founder, 2026-11-21)
- `plus`: the arms were 14.5 units, now 16.5, with `close` and `minus` following so the three keep one size (approved by the auditor for the founder, 2026-11-21)
- `close`: follows `plus` (approved by the auditor for the founder, 2026-11-21)
- `minus`: follows `plus` (approved by the auditor for the founder, 2026-11-21)
- `leaf`: 16.5 by 15.5 units, now 17.8 by 16.5 (approved by the auditor for the founder, 2026-11-21)

## Evaluated and left as they are

The consumer's second list, judged against the same rule on the family sheet. Each ink size is the drawing with its stroke, in units of the 24 grid.

| Icon        | Ink size, ink share | Decision  | Reason                                                                                                                                                                                                                  |
| ----------- | ------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `refresh`   | 17.0 × 17.0, 13.9%  | no change | Within a unit of the square (17.5) and of the circle (18.5); a ring of arrows grows into the ceiling                                                                                                                    |
| `bell`      | 17.5 × 17.9, 13.8%  | no change | Equal to the square and the circle                                                                                                                                                                                      |
| `pencil`    | 17.1 × 17.1, 11.6%  | no change | A diagonal reads larger than its box; at the square's size already                                                                                                                                                      |
| `watch`     | 13.5 × 19.5, 17.3%  | no change | A tall object: its height is the largest of the list, and 20 units tall is the triangle's size                                                                                                                          |
| `chart-bar` | 18.0 × 18.0, 15.7%  | no change | Between the square and the circle                                                                                                                                                                                       |
| `globe`     | 16.0 × 16.0, 21.15% | no change | A larger ring with every line is over the 21.5% ceiling; the largest ring that fits keeps only the equator and one meridian (18.5 wide, 21.09%) and reads as a split circle, weaker at 16 px than the globe it replaces |
| `clock`     | 18.5 × 18.5, 17.7%  | no change | The circle's size; a round `clock-round` was added in 1.0.5                                                                                                                                                             |
| `search`    | 19.5 × 19.5, 14.7%  | no change | The largest square in the set, a longer handle would pass the live area                                                                                                                                                 |
| `mountain`  | 20.0 × 12.5, 14.5%  | no change | Wide and low like the triangle; as much ink as its neighbours, a taller peak adds a new shape                                                                                                                           |
| `moon`      | 19.0 × 19.0, 18.2%  | no change | Larger than the circle; the plain `moon-crescent` was added in 1.0.5                                                                                                                                                    |
| `upload`    | 17.5 × 18.5, 13.8%  | no change | The square's size; the alias `share-sheet` was added in 1.0.5                                                                                                                                                           |
| `walk`      | 13.0 × 19.8, 11.7%  | no change | A figure is tall by nature, at the triangle's height; its stride is its meaning                                                                                                                                         |
| `scissors`  | 18.3 × 18.0, 15.6%  | no change | Between the square and the circle; a joined pivot is not needed now that nothing in the app uses it                                                                                                                     |

A 16 px master for `clock-round` was tried and not kept: with its ticks dropped, the ring and hands score d=0.07 against `tabler/clock-hour-4` in the similarity check, and the ticks do not fit at 16 px.
