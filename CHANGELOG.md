# Changelog

All notable changes to `@bymax-one/icons` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

The `release.yml` workflow extracts the section matching the pushed `vX.Y.Z` tag
as the GitHub Release body, so each released version needs a matching
`## [X.Y.Z]` heading here. Every release section lists the icons it added, renamed
and deprecated, each rename with the alias that keeps the old name working.

## [Unreleased]

### Changed

- The categories follow one taxonomy, fixed before the set grows: 28 categories,
  replacing the Studio's grouping. `credits-billing` joins `commerce`,
  `formats` joins `media`, and `places-devices` splits into `devices`, `maps` and
  `connectivity`; `arrows`, `text`, `time`, `emotions`, `tools`, `nature`, `games`, `math`,
  `transport` and `health` are new, and `data-charts`, `ai-agent`, `editor-canvas`, `people-roles`,
  `media-video` and `audio-voice` are renamed `data`, `ai`, `editing`, `people`, `media` and
  `audio`. An icon may belong to two categories.
- `queued` is renamed `hourglass`, the object it draws. `queued` stays a deprecated alias,
  removed in 2.0.0: `QueuedIcon` still renders the hourglass.
  Apply to a consumer: import `HourglassIcon`, or the subpath `./icons/hourglass`, instead
  of `QueuedIcon`.
- Six icons are renamed to the object each draws; the drawings are unchanged. Each old name stays
  a deprecated alias, removed in 2.0.0, whose component still renders the drawing:
  - `accent` is renamed `droplet`;
  - `agent` is renamed `robot`;
  - `variations` is renamed `shapes`, which also joins the `shapes` category;
  - `plan` is renamed `stairs`;
  - `spending-cap` is renamed `speedometer`;
  - `sort` is renamed `arrow-up-down`, which also joins the `arrows` category.

  Apply to a consumer: import `DropletIcon`, `RobotIcon`, `ShapesIcon`, `StairsIcon`,
  `SpeedometerIcon` and `ArrowUpDownIcon`, or their `./icons/<name>` subpaths, instead of
  `AccentIcon`, `AgentIcon`, `VariationsIcon`, `PlanIcon`, `SpendingCapIcon` and `SortIcon`.

- `octopus` is labelled Octopus, the animal it draws, instead of Agent; `agent` is one of its
  tags.

### Added

- Shapes, arrows and media (B6-A1): `square`, `circle`, `triangle`, `diamond`,
  `pentagon`, `hexagon`, `octagon`, `star-half`, `asterisk`, `infinity`, `divide`,
  `copyright`, `arrow-up-left`, `arrow-down-left`, `arrow-down-right`, `arrow-up-circle`,
  `arrow-down-circle`, `arrow-left-circle`, `arrow-right-circle`, `shuffle`, `forward`,
  `play-circle`, `pause-circle`, `stop-circle`, `disc` (alias `cd`), `radio` and `film`
  (alias `movie`), and the category `shapes`. `star-half` is the first line icon to fill a
  partial state.
- The aliases `repeat` (`loop`), `credit-card` (`card`), `shopping-cart` (`cart`), `bar-chart`
  (`chart-bar`), `pie-chart` (`chart-pie`), `cube` (`asset`), `help-circle` (`help`) and
  `wrench` (`repair`).
- Devices, files and calendar (B6-A2): `tv`, `screen-cast` (aliases `cast`, `airplay`),
  `speaker`, `mouse`, `watch`, `calculator`, `barcode`, `scan`, `battery-charging`,
  `battery-full`, `battery-low`, `feed` (alias `rss`), `location-arrow` (alias `navigation`),
  `usb-plug` (alias `usb`), `folder-minus`, `folder-check`, `file-minus`, `calendar-check`,
  `calendar-minus`, `commit` (alias `git-commit`), `merge` (alias `git-merge`) and `bug`.
