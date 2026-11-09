/**
 * @fileoverview Deep freezing for the metadata `./meta` publishes: one set of objects backs
 * every consumer in a process, so none of them can rewrite a record another one reads.
 * @layer Metadata
 */

/**
 * Freezes a value and every object and array it holds.
 *
 * @param value - The value to freeze; a primitive is returned as it is.
 * @returns The same value, frozen all the way down.
 */
export function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}
