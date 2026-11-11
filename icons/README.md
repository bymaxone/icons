# Drawing sources

Every icon of the set starts here, as an SVG drawing and a metadata file. Nothing in this
directory is published as it is: `pnpm generate` turns it into the components under
`src/**/generated`, and `pnpm build` into the raw SVG files, the sprite and `metadata.json`.

```
icons/
  line/<name>.svg      the 24 px line master of every non-brand icon (required)
  filled/<name>.svg    the filled variant, where the metadata declares it
  sm/<name>.svg        the hand-tuned 16 px master, where the metadata declares it
  brands/<name>.svg    a brand mark, in its owner's geometry
  meta/<name>.json     the metadata of every icon and brand, one file per name
```

A directory with no file yet does not exist; there is no placeholder. The icon lint
(`pnpm lint:icons`) reports anything else found here.

## Adding an icon

1. Draw `line/<name>.svg` on the 24 px grid (see the design language in
   [`../docs/technical_specification.md`](../docs/technical_specification.md) section 2).
   `<name>` is kebab-case American English and names what is depicted.
2. Write `meta/<name>.json` against [`../schemas/icon.schema.json`](../schemas/icon.schema.json):
   a short `label` (the accessible name when the icon stands alone), `tags`, `categories`
   (from [`../categories.json`](../categories.json)), at least two `useCases`, `variants`, `opticalSizes`, `since`, and any `aliases`. A brand mark uses
   [`../schemas/brand.schema.json`](../schemas/brand.schema.json) instead.
3. Add `filled/<name>.svg` or `sm/<name>.svg` only when the metadata declares that variant.
4. Run `pnpm generate`. It rewrites each SVG into its normalised form (the fixed root
   attributes, three decimals, one element per line), runs the icon lint, and writes the
   generated modules. Commit the sources and the generated modules together.
5. Run `pnpm contact-sheet` and review `reports/contact-sheet.png` at every size, on both
   pages and in every accent; `pnpm family-sheet --highlight <names>` shows the drawing
   beside the whole set, and `pnpm similarity --names <names>` its nearest third-party icons.
6. Run `pnpm check:visual --update` and commit the baselines it writes under `../visual/`.

## What a drawing may hold

- Elements: `path`, `line`, `polyline`, `polygon`, `circle`, `ellipse`, `rect`, directly
  under the root, each with its own geometry attributes only.
- No `transform`, `style`, `id`, `class`, `filter`, `<use>`, gradient or mask.
- Line and 16 px drawings fill nothing except the spark dot, a `circle` with `r="1"` and
  `fill="currentColor"`. Filled drawings and brand marks fill with `currentColor`; a
  brand whose metadata sets `multicolor` keeps its own `#rrggbb` colours.
- Numbers carry at most three decimals, and the geometry stays inside the 21 x 21 square
  centred on the canvas.