- Objects, science, transport and nature (B6-A3): `book`, `newspaper` (alias `news`),
  `megaphone` (alias `announcement`), `ticket`, `trophy`, `medal`, `hammer`, `ruler`, `magnet`,
  `microscope`, `atom`, `binoculars`, `thermometer` (alias `temperature`), `car`, `bus`, `train`,
  `rocket` (alias `launch`), `anchor`, `hospital`, `bed`, `umbrella`, `leaf`, `flower`,
  `feather`, `skull`, `dice` (alias `random`), `cake` (alias `birthday`), `cookie` and `egg`,
  and the categories `science`, `food` and `household`.
- Food, nature, transport and currencies (B6-B3): `blender`, `chef-hat`, `coffee`, `ice-cream`, `pizza`, `fish`, `fire`, `tree`, `snowflake`, `cloud-snow`, `wind`, `tornado`, `rainbow`, `sunrise`, `sunset`, `planet`, `airplane`, `bicycle`, `scooter`, `tram`, `balloon`, `basketball`, `school`, `route`, `currency-dollar`, `currency-euro`, `currency-pound`, `currency-rupee` and `currency-real`.
- Objects, science and health (B6-B2): `backpack`, `brain`, `cash`, `dna`, `drone`, `flask`, `beaker`, `test-tube`, `glasses`, `lamp`, `lightbulb`, `piggy-bank`, `puzzle`, `recycle`, `scale`, `weight`, `stethoscope`, `virus`, `ambulance`, `pill`, `lifebuoy`, `luggage`, `mailbox`, `nut`, `safe`, `shirt`, `telescope`, `tools`, `plug`, `door-open`, `desk`, `sofa`, `podium`, `ear`, `flashlight`, `bomb`, `sword` and `certificate`.
- Interface, files and editing (B6-B1): `file-check`, `file-code`, `file-search`, `file-lock`,
  `files` (alias `documents`), `folder-lock`, `calendar-plus`, `calendar-heart`,
  `clipboard-check`, `bookmark-check`, `shield-plus`, `plus-square`, `user-circle`, `user-square`,
  `phone-incoming`, `phone-outgoing`, `webcam`, `router`, `network` (alias `sitemap`), `radar`,
  `signal`, `webhook`, `translate`, `presentation` (alias `slides`), `function` (alias `formula`),
  `variable`, `subscript`, `equal` (alias `equals`), `slash` (alias `line`), `border-top`,
  `border-bottom`, `border-left`, `border-right`, `flip-horizontal`, `flip-vertical`, `contrast`,
  `lightning-off` (alias `flash-off`), `voicemail`, `signature` (alias `sign`), `backspace`
  (alias `delete-left`), `eject`, `fast-forward`, `rewind`, `arrow-left-right` (alias `swap`),
  `reply` and `crosshair` (alias `locate`).
- The aliases `at` (`at-sign`), `attachment` (`paperclip`), `funnel` (`filter`), `maximize`
  (`fullscreen`), `microphone` (`mic`), `music-note` (`music`), `group` (`users`), `chat`
  (`message`), `volume-mute` (`volume-off`), `x-circle` (`close-circle`), `git-fork` (`branch`),
  `stack` (`layers`), `file-music` (`file-audio`), `stars` (`sparkle`), `hash` (`grid`),
  `cylinder` (`database`), `resize` (`resolution`), `aspect-ratio` (`aspect-16-9`), `language`
  (`globe`) and `album` (`disc`).

- The twelve keystone icons, which fix the design language of the set: `home`, `search`,
  `play`, `plus`, `close`, `check`, `settings`, `user`, `file`, `folder`, `lightning` and
  `scene` (components `HomeIcon` to `SceneIcon`, from the root and from
  `./icons/<name>`), with their raw SVG files, sprite symbols and metadata. Their
  signature is a 1.5 px cut that keeps distinct parts from touching: the door of `home`,
  the handle of `search`, the head of `user`, the crease of `file`.
