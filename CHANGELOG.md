# Changelog

All notable changes to `@bymax-one/icons` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

The `release.yml` workflow extracts the section matching the pushed `vX.Y.Z` tag
as the GitHub Release body, so each released version needs a matching
`## [X.Y.Z]` heading here. Every release section lists the icons it added, renamed
and deprecated, each rename with the alias that keeps the old name working.

## [Unreleased]

### Changed

- Seven icons have a label of their own: no two icons share one except the pairs that are the
  same word, `plus` and `plus-circle` ("Add") and `more-vertical` and `more-horizontal`
  ("More options"). `heart` is "Love" (`thumbs-up` stays "Like"), `arrow-right` is "Continue"
  (`forward` stays "Forward"), `bookmark-check` is "Bookmarked" (`cloud-check` stays "Saved"),
  `chevron-up` is "Show less" (`minus-square` stays "Collapse"), `file-x` is "Delete file"
  (`file-minus` stays "Remove file"), and `x-square` is "Dismiss" and `minus-circle` "Remove item"
  (`minus` stays "Remove"). Labels only: names and drawings are unchanged.
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
- Devices, tools, finance and education, and the last variants (B6-F7 and B6-F8): `cctv`, `computer-tower`, `ethernet`, `trackpad`, `tv-retro`, `smart-lock`, `tape-measure`, `wheelbarrow`, `rake`, `lawn-mower`, `birdhouse`, `chisel`, `currency-yen`, `currency-won`, `currency-lira`, `invoice-check`, `money-bag`, `math-symbols`, `protractor`, `set-square`, `drum`, `file-cabinet`, `card-lock`, `card-refund`, `mail-star`, `mail-warning`, `server-bolt` and `file-warning`.
- Brand marks, the first of three batches (B7): developer and cloud tools, AI providers and design tools, 53 marks in the owners' geometry from Simple Icons 16.37.0: `angular`, `ansible`, `anthropic`, `astro`, `bitbucket`, `bun`, `circleci`, `claude`, `cloudflare`, `datadog`, `digitalocean`, `django`, `docker`, `eslint`, `figma`, `firebase`, `flyio`, `framer`, `git`, `github-actions`, `gitlab`, `go`, `google-gemini`, `grafana`, `kotlin`, `kubernetes`, `langchain`, `laravel`, `meta`, `mistral-ai`, `mongodb`, `mysql`, `netlify`, `nextjs`, `nodejs`, `npm`, `nuxt`, `perplexity`, `pnpm`, `postgresql`, `prometheus`, `python`, `redis`, `sentry`, `stripe`, `supabase`, `swift`, `tailwindcss`, `terraform`, `typescript`, `unity`, `vercel`, `webflow`. Each carries its guidelines page, read on the owner's own domain and recorded in `docs/brands/guidelines-evidence.md`, and a line in `TRADEMARKS.md`. `angular` and `git` are under a Creative Commons licence and are credited there. The `./brands` size budget is per mark, 465 bytes brotli above a base of 5, in place of a fixed 5 KiB.
- Brand marks, the second of three batches (B7): social networks, messaging and streaming, 22 marks: `apple-music`, `bluesky`, `dribbble`, `hbo`, `kakaotalk`, `line-messenger`, `mastodon`, `messenger`, `netflix`, `nextdoor`, `patreon`, `qq`, `reddit`, `signal-messenger`, `snapchat`, `soundcloud`, `substack`, `telegram`, `tumblr`, `viber`, `wechat`, `zoom`. `nextdoor`, `zoom` and `hbo` are wordmarks, tagged so, meant for sizes larger than 24 px. Each carries its guidelines page and a line in `TRADEMARKS.md`, as in the first batch.
- Brand marks, the third of three batches (B7): payments, operating systems and browsers, and stores, 21 marks: `android`, `apple-pay`, `appstore`, `arch-linux`, `brave`, `ebay`, `firefox`, `google-pay`, `google-play`, `ios`, `klarna`, `linux`, `macos`, `opera`, `safari`, `samsungpay`, `shopify`, `square-payments`, `steam`, `ubuntu`, `visa`. `android` is under a Creative Commons licence and is credited in `TRADEMARKS.md`. `ios`, `macos`, `visa`, `ebay`, `samsungpay`, `apple-pay` and `google-pay` are wordmarks, tagged so, meant for sizes larger than 24 px. Each carries its guidelines page and a line in `TRADEMARKS.md`, as in the first batch.
- `style` is renamed `paint-roller`, the object the drawing shows; the drawing is unchanged and `style` stays a deprecated alias, removed in 2.0.0, whose component still renders the drawing.

  Apply to a consumer: import `PaintRollerIcon`, or the subpath `./icons/paint-roller`, instead of `StyleIcon`.

