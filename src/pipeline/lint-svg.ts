/**
 * @fileoverview The rules one source SVG must pass on its own (spec section 6.3): its
 * root, its elements and attributes, its fills, its precision, its live area, and that it
 * is exactly what the formatter writes.
 * @layer Pipeline
 */

import type { LintIssue, RuleId } from './lint-issue.ts'
import { geometryBounds, isInsideLiveArea, LIVE_AREA_LIMIT } from './live-area.ts'
import type { SourceFile } from './sources.ts'
import { isStrokeKind, rootAttributes } from './svg-kind.ts'
import type { SvgKind } from './svg-kind.ts'
import { isSparkDot, normalizeSvg, parseSvg, svgRoot } from './svg.ts'
import type { DrawingElement, SvgElementNode } from './svg.ts'

/**
 * The allowed elements and the geometry each may carry; every element may also carry the
 * fill controls. A Map, so a name such as `constructor` is not found on a prototype.
 */
const GEOMETRY: ReadonlyMap<string, readonly string[]> = new Map([
  ['path', ['d']],
  ['line', ['x1', 'y1', 'x2', 'y2']],
  ['polyline', ['points']],
  ['polygon', ['points']],
  ['circle', ['cx', 'cy', 'r']],
  ['ellipse', ['cx', 'cy', 'rx', 'ry']],
  ['rect', ['x', 'y', 'width', 'height', 'rx', 'ry']]
])

/** An allowed element of a drawing, with the geometry its tag may carry. */
interface CheckedElement extends DrawingElement {
  readonly geometry: readonly string[]
}

/** The attributes that decide how an element is filled. */
const FILL_CONTROLS = ['fill', 'fill-rule', 'clip-rule']

/**
 * The line icons whose meaning is a partial state, which may fill the region that shows it
 * with `currentColor` (spec section 2.5): there the fill is the state. Each carries its reason.
 */
export const PARTIAL_FILLS: ReadonlyMap<string, string> = new Map([
  ['contrast', 'the filled half is the contrast between two tones'],
  ['heart-half', 'the filled half is a partial like or rating'],
  ['shield-half', 'the filled half is a partial protection'],
  ['star-half', 'the filled half is a half rating']
])

/** A colour a multicolour brand mark may fill with besides `currentColor`. */
const HEX_COLOUR = /^#[0-9a-f]{6}$/

/** Every number in an attribute value, in any notation SVG accepts. */
const NUMBER = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g

/** What a source SVG is checked as. */
export interface SvgSubject {
  readonly file: SourceFile
  readonly kind: SvgKind
  /** A brand mark that keeps its official colours. */
  readonly multicolor: boolean
}

/** The outcome of checking one file: its issues and, when it parses, its drawing. */
export interface SvgReport {
  readonly issues: readonly LintIssue[]
  readonly elements: readonly DrawingElement[] | undefined
  /** The view box of a flag, which keeps its own; absent for every other kind. */
  readonly viewBox?: string | undefined
}

/** The root's attributes against the kind's fixed set. */
function rootMessages(root: SvgElementNode, kind: SvgKind): string[] {
  const expected = rootAttributes(kind)
  const actual = new Map(Object.entries(root.attributes))
  const wrong = Object.entries(expected)
    .filter(([name, value]) => actual.get(name) !== value)
    .map(([name, value]) => `root attribute ${name} must be "${value}"`)
  const extra = [...actual.keys()]
    .filter((name) => !Object.hasOwn(expected, name))
    .map((name) => `root attribute ${name} is not allowed`)
  return [...wrong, ...extra]
}

/** The root's children: allowed elements only, each empty, and no other node. */
function elementMessages(root: SvgElementNode): string[] {
  return root.children.flatMap((child) => {
    if (child.type !== 'element') return [`${child.type} content is not allowed in a drawing`]
    if (!GEOMETRY.has(child.name)) return [`<${child.name}> is not an allowed element`]
    return child.children.length > 0 ? [`<${child.name}> may not have children`] : []
  })
}

/** Attributes outside an element's geometry and the fill controls. */
function attributeMessages(elements: readonly CheckedElement[]): string[] {
  return elements.flatMap(({ tag, attributes, geometry }) =>
    Object.keys(attributes)
      .filter((name) => !geometry.includes(name) && !FILL_CONTROLS.includes(name))
      .map((name) => `<${tag}> may not carry ${name}`)
  )
}

/**
 * The one element of a stroked icon in PARTIAL_FILLS that may draw its partial state: the
 * first one filled with `currentColor` that is not the spark dot. -1 for any other icon.
 */
function partialRegion(elements: readonly DrawingElement[], subject: SvgSubject): number {
  if (!PARTIAL_FILLS.has(subject.file.fileName.slice(0, -'.svg'.length))) return -1
  return elements.findIndex(
    ({ tag, attributes }) => attributes['fill'] === 'currentColor' && !isSparkDot(tag, attributes)
  )
}