- The navigation, action and status icons, 44 drawings in the same language. Navigation:
  `dashboard`, `folder-stack`, `library`, `templates`, `menu`, `sidebar`, `chevron-up`,
  `chevron-down`, `chevron-left`, `chevron-right`, `arrow-left`, `arrow-right` and
  `arrow-up-right`. Actions: `pencil`, `trash` (alias `delete`), `copy`, `duplicate`,
  `download`, `upload`, `share`, `link`, `more-horizontal`, `more-vertical`, `undo`, `redo`,
  `refresh`, `filter`, `sort`, `grip` and `pin`. Status: `check-circle`, `alert-triangle`
  (alias `warning`), `alert-circle`, `info`, `loader`, `clock`, `cloud-check`, `lock`,
  `eye`, `eye-off`, `history`, `queued`, `repair` and `version`.
- The media, audio, file and editor icons, 50 drawings. Media and video: `pause`, `stop`,
  `skip-back`, `skip-forward`, `loop`, `fullscreen`, `minimize`, `video`, `camera`,
  `scissors`, `shot`, `keyframe`, `frame`, `extend`, `render`, `export-video`, `timeline`,
  `transition` and `camera-motion`. Audio and voice: `mic`, `mic-off`, `volume`,
  `volume-off`, `music`, `waveform`, `captions`, `voice`, `lip-sync` and `narration`. Files:
  `file-video`, `file-audio`, `image`, `paperclip`, `reference-card` and `asset`. Editor and
  canvas: `layers`, `crop`, `move`, `zoom-in`, `zoom-out`, `hand`, `cursor`, `text`,
  `align-center`, `grid`, `palette`, `brush`, `eraser`, `split` and `mask`.
- The Studio, AI, format, billing, people and system icons, 42 drawings. Credits and
  billing: `wallet`, `card`, `receipt`, `gift`, `lightning-stack` (alias `credit-pack`),
  `spending-cap` and `plan`. People and roles: `users`, `user-plus`, `crown`, `mail-invite`,
  `log-in`, `log-out`, `character` and `role`. Formats: `aspect-16-9`, `aspect-9-16`,
  `aspect-1-1`, `aspect-4-5`, `duration` and `resolution`. AI and agent: `sparkle`,
  `octopus` (alias `polvi`), `agent`, `prompt`, `generate`, `regenerate`, `variations`,
  `storyboard`, `script` and `style`. System: `bell`, `message`, `help`, `feedback`, `sun`,
  `moon`, `monitor`, `globe`, `keyboard`, `command` and `accent`.
- Filled variants of 40 icons with a stateful meaning, each the silhouette of its line icon
  made solid with its interior details knocked out at 1.5 px (`HomeFilledIcon` to
  `MoonFilledIcon`, from the root and from `./icons/<name>`, aliases included, such as
  `PolviFilledIcon`), with their raw SVG files under `svg/filled/`, sprite symbols and
  metadata: `home`, `dashboard`, `folder`, `folder-stack`, `library`, `templates`,
  `settings`, `user`, `users`, `file`, `play`, `pause`, `scene`, `video`, `camera`, `mic`,
  `volume`, `image`, `layers`, `bell`, `message`, `lock`, `eye`, `pin`, `check-circle`,
  `alert-circle`, `alert-triangle`, `info`, `cloud-check`, `clock`, `lightning`,
  `lightning-stack`, `wallet`, `card`, `crown`, `sparkle`, `octopus`, `character`, `sun`
  and `moon`.
