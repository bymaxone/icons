/**
 * @fileoverview The `flag` profile: the rules a country flag source must pass on its own
 * (spec section 5.1). A flag keeps its own view box, which is 3:2, and its own colours, so
 * it has no live area, no ink ceiling and no root paint: its elements are checked for the
 * shapes and the paint they may carry, its colours for `#rrggbb`, its numbers for precision,
 * its size, and that it is exactly what the flag formatter writes.
 * @layer Pipeline
 */

import { parseViewBox } from '../runtime/view-box.ts'
import type { LintIssue, RuleId } from './lint-issue.ts'
import type { SvgReport } from './lint-svg.ts'
import type { SourceFile } from './sources.ts'
import { rootAttributes } from './svg-kind.ts'
import { normalizeSvg, parseSvg, svgRoot } from './svg.ts'
import type { DrawingElement, SvgElementNode } from './svg.ts'

/** The most bytes a flag source may hold. */
export const FLAG_MAX_BYTES = 8 * 1024

/** How far the width over the height of a flag's view box may be from 3 over 2. */
export const FLAG_RATIO_TOLERANCE = 0.002

/** The allowed elements and the geometry each may carry. A Map, so `constructor` is no element. */
const GEOMETRY: ReadonlyMap<string, readonly string[]> = new Map([
  ['path', ['d']],
  ['circle', ['cx', 'cy', 'r']],
  ['ellipse', ['cx', 'cy', 'rx', 'ry']],
  ['rect', ['x', 'y', 'width', 'height', 'rx', 'ry']],
  ['polygon', ['points']]
])

/** The paint attributes a flag element may carry, beside its geometry. */
const PAINT = [
  'fill',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-miterlimit',
  'stroke-linejoin',
  'opacity'
]

/** The attributes that name a colour. */
const COLOURS = ['fill', 'stroke']

const HEX_COLOUR = /^#[0-9a-f]{6}$/