/** How the elements are filled, per the kind's paint. */
function fillMessages(elements: readonly DrawingElement[], subject: SvgSubject): string[] {
  const region = partialRegion(elements, subject)
  return elements.flatMap(({ tag, attributes }, index) => {
    if (isStrokeKind(subject.kind)) {
      const exempt = index === region || isSparkDot(tag, attributes)
      return FILL_CONTROLS.filter((name) => name in attributes && !(exempt && name === 'fill')).map(
        (name) =>
          `<${tag}> carries ${name}: a stroked drawing fills only the spark dot (a circle with r="1" and fill="currentColor") and one region, the partial state of an icon in PARTIAL_FILLS`
      )
    }
    const fill = attributes['fill']
    const allowed = fill === undefined || fill === 'currentColor'
    if (allowed || (subject.multicolor && HEX_COLOUR.test(fill))) return []
    const colours = subject.multicolor ? 'currentColor or a #rrggbb colour' : 'currentColor'
    return [`<${tag}> fill="${fill}" must be ${colours}`]
  })
}

/** Numbers with more than three decimals or an exponent, in every geometry attribute. */
function precisionMessages(elements: readonly DrawingElement[]): string[] {
  return elements.flatMap(({ tag, attributes }) =>
    Object.entries(attributes)
      .filter(([name]) => !FILL_CONTROLS.includes(name))
      .flatMap(([name, value]) =>
        [...value.matchAll(NUMBER)]
          .map(([number]) => number)
          .filter((number) => /[eE]/.test(number) || (number.split('.')[1] ?? '').length > 3)
          .map((number) => `<${tag}> ${name} holds ${number}: at most 3 decimals, no exponent`)
      )
  )
}

/** The drawing's geometry against the live area. */
function liveAreaMessages(elements: readonly DrawingElement[]): string[] {
  const bounds = geometryBounds(elements)
  if (bounds === undefined) return ['the drawing paints nothing']
  if (isInsideLiveArea(bounds)) return []
  const box = (b: typeof bounds): string => `${b.left} ${b.top} ${b.right} ${b.bottom}`
  return [`the geometry spans ${box(bounds)}, outside the live area ${box(LIVE_AREA_LIMIT)}`]
}

/**
 * Whether the file is what the formatter writes. SVGO can parse a file and still fail to
 * optimise it (an unparseable `style` value, an element named like an object property),
 * which is reported rather than thrown, so one bad file does not stop the lint.
 */
function normalisedMessages(text: string, kind: SvgKind): string[] {
  try {
    return normalizeSvg(text, kind) === text
      ? []
      : ['the file is not normalised: run pnpm generate']
  } catch (error) {
    return [`the formatter cannot read the file: ${String(error)}`]
  }
}

/**
 * An element with its geometry attributes only. The live area is measured on this, so an
 * attribute the lint reports, such as a reference to a file, never reaches the renderer.
 */
function geometryOnly({ tag, attributes, geometry }: CheckedElement): DrawingElement {
  const kept = Object.entries(attributes).filter(([name]) => geometry.includes(name))
  return { tag, attributes: Object.fromEntries(kept) }
}

/** The root's allowed drawing elements, with the geometry each may carry. */
function drawingElements(root: SvgElementNode): readonly CheckedElement[] {
  return root.children.flatMap((child) => {
    if (child.type !== 'element') return []
    const geometry = GEOMETRY.get(child.name)
    return geometry === undefined
      ? []
      : [{ tag: child.name, attributes: child.attributes, geometry }]
  })
}

/**
 * Checks one source SVG against every rule a file can be checked on alone.
 *
 * @param subject - The file, its kind, and whether it is a multicolour brand mark.
 * @returns The issues, and the drawing when the file parses to an `<svg>` root.
 */
export function lintSvg(subject: SvgSubject): SvgReport {
  const { path, text } = subject.file
  const at =
    (rule: RuleId) =>
    (message: string): LintIssue => ({ file: path, rule, message })
  let root: SvgElementNode | undefined
  try {
    root = svgRoot(parseSvg(text))
  } catch (error) {
    return { issues: [at('svg-parse')(String(error))], elements: undefined }
  }
  if (root === undefined) {
    return {
      issues: [at('svg-parse')('the file must hold a single <svg> root')],
      elements: undefined
    }
  }
  const elements = drawingElements(root)
  const issues = [
    ...normalisedMessages(text, subject.kind).map(at('svg-normalised')),
    ...rootMessages(root, subject.kind).map(at('svg-root')),
    ...elementMessages(root).map(at('svg-element')),
    ...attributeMessages(elements).map(at('svg-attribute')),
    ...fillMessages(elements, subject).map(at('svg-fill')),
    ...precisionMessages(elements).map(at('svg-precision')),
    ...liveAreaMessages(elements.map(geometryOnly)).map(at('svg-live-area'))
  ]
  return { issues, elements: elements.map(({ tag, attributes }) => ({ tag, attributes })) }
}
