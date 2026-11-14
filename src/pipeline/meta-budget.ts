/**
 * @fileoverview The size budget of the `./meta` subpath, per record: the brotli bytes of the
 * bundle, less a fixed base, shared over the records it holds, may not exceed a per-record cost,
 * and the whole may not exceed a sanity cap.
 * @layer Pipeline
 */

/**
 * The brotli bytes of the bundle with no record: the grid, the deep freeze, the categories
 * and the empty tables, measured on the built `dist/meta/index.mjs` with its icon names and
 * records taken out.
 */
export const META_BASE_BYTES = 707

/**
 * The most brotli bytes one record may cost. The tree measures 43.2 bytes a record, so this
 * leaves about 20% for a record with longer tags and use cases.
 */
export const META_RECORD_BYTES = 52

/** The most brotli bytes the bundle may reach whatever the records, room for about 2,000 of them. */
export const META_CAP_BYTES = 112 * 1024

/**
 * The least brotli bytes the bundle may be allowed: a package of a handful of records, such as
 * the placeholder icons of `fixtures/icons`, is dominated by its fixed part and its tables, not
 * by the cost of a record.
 */
export const META_FLOOR_BYTES = 2048

/**
 * The brotli bytes one record costs: what the bundle weighs above its base, over the records.
 *
 * @param brotli - The brotli bytes of the bundle.
 * @param records - The icon and brand records the bundle holds.
 * @returns The bytes a record costs; a bundle with no record is counted as one.
 */
export function recordCost(brotli: number, records: number): number {
  return (brotli - META_BASE_BYTES) / Math.max(records, 1)
}

/**
 * The most brotli bytes the bundle may weigh with this many records: the base and the
 * per-record budget for each, never above the cap.
 *
 * @param records - The icon and brand records the bundle holds.
 * @returns The limit in bytes: the base and the records' budget, within the floor and the cap.
 */
export function metaLimit(records: number): number {
  return Math.min(
    META_CAP_BYTES,
    Math.max(META_FLOOR_BYTES, META_BASE_BYTES + META_RECORD_BYTES * records)
  )
}

/**
 * The brotli bytes of the root entry with no icon: the grid and the runtime re-exports,
 * measured on a build that holds no drawing.
 */
export const ROOT_BASE_BYTES = 85

/**
 * The most brotli bytes one icon may cost the root entry, which holds one re-export line for
 * each. The tree measures 9.8 bytes an icon, so this leaves about 20% for a longer name.
 */
export const ROOT_ICON_BYTES = 12

/** The most brotli bytes the root entry may reach whatever the icons, room for about 2,300. */
export const ROOT_CAP_BYTES = 28 * 1024

/** The least brotli bytes the root entry may be allowed, for a package of a handful of icons. */
export const ROOT_FLOOR_BYTES = 512

/**
 * The brotli bytes one icon costs the root entry: what it weighs above its base, over the icons.
 *
 * @param brotli - The brotli bytes of the root entry.
 * @param icons - The icons the entry re-exports.
 * @returns The bytes an icon costs; an entry with no icon is counted as one.
 */
export function iconCost(brotli: number, icons: number): number {
  return (brotli - ROOT_BASE_BYTES) / Math.max(icons, 1)
}

/**
 * The most brotli bytes the root entry may weigh with this many icons: the base and the
 * per-icon budget for each, never above the cap.
 *
 * @param icons - The icons the entry re-exports.
 * @returns The limit in bytes.
 */
export function rootLimit(icons: number): number {
  return Math.min(
    ROOT_CAP_BYTES,
    Math.max(ROOT_FLOOR_BYTES, ROOT_BASE_BYTES + ROOT_ICON_BYTES * icons)
  )
}

/**
 * The brotli bytes of the `./brands` entry with no mark: the runtime import and the empty
 * export, measured on a build that holds no brand mark.
 */
export const BRANDS_BASE_BYTES = 5

/**
 * The most brotli bytes one brand mark may cost the `./brands` entry, which holds the owner's
 * path data of every mark. The tree measures 386.9 bytes a mark, so this leaves about 20% for
 * a mark with a longer path.
 */
export const BRANDS_MARK_BYTES = 465

/** The most brotli bytes the `./brands` entry may reach whatever the marks, room for about 140. */
export const BRANDS_CAP_BYTES = 64 * 1024

/**
 * The least brotli bytes the `./brands` entry may be allowed, for a package of a handful of
 * marks, which a single long path can fill.
 */
export const BRANDS_FLOOR_BYTES = 5 * 1024

/**
 * The brotli bytes one brand mark costs the `./brands` entry: what it weighs above its base,
 * over the marks.
 *
 * @param brotli - The brotli bytes of the `./brands` entry.
 * @param marks - The brand marks the entry holds.
 * @returns The bytes a mark costs; an entry with no mark is counted as one.
 */
export function markCost(brotli: number, marks: number): number {
  return (brotli - BRANDS_BASE_BYTES) / Math.max(marks, 1)
}

/**
 * The most brotli bytes the `./brands` entry may weigh with this many marks: the base and the
 * per-mark budget for each, within the floor and the cap.
 *
 * @param marks - The brand marks the entry holds.
 * @returns The limit in bytes.
 */
export function brandsLimit(marks: number): number {
  return Math.min(
    BRANDS_CAP_BYTES,
    Math.max(BRANDS_FLOOR_BYTES, BRANDS_BASE_BYTES + BRANDS_MARK_BYTES * marks)
  )
}