/** A whole number as SVG writes it: no blank, no hexadecimal, no word. */
const NUMBER_TEXT = /^[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?$/

/** Every number in an attribute value, in any notation SVG accepts. */
const NUMBER = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g

/** The values an attribute that names a keyword may take. */
const KEYWORDS: ReadonlyMap<string, readonly string[]> = new Map([
  ['fill-rule', ['nonzero', 'evenodd']],
  ['stroke-linejoin', ['miter', 'round', 'bevel']]
])

/** An allowed element with the geometry its tag may carry. */
interface CheckedElement extends DrawingElement {
  readonly geometry: readonly string[]
}

/** The root holds the namespace and a view box that is four numbers and 3:2. */
function rootMessages(root: SvgElementNode): string[] {
  const namespace = rootAttributes('flags')
  const wrong = Object.entries(namespace)
    .filter(([name, value]) => root.attributes[name] !== value)
    .map(([name, value]) => `root attribute ${name} must be "${value}"`)
  const extra = Object.keys(root.attributes)
    .filter((name) => !Object.hasOwn(namespace, name) && name !== 'viewBox')
    .map((name) => `root attribute ${name} is not allowed`)
  const text = root.attributes['viewBox']
  if (text === undefined) return [...wrong, ...extra, 'root attribute viewBox is required']
  const box = parseViewBox(text)
  if (box === undefined) {
    return [...wrong, ...extra, `the viewBox "${text}" is not four numbers with a positive size`]
  }
  const off = Math.abs(box.width / box.height - 3 / 2) > FLAG_RATIO_TOLERANCE
  const ratio = off ? [`the viewBox "${text}" is not 3:2`] : []
  return [...wrong, ...extra, ...ratio]
}

/** The root's children: allowed elements only, each empty, and no other node. */
function elementMessages(root: SvgElementNode): string[] {
  const messages = root.children.flatMap((child) => {
    if (child.type !== 'element') return [`${child.type} content is not allowed in a flag`]
    if (!GEOMETRY.has(child.name)) return [`<${child.name}> is not an allowed element`]
    return child.children.length > 0 ? [`<${child.name}> may not have children`] : []
  })
  return root.children.length === 0 ? ['the flag paints nothing'] : messages
}

/** Attributes outside an element's geometry and the paint a flag may carry. */
function attributeMessages(elements: readonly CheckedElement[]): string[] {
  return elements.flatMap(({ tag, attributes, geometry }) =>
    Object.keys(attributes)
      .filter((name) => !geometry.includes(name) && !PAINT.includes(name))
      .map((name) => `<${tag}> may not carry ${name}`)
  )
}

/** Colours are `#rrggbb` or `none`; `opacity` is a number from 0 to 1; keywords are known. */
function paintMessages(elements: readonly CheckedElement[]): string[] {
  return elements.flatMap(({ tag, attributes }) => {
    const colours = COLOURS.flatMap((name) => {
      const value = attributes[name]
      if (value === undefined || value === 'none' || HEX_COLOUR.test(value)) return []
      return [`<${tag}> ${name}="${value}" must be #rrggbb or none`]
    })
    const opacity = attributes['opacity']
    const level = opacity !== undefined && NUMBER_TEXT.test(opacity) ? Number(opacity) : Number.NaN
    const opacityMessages =
      opacity === undefined || (level >= 0 && level <= 1)
        ? []
        : [`<${tag}> opacity="${opacity}" must be a number from 0 to 1`]
    const keywords = [...KEYWORDS].flatMap(([name, allowed]) => {
      const value = attributes[name]
      return value === undefined || allowed.includes(value)
        ? []
        : [`<${tag}> ${name}="${value}" must be one of ${allowed.join(', ')}`]
    })
    return [...colours, ...opacityMessages, ...keywords]
  })
}

/** Numbers with more than three decimals or an exponent, in the root and every attribute. */
function precisionMessages(root: SvgElementNode, elements: readonly CheckedElement[]): string[] {
  const values: [string, string, string][] = [
    ...Object.entries(root.attributes)
      .filter(([name]) => name === 'viewBox')
      .map(([name, value]): [string, string, string] => ['svg', name, value]),
    ...elements.flatMap(({ tag, attributes }) =>
      Object.entries(attributes)
        .filter(([name]) => !COLOURS.includes(name) && !KEYWORDS.has(name))
        .map(([name, value]): [string, string, string] => [tag, name, value])
    )
  ]
  return values.flatMap(([tag, name, value]) =>
    [...value.matchAll(NUMBER)]
      .map(([number]) => number)
      .filter((number) => /[eE]/.test(number) || (number.split('.')[1] ?? '').length > 3)
      .map((number) => `<${tag}> ${name} holds ${number}: at most 3 decimals, no exponent`)
  )
}

/** Whether the file is what the flag formatter writes; a file it cannot read is reported. */
function normalisedMessages(text: string): string[] {
  try {
    return normalizeSvg(text, 'flags') === text
      ? []
      : ['the file is not normalised: run pnpm generate']
  } catch (error) {
    return [`the formatter cannot read the file: ${String(error)}`]
  }
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
 * Checks one flag source against every rule of the `flag` profile.
 *
 * @param file - The source file.
 * @returns The issues, and the drawing when the file parses to an `<svg>` root.
 */
export function lintFlag(file: SourceFile): SvgReport {
  const { path, text } = file
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
  const size = Buffer.byteLength(text)
  const tooBig =
    size > FLAG_MAX_BYTES ? [`the file holds ${size} bytes: at most ${FLAG_MAX_BYTES}`] : []
  const issues = [
    ...normalisedMessages(text).map(at('svg-normalised')),
    ...rootMessages(root).map(at('svg-root')),
    ...elementMessages(root).map(at('svg-element')),
    ...attributeMessages(elements).map(at('svg-attribute')),
    ...paintMessages(elements).map(at('svg-fill')),
    ...precisionMessages(root, elements).map(at('svg-precision')),
    ...tooBig.map(at('svg-size'))
  ]
  return {
    issues,
    elements: elements.map(({ tag, attributes }) => ({ tag, attributes })),
    viewBox: root.attributes['viewBox']
  }
}
