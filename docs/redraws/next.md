# Redraw programme: where it stopped, and what comes next

The founder stopped the redraw programme after wave 1 (release 1.0.7) and will continue with another agent. This is the handoff. Nothing below has been started.

## State

- Released: 1.0.5 (first consumer's required part), 1.0.6 (16 px masters and larger drawings), 1.0.7 (wave 1: the figures and the link family). Every release is a 1.0.x patch; the founder forbids minor or major bumps.
- The consumer is Bymax Run, a running app. Its two reviews are in this repository: [`../consumers/bymax-run-review-2.md`](../consumers/bymax-run-review-2.md) is the second, written after the switch to 1.0.6, and its text is the source of the Run 2 list below. The first review was answered by 1.0.5 and 1.0.6.
- Design approval is the design auditor's, delegated by the founder, at catalogue size: 24 px at 1x in the real catalogue cell, with the neighbours, in light and dark. Shape redesigns (a drawing that changes its idea, not its size) are picked by the founder from labelled candidates.

## Process rules

1. Candidate sheets are labelled: a visible label under every drawing ("A", "B", "A · 20°") and under the reference columns ("atual", the neighbour's name), so the founder can pick by letter. Each candidate is shown at 192 px (construction check: joints meet, nothing floats, no stray hook, symmetric where the object is) and at true 24 px 1x in light and dark, beside its family.
2. Every drawing is also looked at with a 1.7 stroke, the app's weight, and at 16 and 20 px.
3. The bar: shown alone at 20 px a person names it; the construction is sound at 192 px; it sits with its family on the family sheet; `pnpm lint:icons`, the ink ceiling, the live area and `pnpm check:sixteen` pass; `pnpm similarity` shows no flag under 0.25 for a new or changed drawing (a flag that was already on main, or a primitive, is explained in the manifest); a 16 px master is added where the 24 px drawing fails the blur test; the filled variants follow and stay filled; `check:visual --update` changes only the named icons.
4. Every changed existing drawing is named, with its reason and its approval, in a manifest `docs/redraws/<name>.md`; the approval line reads "(approved by the founder, <date>)" or "(approved by the auditor for the founder, <date>)". `docs/redraws/run-icons-1-0-7.md` is the model.
5. Each release is one pull request, with a version bump, a `## [x.y.z]` CHANGELOG section and an `#### Apply to a consumer` note that lists every new name and every name whose shape changed. The bounded Claude plus Codex review runs first. The auditor's OK comes before the merge, and a later change in behaviour comes back to the auditor.
6. Everything is drawn from scratch with no third-party set open, and the originality box of the PR template is ticked. Brand marks are the exception to drawing: the owner's own geometry, scaled as a whole. When an owner's guideline conflicts with what the founder asked for a brand mark, write the risk in one line in the report and proceed; keep the metadata truthful (`source`, `license`) and record the mark like every other brand, with no exception framing.

## Run 2, release 1.0.8 (before the animals, because the consumer comes first)

The numbers are in the second review; the auditor's triage is:

1. `whistle`: grow the body to about 16 units, shorten the ticks, add a 16 px master without the ticks.
2. 16 px masters: `square-arrow-up-right`, `play`, `loop`, `shield-check`, `translate`, `running-shoe` (the laces must not close), `cloud-upload`, `fire`, `snowflake`, `map-pin`, `medal`, `comb` (three teeth). Judge `target`, `calendar-clock`, `watch`, `pause`, `award`, `hourglass` and `chevrons-up-down`, and add a master only where the 24 px drawing fails the blur test at 15 to 16 px.
3. Larger: `pencil` and `refresh` to about 18.5 (the app measured them one size down beside `calendar`, `trash` and `copy`, and its measurement outweighs the 1.0.6 reasoning that a diagonal reads larger), `lifebuoy` to 18.5, `library` to about 18 wide, `stethoscope` grown and centred (its centre is 13.25, 11.12), `key`, `undo`, `skip-forward`, `list` and `templates` up about a unit, `medal` and `award` with a wider disc (about 13.5). (`link` and the run 16 px master were already done in 1.0.7.)
4. Centring or height: `podium` (centre it, it is 3 units low), `mountain` (centre it, 2 units low), `speedometer` (a taller dial, about 14), `glasses` (larger lenses, centred), `activity` (taller peaks); `infinity` and `trending-up` only if trivial.
5. Detail at small sizes, judged on the family sheet at 16 and 20 px with a 1.7 stroke: `calendar-clock` badge, the `regenerate` sparkle, `replace`, the `wifi-off` dashes, the `thermometer-hot` waves touching the stem, and a lighter `pencil` 16 px master closer to the line drawing.
6. `dice`: one die, larger, with pips. It reads as `duplicate` now.
7. Brands, no drawing except `garmin-mark`:
   - The mark `garmin-mark` (or the name the brand naming rule prefers): a new compact brand mark, the delta of the Garmin logo, taken unaltered from the Simple Icons 16.38.0 `garmin` path, uniformly scaled into the live area. The path has a separable delta: with `svgpathtools` the path splits into 13 continuous subpaths and the delta is the ninth (index 8), spanning x 19.75 to 22.35 and y 8.75 to 11.05 on the 24 grid of that file. `garmin` (the wordmark) stays. It must read in the app's 40 px connection tile and at 20 px; if the delta alone does not read as Garmin at 20 px, show the auditor before going further. Metadata like every brand (source the Simple Icons file, `guidelines`, `retrievedAt`, `license` CC0-1.0 as Simple Icons states for it), tags including `compact`, the usual `TRADEMARKS.md` row and `docs/brands/guidelines-evidence.md` row. Garmin's API brand guidelines say not to alter the logo: that is the one-line risk for the report.
   - The note for `google`: a note that Google's sign-in branding requires Google's own colour button asset; the package mark is monochrome and is not for sign-in buttons. No colour variant (the package is `currentColor` only). The brand schema has no field for notes: the smallest truthful addition is an optional `note` string in `schemas/brand.schema.json`, carried into `BRAND_METADATA`, with its spec; add the same note to `garmin` for the wordmark.

For every item record what changed and what did not, with the reason.

## Animals, release 1.0.9

First fix one animal system and write it in `docs/technical_specification.md` section 2 (this is the auditor's decision):

- Mammals and quadrupeds are full-body side profiles on one construction: a spine, a head that carries the animal's defining feature, legs from two joint points, a tail. The silhouette carries identity, so no two animals share a face (today `cow`, `pig` and `hippo` share one "robot face").
- A front head is used only for `bear`, `cat`, `fox`, `koala` and `panda`, which already read.
- Birds are side profiles on one body shape.
- Each animal gets its defining features: camel humps, elephant trunk and ears, giraffe long neck and ossicones, rhino horn, moose palmate antlers, toucan bill, swan S-neck, ostrich long legs and neck, and so on.

The list to redraw: `cow`, `pig`, `hippo`, `camel`, `elephant`, `rhino`, `moose`, `giraffe`, `goat`, `dog`, `dinosaur`, `bird`, `eagle`, `swan`, `toucan`, `ostrich`; and from the weaker group (to evaluate first): `bat`, `frog`, `horse`, `lion`, `monkey`, `penguin`, `rabbit`, `sheep`, `shark`, `turtle`, `wolf`.

## Objects, release 1.0.10

`atm`, `binoculars`, `bridge`, `bunk-bed`, `caravan`, `cctv`, `chair`, `chisel`, `clover`, `cloud-moon`, `crane`, `football-helmet`, `hand-fist`, `helicopter`, `hockey`, `island`, `kebab`, `meteor`, `motorboat`, `pineapple`, `pretzel`, `rocket-launch`, `rocking-chair`, `scissors` (blades joined at the pivot, ring handles), `steering`, `umbrella-closed`, `volleyball`, `waterfall`.

## What wave 1 taught (read before drawing a figure or a chain)

- Figures: head ring r 1.75 (r 1.5 in `treadmill`), the spine starts 4.75 from the head centre (the 3 unit cut plus the radius), both arms start at the shoulder point and both legs at the hip point, every joint is a shared corner. Limbs that hang along the torso read as part of it: swing them out (`walk`). A head that is too close to a limb fuses at 16 px (`swimming` failed `check:sixteen` at 4 units).
- Chains: Two interlocking ovals are drawn with the over and under cut at the crossing. Elongated ovals cross at a shallow angle, so the 3 unit cut runs long; the family variants must be drawn at the link's full size, not scaled down, or the strands shred. In `link-off` the strands stop short of the slash.
- Scaling an existing drawing is done on the path (a transform applied by SVGO `convertPathData`), not on the file's stroke. Growing a drawing is bounded by the live area and by the ink ceiling (`globe` could not grow).
- A normalised similarity score cannot move under a uniform scaling; a convention (a heart, a plus) stays flagged by the same distance it had on main.
- A figure must not float in the filled or the 16 px variant either: the 16 px master of `run` is the skeleton of the 24 px drawing with a heavier stroke, a head of the same radius and shorter limbs, kept within 1.5 times the line icon's ink.
- Shell and tool notes: zsh does not split an unquoted variable (`${=names}`); `pnpm similarity --names` and the visual tools read the repository's `icons/` folder, so a trial drawing is copied there under a temporary kebab-case name and removed afterwards; `check:redraws` needs the manifest committed.
