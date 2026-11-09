/**
 * @fileoverview How an icon name becomes every other name the package publishes: the
 * name `createIcon` receives, the component name, the sprite symbol id. One function per
 * name, so the generator, the lint and the checks cannot disagree about a spelling.
 * @layer Pipeline
 *
 * Relative imports in `src/pipeline` carry the `.ts` extension: Node runs this directory
 * directly with native type stripping, which resolves no extensionless specifier.
 */

/**
 * Kebab-case: lower-case letters and digits in words joined by single hyphens, starting
 * with a letter. The same rule `createIcon` enforces at runtime.
 */
export const KEBAB_CASE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

/** A drawing of an icon: the 24 px line master, the filled variant, the 16 px master, or a brand mark. */
export type Variant = 'line' | 'filled' | 'sm' | 'brand'

/**
 * The name a variant is created under: `lightning`, `lightning-filled`, `lightning-sm`,
 * `github-brand`. It becomes the `bx-icon-<name>` class and the sprite symbol id.
 *
 * @param name - The icon's kebab-case name.
 * @param variant - The drawing.
 * @returns The kebab-case variant name.
 */
export function variantName(name: string, variant: Variant): string {
  // The line master carries the bare name; every other variant appends its own name, so
  // the variants of one icon never share a name.
  return variant === 'line' ? name : `${name}-${variant}`
}

/**
 * The PascalCase form of a kebab-case name: every word capitalised and joined, so
 * `aspect-16-9` becomes `Aspect169`.
 *
 * @param name - A kebab-case name.
 * @returns The joined, capitalised words.
 */
export function pascalCase(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

/**
 * The exported component name of a variant: `LightningIcon`, `LightningFilledIcon`,
 * `LightningSmIcon`, `GithubBrandIcon`. It equals the `displayName` `createIcon` derives.
 *
 * @param name - The icon's (or an alias's) kebab-case name.
 * @param variant - The drawing.
 * @returns The component name.
 */
export function componentName(name: string, variant: Variant): string {
  return `${pascalCase(variantName(name, variant))}Icon`
}

/**
 * The id of a variant's `<symbol>` in the sprite: `bx-` and the variant name.
 *
 * @param name - The icon's kebab-case name.
 * @param variant - The drawing.
 * @returns The symbol id.
 */
export function symbolId(name: string, variant: Variant): string {
  return `bx-${variantName(name, variant)}`
}