- Transport and places (B6-F6): `motorboat`, `high-speed-train`, `bicycle-electric`, `car-electric`, `car-wash`, `apartment`, `fire-station`, `police-station`, `pharmacy`, `monument` and `skyscraper`.
- Family variants (B6-T5): `map-pin-minus`, `alarm-clock-check`, `alarm-clock-plus`, `alarm-clock-minus`, `alarm-clock-off`, `book-check`, `book-minus`, `book-plus`, `book-off`, `book-search`, `book-x`, `copy-check`, `copy-plus`, `egg-off`, `fish-off`, `milk-off`, `beer-off`, `globe-off`, `globe-x`, `playlist-plus`, `search-check`, `search-off`, `search-x`, `arrow-down-clock`, `arrow-up-clock`, `database-minus`, `fingerprint-off`, `grid-off`, `message-minus`, `monitor-off`, `monitor-play`, `network-off`, `note-plus`, `pen-off`, `route-off`, `share-off`, `shield-search`, `text-search`, `vibrate-off`, `virus-off`, `webcam-off` and `webhook-off`.
- The aliases `file-play` (`file-video`) and `list-check` (`list-checks`).
- More family variants (B6-T4): `users-check`, `users-x`, `user-clock`, `mail-minus`, `bell-snooze`, `cloud-plus`, `cloud-minus`, `cloud-search`, `database-import`, `database-share`, `server-search`, `message-star`, `message-share`, `home-x`, `home-share`, `image-share`, `camera-share`, `cart-dollar`, `tag-heart`, `star-check`, `star-x`, `heart-x`, `heart-share`, `bookmark-star`, `clock-x`, `clock-share`, `link-check`, `link-minus`, `eye-x`, `eye-plus`, `eye-search`, `key-check`, `wallet-check`, `wallet-x`, `phone-check`, `phone-x`, `phone-lock`, `wifi-check`, `wifi-x`, `printer-check`, `file-info`, `video-x` and `video-check`.
- The alias `file-pen` is added to `file-edit`.
- Family variants (B6-F5): `calendar-user`, `calendar-off`, `camera-check`, `card-minus`, `card-check`, `card-x`, `cart-minus`, `cart-check`, `cart-x`, `cart-off`, `cart-heart`, `clock-pause`, `clock-play`, `clock-edit`, `clock-off`, `cloud-x`, `cloud-warning`, `database-x`, `database-lock`, `database-off`, `eye-check`, `eye-edit`, `file-share`, `file-clock`, `file-user`, `file-question`, `home-plus`, `home-check`, `home-lock`, `home-search`, `home-off`, `home-signal`, `home-bolt`, `image-minus`, `image-check`, `image-x`, `image-search`, `key-x`, `key-off`, `link-plus`, `link-x`, `list-plus`, `list-x`, `list-search`, `lock-clock`, `mail-x`, `mail-forward`, `mail-off`, `map-pin-off`, `message-plus`, `message-x`, `message-check`, `message-heart`, `message-lock`, `message-off`, `message-reply`, `message-warning`, `server-plus`, `server-x`, `server-check`, `server-lock`, `star-plus`, `tag-minus`, `tag-x`, `tag-off`, `user-lock`, `user-off`, `users-plus`, `users-minus`, `video-plus`, `wallet-plus`, `wallet-off`, `bell-dot`, `list-tree`, `message-dots` and `message-text`.
- `mail-invite` is renamed `mail-plus`, the object the drawing shows; the drawing is unchanged and `mail-invite` stays a deprecated alias, removed in 2.0.0, whose component still renders the drawing. The alias `list-details` is added to `list`.

  Apply to a consumer: import `MailPlusIcon`, or the subpath `./icons/mail-plus`, instead of `MailInviteIcon`.

