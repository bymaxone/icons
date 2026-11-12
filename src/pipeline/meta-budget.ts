/**
 * @fileoverview The size budget of the `./meta` subpath, per record instead of as a total
 * raised by hand: the brotli bytes of the bundle, less a fixed base, shared over the records
 * it holds, may not exceed a per-record cost, and the whole may not exceed a sanity cap.
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
 * @returns The limit in bytes.
 */
export function metaLimit(records: number): number {
  return Math.min(META_CAP_BYTES, META_BASE_BYTES + META_RECORD_BYTES * records)
}