- The 16 px masters of 45 icons, separate drawings made for 16 px (`HomeSmIcon` to
  `ShareSmIcon`, from the root and from `./icons/<name>`, aliases included), with their raw
  SVG files under `svg/sm/`, sprite symbols and metadata: `home`, `dashboard`,
  `folder-stack`, `library`, `templates`, `sidebar`, `chevron-up`, `chevron-down`,
  `chevron-left`, `chevron-right`, `search`, `settings`, `plus`, `close`, `check`, `pencil`,
  `trash`, `copy`, `download`, `upload`, `more-horizontal`, `more-vertical`, `filter`,
  `check-circle`, `alert-triangle`, `alert-circle`, `info`, `loader`, `lock`, `eye`,
  `eye-off`, `lightning`, `wallet`, `users`, `bell`, `duplicate`, `file`, `file-audio`,
  `file-video`, `script`, `frame`, `timeline`, `volume`, `octopus` and `share`.
- The 16 px masters render at 16 px with the set's 1.5 px stroke by default. `createIcon`
  takes a `masterSize` option (16 for a `<Name>SmIcon`, 24 by default) and `Icon` a
  `masterSize` prop: it is the default `size`, and `strokeWidth` is read in px at that size,
  so a 16 px master writes its stroke as 2.25 units of the 24 grid. `ICON_GRID.smSize` is
  `16`. The raw SVG files of the 16 px masters carry `width="16" height="16"`, and both
  those files and the sprite symbols carry `stroke-width="2.25"`. Apply to a consumer: nothing changes
  for the line and filled icons; on a 16 px master, `strokeWidth` is in px at 16, and
  `absoluteStrokeWidth` still writes `strokeWidth * 24 / size`.
- A `label` on every icon's metadata, in `./meta` and `metadata.json`: the short accessible
  name the icon most often takes when it stands alone, such as "Delete" for `trash` and
  "Back" for `arrow-left`. Pass it, or a name of your own, as `title`. Required by the
  schema: at most 32 characters, starting with a capital letter or a digit.
- General-purpose actions, status and controls, 25 drawings (B5a): `minus`, `plus-circle`,
  `minus-circle`, `floppy-disk` (alias `save`), `archive-box` (alias `archive`), `clipboard`,
  `file-import` (alias `import`), `file-export` (alias `export`), `paper-plane` (alias `send`),
  `square-arrow-up-right` (alias `external-link`), `bookmark`, `star`, `heart`, `flag`,
  `close-circle`, `circle-slash` (alias `ban`), `check-square`, `arrow-up`, `arrow-down`,
  `chevrons-up-down`, `sliders`, `toggle`, `qr-code`, `power` and `target`, with filled
  variants of `star`, `heart`, `bookmark`, `flag`, `check-square` and `toggle`.
- People and security, 11 drawings (B5b): `user-minus`, `user-check`, `user-x`, `id-card`,
  `building` (aliases `organization`, `company`), `key`, `shield`, `shield-check`,
  `shield-off`, `fingerprint` and `lock-open` (alias `unlock`), with a filled
  `shield-check`, and the categories `security` and `places-devices`.
- Data, time and files, 24 drawings (B5c): `chart-bar`, `chart-line`, `chart-pie`,
  `trending-up`, `trending-down`, `activity`, `table`, `database`, `server`, `list`, `kanban`,
  `calendar`, `alarm-clock` (alias `alarm`), `stopwatch` (alias `timer`), `file-text` (alias
  `pdf`), `file-zip`, `file-plus`, `folder-open`, `folder-plus`, `book-open`, `cloud-upload`,
  `cloud-download`, `cpu` and `hard-drive`, and the category `data-charts`.
- Commerce, communication, places and devices, 35 drawings (B5d): `cart`, `bag`, `tag`,
  `percent`, `coins`, `bank`, `truck`, `store`, `package`, `briefcase`, `award`, `mail`, `phone`,
  `phone-hang-up` (aliases `phone-off`, `end-call`, `hang-up`), `inbox`, `at-sign`, `bell-off`,
  `thumbs-up`, `thumbs-down`, `smile`, `headphones`, `map-pin`, `map`, `compass`, `smartphone`,
  `tablet`, `laptop`, `printer`, `wifi`, `wifi-off`, `battery`, `cloud`, `cloud-off`, `video-off`
  and `camera-off`, with filled `thumbs-up`, `thumbs-down`, `map-pin` and `bell-off`, and the
  categories `commerce` and `communication`.
