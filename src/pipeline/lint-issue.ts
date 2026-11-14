/**
 * @fileoverview The vocabulary of the icon lint: the rules it checks and the issue each
 * failure produces.
 * @layer Pipeline
 */

/**
 * Every rule of the icon lint.
 *
 * - `file-name`: a source file is `<kebab-case>.svg` (or `.json` in `icons/meta`), and the
 *   icons directory holds nothing else but its README.
 * - `svg-parse`: the file is well-formed XML with a single `<svg>` root.
 * - `svg-normalised`: the file is byte for byte what the formatter writes.
 * - `svg-root`: the root carries exactly the fixed attributes of its kind (a flag's own view
 *   box, 3:2, beside the namespace).
 * - `svg-element`: only the allowed drawing elements, directly under the root, empty.
 * - `svg-attribute`: only geometry and fill controls on drawing elements.
 * - `svg-fill`: line icons fill nothing but the spark dot; filled icons and brand marks fill
 *   with `currentColor`, apart from a multicolour mark's own colours.
 * - `svg-precision`: numbers carry at most three decimals and no exponent.
 * - `svg-live-area`: the drawing paints something, inside the live area.
 * - `svg-size`: a country flag source holds at most 8 KiB.
 * - `svg-ink`: a line drawing and a 16 px master stay under their ink ceilings (spec 2.5).
 * - `meta-json`: a metadata file is JSON.
 * - `meta-schema`: it validates against the schema its `$schema` names.
 * - `meta-pair`: every drawing has metadata and every metadata file its drawing.
 * - `meta-variants`: the declared variants are the drawings that exist.
 * - `brand-scope`: a brand name has drawings only in `icons/brands`.
 * - `flag-scope`: a flag name has its drawing only in `icons/flags`, and only a flag's lives there.
 * - `category`: `categories.json` is valid and every category an icon names exists.
 * - `name-unique`: no two icons, brands or aliases share a name or a component name.
 */
export type RuleId =
  | 'file-name'
  | 'svg-parse'
  | 'svg-normalised'
  | 'svg-root'
  | 'svg-element'
  | 'svg-attribute'
  | 'svg-fill'
  | 'svg-precision'
  | 'svg-live-area'
  | 'svg-size'
  | 'svg-ink'
  | 'meta-json'
  | 'meta-schema'
  | 'meta-pair'
  | 'meta-variants'
  | 'brand-scope'
  | 'flag-scope'
  | 'category'
  | 'name-unique'

/** One failure: the file it is about, the rule, and what is wrong. */
export interface LintIssue {
  /** The path from the repository root. */
  readonly file: string
  readonly rule: RuleId
  readonly message: string
}

/**
 * Formats an issue as one line: `path: [rule] message`.
 *
 * @param issue - The issue.
 * @returns The line.
 */
export function formatIssue(issue: LintIssue): string {
  return `${issue.file}: [${issue.rule}] ${issue.message}`
}
