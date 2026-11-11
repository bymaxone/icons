/**
 * @fileoverview The pull-request preview's contract, split the way an untrusted pull
 * request needs. An unprivileged job reads the changed drawings, lints them with the base
 * branch's lint and, only when they pass, renders them and writes a manifest; a privileged
 * job trusts nothing it receives, so the manifest is validated field by field, the images
 * by their signature and size, and the comment is written only from validated fields. This
 * module imports nothing, so the privileged job runs without installing a dependency.
 * @layer Pipeline
 */

/** A file under `icons/` a pull request adds, changes or deletes. */
export interface DrawingChange {
  readonly path: string
  readonly name: string
  readonly status: 'added' | 'modified' | 'deleted'
}

/**
 * The paths a preview reads: a drawing (`.svg` in a drawing directory) or a metadata file
 * (`.json` in `meta`), with a kebab-case name.
 */
const SOURCE_PATH =
  /^icons\/(?:(?:line|filled|sm|brands)\/([a-z0-9]+(?:-[a-z0-9]+)*)\.svg|meta\/([a-z0-9]+(?:-[a-z0-9]+)*)\.json)$/

/** A git object name. */
const COMMIT = /^[0-9a-f]{40}$/
/** An icon or brand name. */
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
/** An icon variant. */
const VARIANT = /^(?:line|filled|sm)$/
/** A reference id, `<set>/<name>`. */
const REFERENCE_ID = /^[a-z]+\/[a-z0-9]+(?:-[a-z0-9]+)*$/
/** An image the preview publishes. */
export const IMAGE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.png$/

/** The most icons a manifest may list. */
export const MAX_ICONS = 200
/** The most images a manifest may list. */
export const MAX_IMAGES = 4
/** The largest image the preview publishes, in bytes. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
/** The marker that identifies the preview comment, so it is updated rather than repeated. */
export const COMMENT_MARKER = '<!-- bymax-icons-preview -->'

/** The status letters of `git diff --name-status --no-renames`. */
const STATUS: ReadonlyMap<string, DrawingChange['status']> = new Map([
  ['A', 'added'],
  ['M', 'modified'],
  ['D', 'deleted']
])

/**
 * Reads the output of `git diff --name-status --no-renames`, keeping the files a preview
 * reads and dropping every other path, so an unexpected path never reaches a file name.
 *
 * @param text - The command's output, one `<status>\t<path>` a line.
 * @returns The changes, in the order listed.
 */
export function parseChanges(text: string): DrawingChange[] {
  return text.split('\n').flatMap((line) => {
    // Stryker disable next-line StringLiteral: a missing path only has to fail SOURCE_PATH, whatever text stands in for it
    const [letter, path = '', ...rest] = line.split('\t')
    const status = STATUS.get(String(letter))
    const match = SOURCE_PATH.exec(path)
    const name = match?.[1] ?? match?.[2]
    if (status === undefined || name === undefined || rest.length > 0) return []
    return [{ path, name, status }]
  })
}

/** The scores of one reference near a changed icon. */
export interface PreviewMatch {
  readonly id: string
  readonly distance: number
  readonly overlap: number
  readonly cosine: number
}

/** A changed icon in the manifest. */
export interface PreviewIcon {
  readonly name: string
  readonly variant: 'line' | 'filled' | 'sm'
  readonly flagged: boolean
  readonly primitive: boolean
  readonly matches: readonly PreviewMatch[]
}

/** What the unprivileged job hands the privileged one. */
export interface PreviewManifest {
  readonly pr: number
  readonly head: string
  /** Whether the base branch's lint passed on the changed drawings; nothing is rendered otherwise. */
  readonly lint: 'passed' | 'failed'
  /** How many lint issues were found; the details stay in the unprivileged job's log. */
  readonly issues: number
  readonly icons: readonly PreviewIcon[]
  /** The images the job rendered, by file name. */
  readonly images: readonly string[]
}

/** Fails validation with a reason. */
function invalid(reason: string): never {
  throw new Error(`invalid preview manifest: ${reason}`)
}

/** A plain object's own field, or a failure when the value is not a plain object. */
function field(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalid('not an object')
  return Object.hasOwn(value, key) ? Reflect.get(value, key) : undefined
}

/** A string matching a pattern. */
function text(value: unknown, pattern: RegExp, what: string): string {
  if (typeof value !== 'string' || !pattern.test(value)) invalid(what)
  return value
}

/** A finite number within bounds. */
function number(value: unknown, min: number, max: number, what: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    invalid(what)
  }
  return value
}

/** A boolean. */
function flag(value: unknown, what: string): boolean {
  if (typeof value !== 'boolean') invalid(what)
  return value
}