- Faces, health and hands (B6-F3): `face-happy`, `face-grin`, `face-laugh`, `face-sad`, `face-angry`, `face-cool`, `face-cry`, `face-dizzy`, `face-kiss`, `face-love`, `face-sick`, `face-sleep`, `face-surprise`, `face-tongue`, `face-wink`, `face-confused`, `face-grimace`, `face-nerd`, `face-star-eyes`, `face-upside-down`, `face-zipper`, `cane`, `ear-off`, `eye-drop`, `hearing-aid`, `hospital-bed`, `medical-cross`, `mortar-pestle`, `nurse`, `pill-bottle`, `scalpel`, `temperature-check`, `test-tube-rack`, `tooth-broken`, `iv-drip`, `blood-bag`, `blood-test`, `medical-chart`, `nose`, `hand-wave`, `hand-peace` and `hand-fist`.
- Sports and home (B6-F4): `jump-rope`, `hockey`, `tennis-racket`, `rugby`, `boxing-glove`, `fishing-rod`, `bowling-pin`, `baseball-bat`, `basketball-hoop`, `roller-skate`, `racing-flag`, `archery`, `running-shoe`, `gym-rings`, `football-helmet`, `bunk-bed`, `bottle`, `cabinet`, `cooking-pot`, `door-handle`, `fireplace`, `frying-pan`, `glass`, `grill`, `iron`, `ladle`, `light-switch`, `radiator`, `rolling-pin`, `sink`, `spatula`, `spoon`, `stool`, `vase`, `whisk`, `crib` and `air-conditioner`.
- The aliases of B6-F3 and B6-F4: `gene` (`dna`), `blood-drop` (`droplet`), `medical-bag` (`first-aid-kit`), `hand-stop` (`hand`), `health-insurance` (`shield-plus`), `vaccine` (`syringe`), `dental` (`tooth`), `kettlebell` (`weight`), `face-sad-tear` (`face-cry`), `face-shock` (`face-surprise`) and `face-thinking` (`face-confused`).
- Animals and weather (B6-F1): `bee`, `crab`, `deer`, `duck`, `elephant`, `fox`, `frog`, `goat`, `koala`, `ladybug`, `owl`, `shark`, `sheep`, `shell`, `snake`, `spider`, `turtle`, `worm`, `fish-bowl`, `dinosaur`, `jellyfish`, `starfish`, `rhino`, `beetle`, `caterpillar`, `seahorse`, `goose`, `crow`, `pigeon`, `moose`, `cloud-wind`, `dew`, `heat-wave`, `humidity`, `sleet`, `snowman`, `umbrella-closed`, `uv-index`, `wind-sock`, `barometer`, `wildfire`, `iceberg`, `sandstorm`, `tide`, `thermometer-hot`, `bear`, `panda`, `pig`, `cow`, `bull`, `lion`, `monkey`, `hippo`, `wolf`, `camel`, `giraffe`, `crocodile`, `penguin`, `ostrich`, `eagle`, `bat`, `hedgehog`, `toucan` and `swan`.
- Plants, nature and food (B6-F2): `acorn`, `flower-pot`, `forest`, `grass`, `maple-leaf`, `pinecone`, `sunflower`, `waterfall`, `cave`, `desert`, `bonsai`, `lotus`, `bacon`, `water-bottle`, `broccoli`, `chili`, `drink`, `fries`, `garlic`, `grapes`, `martini`, `milk`, `noodles`, `peanut`, `onion`, `pancakes`, `pear`, `pie`, `pineapple`, `pretzel`, `salt`, `shrimp`, `soda`, `tea`, `tomato`, `watermelon`, `popsicle`, `jar`, `dumpling`, `kebab`, `butter`, `coffee-bean`, `ketchup`, `pepper-shaker`, `chocolate` and `strawberry`.
- The aliases of B6-F1 and B6-F2: `toast` (`bread`), `cherries` (`cherry`), `tulip` (`flower`), `palm-tree` (`island`), `frost` (`snowflake`), `cocktail` (`martini`), `pancake-stack` (`pancakes`), `salt-shaker` (`salt`) and `honey` (`jar`).
- Devices, tools, places and weather (B6-E2): `binary`, `clapperboard`, `exposure`, `git-pull-request-draft`, `incognito`, `map-plus`, `map-search`, `mouse-left-click`, `mouse-right-click`, `mouse-off`, `music-note-plus`, `music-off`, `package-check`, `package-search`, `panorama`, `password`, `phone-pause`, `playlist-play`, `remote-control`, `scroll`, `seal`, `server-off`, `shield-alert`, `shield-user`, `shield-x`, `signal-cellular`, `sim-card`, `stamp`, `time-zone`, `user-edit`, `user-shield`, `vibrate`, `volume-low`, `zzz`, `augmented-reality`, `battery-warning`, `bed-double`, `blinds`, `cart-plus`, `chair`, `curtains`, `dresser`, `flashlight-off`, `hanger`, `hard-hat`, `info-square`, `lightbulb-off`, `mirror`, `rocking-chair`, `screwdriver`, `shopping-bag-check`, `shower`, `shredder`, `sort-ascending`, `tie`, `truck-delivery`, `balcony`, `car-battery`, `escalator`, `fire-hydrant`, `fuel`, `home-heart`, `parking-meter`, `police-badge`, `police-car`, `ship`, `siren`, `steering`, `submarine`, `wall` and `airplane-landing`.
- Food, objects, people and symbols (B6-E3): `banana`, `beach`, `bird`, `butterfly`, `cherry`, `cloud-drizzle`, `droplets`, `flood`, `hail`, `haze`, `island`, `mountain`, `mushroom`, `paw`, `rabbit`, `thermometer-cold`, `volcano`, `wheat`, `wind-power`, `bowl`, `candy`, `cookie-off`, `faucet`, `kettle`, `lollipop`, `fruit`, `oven`, `wine`, `baby-bottle`, `baby-carriage`, `face-mask`, `gender-transgender`, `hair-dryer`, `hand-sanitizer`, `heart-broken`, `heart-check`, `heart-off`, `meh`, `run`, `smoking`, `masks`, `tooth`, `barbell`, `cricket`, `ferris-wheel`, `hot-air-balloon`, `ice-skating`, `parachute`, `paragliding`, `scoreboard`, `swimming`, `tournament`, `treadmill`, `treasure-chest`, `ufo`, `whistle`, `atm`, `candlestick-chart`, `chart-bubble`, `chart-donut`, `chart-histogram`, `coins-swap`, `card-off`, `card-plus`, `currency-ruble`, `chart-area` and `chart-bar-horizontal`.
- The aliases of B6-E2 and B6-E3: `error` (`alert-circle`), `task` (`clipboard-check`), `mist` (`cloud-fog`), `dropper` (`color-picker`), `gem` (`diamond`), `drop` (`droplet`), `eyeglasses` (`glasses`), `photo` (`image`), `microphone-off` (`mic-off`), `remove` (`minus`), `capsule` (`pill`), `sync` (`refresh`), `update` (`refresh`), `rotate` (`rotate-right`), `scooter-electric` (`scooter`), `security` (`shield`), `van` (`truck`), `people` (`users`), `lock-password` (`password`), `phone-paused` (`phone-pause`), `volume-down` (`volume-low`), `volume-minus` (`volume-low`), `gas-station` (`fuel`), `nutrition` (`fruit`), `apple-fruit` (`fruit`), `transgender` (`gender-transgender`), `credit-card-off` (`card-off`) and `credit-card-plus` (`card-plus`).
- Shapes, games and sports, gender and safety symbols (B6-D3): `avocado`, `bread`, `egg-fried`, `hamburger`, `knife`, `clover`, `plant`, `campfire`, `cat`, `dog`, `horse`, `moon-stars`, `meteor`, `flare`, `tsunami`, `baby`, `walk`, `yoga`, `gender-female`, `gender-male`, `graduation-cap`, `first-aid-kit`, `syringe`, `dumbbell`, `bowling-ball`, `tennis-ball`, `volleyball`, `skateboard`, `alien`, `radioactive`, `pyramid`, `chart-scatter`, `peace`, `code-square`, `artboard`, `lasso`, `droplet-off`, `opacity`, `shadow`, `vignette`, `color-filter`, `highlighter`, `paint-bucket`, `paragraph`, `text-wrap`, `tabs`, `ungroup` and `perspective`.
- Arrows, interface and editing (B6-E1): `ampersand`, `arrow-up-square`, `arrow-down-square`, `arrow-left-square`, `arrow-right-square`, `chevrons-down`, `chevrons-up`, `chevrons-left`, `chevrons-right`, `circle-dashed`, `square-dashed`, `equal-not`, `exclamation`, `lambda`, `parentheses`, `polygon`, `prism`, `radio-button`, `registered`, `replace`, `screen-rotation`, `sigma`, `step-into`, `step-out`, `swipe-right`, `swipe-left`, `swipe-up`, `swipe-down`, `x-octagon`, `address-book`, `alarm-off`, `alarm-plus`, `alarm-snooze`, `archive-arrow-down`, `archive-arrow-up`, `bell-check`, `bell-ringing`, `book-lock`, `calendar-event`, `calendar-lock`, `calendar-search`, `calendar-star`, `clipboard-list`, `cloud-lock`, `color-picker`, `database-plus`, `file-diff`, `file-star`, `filter-off`, `filter-plus`, `folder-clock`, `folder-edit`, `folder-heart`, `folder-music`, `folder-star`, `folder-sync`, `folder-upload`, `grip-horizontal`, `image-plus`, `layout-bottom`, `layout-top`, `line-height`, `list-checks`, `list-ordered`, `mail-check`, `mail-lock`, `mail-search`, `message-question`, `pencil-off`, `pin-off`, `select-all`, `spellcheck`, `tag-plus`, `text-color` and `tooltip`.
- The aliases of B6-D3 and B6-E1: `contacts` (`address-book`), `exclamation-circle` (`alert-circle`), `text-align-center` (`align-center`), `arrow-circle-down` (`arrow-down-circle`), `circle-arrow-down` (`arrow-down-circle`), `download-circle` (`arrow-down-circle`), `square-arrow-down` (`arrow-down-square`), `arrow-circle-left` (`arrow-left-circle`), `circle-arrow-left` (`arrow-left-circle`), `exchange` (`arrow-left-right`), `square-arrow-left` (`arrow-left-square`), `arrow-back` (`arrow-left`), `arrow-circle-right` (`arrow-right-circle`), `circle-arrow-right` (`arrow-right-circle`), `square-arrow-right` (`arrow-right-square`), `arrow-forward` (`arrow-right`), `arrow-circle-up` (`arrow-up-circle`), `circle-arrow-up` (`arrow-up-circle`), `arrows-vertical` (`arrow-up-down`), `square-arrow-up` (`arrow-up-square`), `shopping-basket` (`basket`), `bed-single` (`bed`), `bell-slash` (`bell-off`), `notification-off` (`bell-off`), `bike` (`bicycle`), `book-bookmark` (`book`), `bookmark-remove` (`bookmark-minus`), `bookmark-add` (`bookmark-plus`), `cupcake` (`cake`), `calendar-week` (`calendar`), `calendar-range` (`calendar`), `license` (`certificate`), `analytics` (`chart-bar`), `chart-column` (`chart-bar`), `chess` (`chess-knight`), `caret-left` (`chevron-left`), `less-than` (`chevron-left`), `caret-right` (`chevron-right`), `greater-than` (`chevron-right`), `chevron-double-down` (`chevrons-down`), `chevron-double-left` (`chevrons-left`), `chevron-double-right` (`chevrons-right`), `chevron-double-up` (`chevrons-up`), `buildings` (`city`), `clipboard-text` (`clipboard`), `thunderstorm` (`cloud-lightning`), `rainy` (`cloud-rain`), `cup` (`coffee`), `eyedropper` (`color-picker`), `circle-half` (`contrast`), `keyboard-return` (`corner-down-left`), `euro` (`currency-euro`), `pound` (`currency-pound`), `rhombus` (`diamond`), `blur-off` (`droplet-off`), `water` (`droplet`), `exclamation-mark` (`exclamation`), `priority-high` (`exclamation`), `eye-slash` (`eye-off`), `finger-print` (`fingerprint`), `flame` (`fire`), `folder-shared` (`folder-user`), `bounding-box` (`frame`), `margin` (`frame`), `game-controller` (`gamepad`), `female` (`gender-female`), `male` (`gender-male`), `grid-3x3` (`grid`), `grid-3x` (`grid`), `grip-vertical` (`grip`), `background` (`image`), `information` (`info`), `information-circle` (`info`), `format-italic` (`italic`), `books` (`library`), `bookshelf` (`library`), `life-buoy` (`lifebuoy`), `bulb` (`lightbulb`), `zap-off` (`lightning-off`), `view-list` (`list`), `table-of-contents` (`list`), `loading` (`loader`), `suitcase` (`luggage`), `envelope-open` (`mail-open`), `message-square` (`message`), `subtract` (`minus`), `desktop` (`monitor`), `dots-vertical` (`more-vertical`), `ellipsis-vertical` (`more-vertical`), `motorcycle` (`motorbike`), `sticky-note` (`note`), `journal` (`notebook`), `notes` (`notebook`), `paint` (`paint-bucket`), `colors` (`palette`), `swatch` (`palette`), `pilcrow` (`paragraph`), `pen-tool` (`pen`), `draw` (`pen`), `call-received` (`phone-incoming`), `call-missed` (`phone-missed`), `phone-forwarded` (`phone-outgoing`), `power-off` (`power`), `slideshow` (`presentation`), `presentation-chart` (`presentation`), `puzzle-piece` (`puzzle`), `quotes` (`quote`), `record-circle` (`record`), `refresh-circle` (`refresh`), `refresh-cw` (`refresh`), `find-replace` (`replace`), `fork-knife` (`restaurant`), `refresh-ccw` (`rotate-left`), `vault` (`safe`), `boat` (`sailboat`), `scales` (`scale`), `cut` (`scissors`), `screen-share` (`screen-cast`), `dns` (`server`), `shape` (`shapes`), `category` (`shapes`), `skateboarding` (`skateboard`), `skip-next` (`skip-forward`), `sliders-horizontal` (`sliders`), `snow` (`snowflake`), `gauge` (`speedometer`), `format-strikethrough` (`strikethrough`), `metro` (`subway`), `device-tablet` (`tablet`), `wrap-text` (`text-wrap`), `toggle-off` (`toggle`), `toggle-on` (`toggle`), `tool` (`tools`), `park` (`tree`), `pine-tree` (`tree`), `account-circle` (`user-circle`), `person-add` (`user-plus`), `account-box` (`user-square`), `user-group` (`users`), `camera-video` (`video`), `video-camera` (`video`), `volume-x` (`volume-off`), `volume-high` (`volume`), `wash` (`washing-machine`), `app-window` (`window`) and `browser` (`window`).
- Family variants and state icons (B6-D1): `battery-empty`, `battery-medium`, `battery-plus`, `bell-minus`, `bell-plus`, `bookmark-off`, `bookmark-plus`, `calendar-clock`, `calendar-x`, `camera-plus`, `clipboard-minus`, `clipboard-x`, `clock-check`, `clock-plus`, `cloud-fog`, `cloud-sun`, `cloud-moon`, `cloud-sync`, `cloudy`, `database-check`, `database-export`, `file-chart`, `file-cloud`, `file-edit`, `file-upload`, `flag-off`, `folder-code`, `folder-download`, `folder-off`, `folder-user`, `folder-x`, `folder-zip`, `heart-half`, `heart-minus`, `heart-plus`, `heart-pulse`, `shield-half`, `shield-minus`, `shield-question`, `shield-star`, `help-square`, `map-pin-plus`, `phone-missed`, `timer-off`, `wifi-lock`, `keyboard-off`, `link-off`, `headset-off`, `repeat-off`, `play-pause`, `user-search`, `git-pull-request-closed`, `align-top`, `align-bottom`, `align-vertical-center`, `border-horizontal`, `border-vertical`, `border-style`, `layout-right`, `rotate-left` and `rotate-right`.
- Symbols, home, games and places (B6-D2): `braces`, `brackets`, `regex`, `hd`, `hdr`, `pi`, `plus-minus`, `angle`, `diameter`, `radius`, `currency-bitcoin`, `armchair`, `bathtub`, `toilet`, `bucket`, `ladder`, `shovel`, `fence`, `candle`, `contract`, `devices`, `dialpad`, `earbuds`, `equalizer`, `metronome`, `antenna`, `outlet`, `sd-card`, `face-id`, `record`, `poker-chip`, `spade`, `club`, `chess-pawn`, `chess-rook`, `chess-bishop`, `chess-queen`, `chess-king`, `bridge`, `castle`, `city`, `hotel`, `lighthouse`, `parking`, `pool`, `restaurant`, `ev-station`, `cable-car`, `crane`, `forklift`, `taxi`, `sailboat`, `rocket-launch`, `traffic-light` and `traffic-cone`.
- The aliases `notification` (`bell`), `paint-brush` (`brush`), `calendar-month` (`calendar`), `closed-caption` (`captions`), `trolley` (`cart`), `graph` (`chart-line`), `checkbox` (`check-square`), `caret-down` (`chevron-down`), `caret-up` (`chevron-up`), `time` (`clock`), `cancel` (`close-circle`), `download-cloud` (`cloud-download`), `cloud-arrow-down` (`cloud-download`), `upload-cloud` (`cloud-upload`), `cloud-arrow-up` (`cloud-upload`), `api` (`code`), `coin` (`coins`), `select` (`cursor`), `diamond-suit` (`diamond`), `view` (`eye`), `post` (`file-text`), `article` (`file-text`), `magic-wand` (`generate`), `hearts` (`heart`), `question` (`help`), `wallpaper` (`image`), `details` (`info`), `info-circle` (`info`), `envelope` (`mail`), `comment` (`message`), `message-circle` (`message`), `add-circle` (`plus-circle`), `add` (`plus`), `invoice` (`receipt`), `reload` (`refresh`), `restart` (`refresh`), `layout-left` (`sidebar`), `storefront` (`store`), `brightness` (`sun`), `file-spreadsheet` (`table`), `tags` (`tag`), `thumb-down` (`thumbs-down`), `thumb-up` (`thumbs-up`), `switch` (`toggle`), `person` (`user`), `volume-up` (`volume`), `unlink` (`link-off`) and `traffic` (`traffic-light`).
- Household, places, objects and games (B6-C2): `door`, `elevator`, `fan`, `fridge`, `microwave`, `washing-machine`, `garage`, `warehouse`, `factory`, `memory`, `projector`, `piano`, `pen`, `pencil-ruler`, `note`, `notebook`, `sticker`, `playing-cards`, `gamepad`, `joystick`, `gavel`, `fire-extinguisher`, `solar-panel`, `broadcast`, `podcast`, `chess-knight`, `ghost`, `sunglasses`, `basket` and `satellite-dish`.
- Nature, transport, health and shapes (B6-C3): `cactus`, `carrot`, `cheese`, `beer`, `bone`, `snail`, `waves`, `cloud-lightning`, `cloud-rain`, `orbit`, `tent`, `road`, `signpost`, `caravan`, `helicopter`, `motorbike`, `subway`, `tractor`, `golf`, `bandage`, `lungs`, `prescription`, `wheelchair`, `rectangle`, `sphere` and `cone`.
- The aliases `door-closed` (`door`), `cards` (`playing-cards`), `solar-power` (`solar-panel`), `strategy` (`chess-knight`), `satellite` (`satellite-dish`), `moped` (`motorbike`) and `directions` (`signpost`).
- Interface, arrows and families (B6-C1): `apps`, `accessibility`, `alert-octagon`, `aperture`, `border-all`, `border-inner`, `cursor-text`, `heading`, `gif`, `quote`, `strikethrough`, `superscript`, `trademark`, `copyleft`, `option`, `picture-in-picture`, `window`, `playlist`, `x-square`, `minus-square`, `eye-closed`, `star-off`, `user-star`, `corner-down-left`, `corner-down-right`, `corner-up-left`, `corner-up-right`, `corner-left-down`, `corner-right-down`, `corner-left-up`, `corner-right-up`, `bookmark-minus`, `bookmarks`, `clipboard-plus`, `file-download`, `file-image`, `file-x`, `folder-search`, `database-search`, `shield-lock`, `mail-open`, `phone-call`, `phone-plus`, `reply-all` and `git-compare`.
- The aliases `alert` (`alert-triangle`), `bolt` (`lightning`), `flash` (`lightning`), `chart` (`chart-bar`), `earth` (`globe`), `expand` (`fullscreen`), `fullscreen-exit` (`minimize`), `house` (`home`), `login` (`log-in`), `plane` (`airplane`), `question-mark` (`help`), `pulse` (`activity`), `replay` (`loop`), `type` (`text`), `folders` (`folder-stack`), `sparkles` (`sparkle`), `label` (`tag`), `more` (`more-horizontal`), `layout-grid` (`dashboard`), `subtitles` (`captions`), `html` (`code`), `gps` (`location-arrow`) and `handbag` (`bag`).
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