- Text and development, 10 drawings (B5e): `bold`, `italic`, `underline`, `align-left`,
  `align-right`, `align-justify`, `columns` (alias `layout`), `code`, `branch` (alias
  `git-branch`) and `pull-request` (alias `git-pull-request`), the category `dev`, and the alias
  `terminal` for `prompt`.
- The brand marks, in their owners' geometry from Simple Icons, filled with
  `currentColor` (`GoogleBrandIcon` and the others, from `./brands`). Microsoft and
  LinkedIn are not included, and the colour `google-color` mark is deferred.
- Repository scaffold: package manifest with the `.` and `./meta` exports map,
  build tooling, lint and test configuration, mutation testing configuration,
  commit governance, the open-source baseline files and the package-integrity
  scripts.
- `ICON_GRID` in `./meta`, re-exported from the root: the 24 px master grid of the
  set (viewBox, live area, padding and the 1.5 px round stroke) as frozen, typed data.
- The icon runtime in the root entry: the `Icon` base, which renders a drawing held as
  data (`IconNode`) into an `<svg>` with `createElement`, and `createIcon`, which makes a
  named component (`displayName`, `bx-icon bx-icon-<name>` classes) from a drawing.
  `IconProps` carries `size`, `strokeWidth`, `color`, `title`, `ref` as a regular prop,
  and `absoluteStrokeWidth`, which writes `strokeWidth * 24 / size` for pixel sizes.
  Icons are `aria-hidden` by default; a `title` gives `role="img"`, `aria-label` and a
  `<title>` child; a consumer `role` or `aria-*` suppresses the default. No hook, context
  or `'use client'`.
- The `./runtime` subpath, which holds the `Icon` base and `createIcon`. The root
  re-exports both, so `import { createIcon } from '@bymax-one/icons'` keeps working; every
  generated icon module imports it through the `./runtime` specifier, which keeps one copy
  in the package.
- The build pipeline. `pnpm generate` normalises the SVG sources with SVGO, runs the icon
  lint, and writes one TypeScript module per icon variant (the drawing as data for
  `createIcon`), the root and `./brands` re-exports and the typed metadata. `pnpm build`
  adds `dist/svg/{line,filled,sm,brands}/<name>.svg`, `dist/sprite.svg` (one
  `<symbol>` per drawing) and `dist/metadata.json`.
- The subpaths `./icons/<name>`, `./brands`, `./svg/*`, `./sprite.svg` and
  `./metadata.json`.
- `./meta` exports `ICON_NAMES`, `ICON_METADATA`, `BRAND_NAMES`, `BRAND_METADATA` and
  `ICON_CATEGORIES`, frozen, with the `IconName`, `BrandName` and `IconCategoryName` unions
  and the record types.
- The JSON Schemas of icon, brand and category metadata (`schemas/`), validated with ajv,
  and `categories.json`.
- `pnpm lint:icons`, the icon lint: allowed elements and attributes, fills and the spark-dot
  exception, three-decimal precision, the live area, kebab-case file names paired with
  their metadata, the schemas, alias and component-name uniqueness, declared variants and
  brand names only in `icons/brands`.
- `pnpm contact-sheet`: every drawing at 16, 20, 24 and 48 px on the light and dark Studio
  pages, in the ink and the six accents, rendered to `reports/contact-sheet.png`.
- The visual tools every drawing batch is reviewed with: `pnpm check:visual` compares every
  drawing at 16, 20, 24 and 48 px, light and dark, with committed baselines;
  `pnpm similarity` compares every drawing, normalised for position, size and stroke, with
  Lucide, Tabler, Phosphor and Heroicons and flags close matches for review;
  `pnpm family-sheet` renders the whole set by category; and a pull request that changes a
  drawing gets a preview comment with its render and its nearest matches.