/** An array of at most `max` items. */
function list(value: unknown, max: number, what: string): readonly unknown[] {
  if (!Array.isArray(value) || value.length > max) invalid(what)
  return value
}

/** A changed icon, checked field by field. */
function previewIcon(value: unknown): PreviewIcon {
  return {
    name: text(field(value, 'name'), NAME, 'icon name'),
    variant: text(field(value, 'variant'), VARIANT, 'variant') as PreviewIcon['variant'],
    flagged: flag(field(value, 'flagged'), 'flagged'),
    primitive: flag(field(value, 'primitive'), 'primitive'),
    matches: list(field(value, 'matches'), 3, 'matches').map((match) => ({
      id: text(field(match, 'id'), REFERENCE_ID, 'reference id'),
      distance: number(field(match, 'distance'), 0, 1e9, 'distance'),
      overlap: number(field(match, 'overlap'), 0, 1, 'overlap'),
      cosine: number(field(match, 'cosine'), 0, 1, 'cosine')
    }))
  }
}

/**
 * Validates a manifest received from the unprivileged job and rebuilds it from its checked
 * fields only, so nothing it carries beyond them reaches the comment.
 *
 * @param value - The parsed JSON.
 * @returns The manifest.
 * @throws {Error} When any field is missing, mistyped or out of bounds.
 */
export function validateManifest(value: unknown): PreviewManifest {
  const lint = field(value, 'lint')
  if (lint !== 'passed' && lint !== 'failed') invalid('lint')
  return {
    pr: number(field(value, 'pr'), 1, Number.MAX_SAFE_INTEGER, 'pull request number'),
    head: text(field(value, 'head'), COMMIT, 'head commit'),
    lint,
    issues: number(field(value, 'issues'), 0, 1e6, 'issue count'),
    icons: list(field(value, 'icons'), MAX_ICONS, 'icons').map(previewIcon),
    images: list(field(value, 'images'), MAX_IMAGES, 'images').map((image) =>
      text(image, IMAGE, 'image name')
    )
  }
}

/** The eight bytes every PNG file starts with. */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const

/**
 * Whether bytes are a PNG file small enough to publish.
 *
 * @param bytes - The file's contents.
 * @returns True for a PNG of at most `MAX_IMAGE_BYTES`.
 */
export function isPublishablePng(bytes: Uint8Array): boolean {
  return (
    // Stryker disable next-line ConditionalExpression: a buffer shorter than the signature fails the byte comparison below anyway, so this guard is redundant
    bytes.length >= PNG_SIGNATURE.length &&
    bytes.length <= MAX_IMAGE_BYTES &&
    PNG_SIGNATURE.every((byte, index) => bytes.at(index) === byte)
  )
}

/** The scores of a match, for the comment. */
function matchCell(match: PreviewMatch): string {
  return `\`${match.id}\` d=${match.distance.toFixed(2)} iou=${match.overlap.toFixed(2)} cos=${match.cosine.toFixed(2)}`
}

/** What a reviewer does with a changed icon. */
function verdict(icon: PreviewIcon): string {
  if (!icon.flagged) return 'clear'
  return icon.primitive ? 'flagged, primitive (expected)' : '**flagged, review**'
}

/**
 * The preview comment, written only from a validated manifest and from image addresses
 * the privileged job built itself.
 *
 * @param manifest - The validated manifest.
 * @param imageUrl - The published address of an image, by file name.
 * @returns The comment's Markdown.
 */
export function commentBody(manifest: PreviewManifest, imageUrl: (file: string) => string): string {
  const head = manifest.head.slice(0, 7)
  if (manifest.lint === 'failed') {
    return [
      COMMENT_MARKER,
      `### Icon preview for ${head}`,
      '',
      `The icon lint found ${manifest.issues} issue(s) in the changed drawings, so nothing was rendered. The details are in the log of the icon preview check.`,
      ''
    ].join('\n')
  }
  const rows = manifest.icons.map(
    (icon) =>
      `| \`${icon.name}\` (${icon.variant}) | ${verdict(icon)} | ${icon.matches.map(matchCell).join('<br>')} |`
  )
  const images = manifest.images.map((file) => `![${file}](${imageUrl(file)})`)
  return [
    COMMENT_MARKER,
    `### Icon preview for ${head}`,
    '',
    ...images,
    '',
    '| Icon | Similarity | Nearest third-party icons |',
    '| --- | --- | --- |',
    ...rows,
    '',
    'A flag asks for a human review of the resemblance; it does not fail the pull request.',
    ''
  ].join('\n')
}
