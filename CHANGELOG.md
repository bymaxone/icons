# Changelog

All notable changes to `@bymax-one/icons` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

The `release.yml` workflow extracts the section matching the pushed `vX.Y.Z` tag
as the GitHub Release body, so each released version needs a matching
`## [X.Y.Z]` heading here. Every release section lists the icons it added, renamed
and deprecated, each rename with the alias that keeps the old name working.

## [Unreleased]

### Added

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
