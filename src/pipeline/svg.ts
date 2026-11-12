/**
 * @fileoverview Reading and writing SVG text: the parse every rule reads, the formatter
 * that normalises a source file, and the serialiser the static outputs are written with.
 * SVGO is the only XML parser, so what the lint reads is exactly what the formatter sees.
 * @layer Pipeline
 */

import { optimize } from 'svgo'
import type { CustomPlugin, XastChild, XastElement, XastParent, XastRoot } from 'svgo'

import { isStrokeKind, rootAttributes } from './svg-kind.ts'
import type { SvgKind } from './svg-kind.ts'

/** An element of a parsed SVG, with its attributes as written. */
export interface SvgElementNode {
  readonly type: 'element'
  readonly name: string
  readonly attributes: Readonly<Record<string, string>>
  readonly children: readonly SvgNode[]
}

/** Any other node: text, a comment, CDATA, a doctype or a processing instruction. */
export interface SvgOtherNode {
  readonly type: 'text' | 'comment' | 'cdata' | 'doctype' | 'instruction'
}

/** One node of a parsed SVG. */
export type SvgNode = SvgElementNode | SvgOtherNode

/** One drawing element, as the outputs write it: a tag and its attributes. */
export interface DrawingElement {
  readonly tag: string
  readonly attributes: Readonly<Record<string, string>>
}

/** Converts SVGO's tree into the read-only shape the rules consume. */
function toNode(node: XastChild): SvgNode {
  if (node.type !== 'element') return { type: node.type }
  return {
    type: 'element',
    name: node.name,
    attributes: { ...node.attributes },
    children: node.children.map(toNode)
  }
}

/**
 * Parses SVG text without changing it: SVGO runs with a single plugin that only records
 * the tree, so nothing is removed, reordered or rounded.
 *
 * @param text - The file's contents.
 * @returns The top-level nodes of the document.
 * @throws {Error} When the text is not well-formed XML.
 */
export function parseSvg(text: string): readonly SvgNode[] {
  const captured: XastChild[] = []
  const capture: CustomPlugin = {
    // Stryker disable next-line StringLiteral: SVGO uses a custom plugin's name only as a label, so any string behaves the same.
    name: 'bymax-capture',
    fn: (root: XastRoot) => {
      captured.push(...root.children)
      return null
    }
  }
  optimize(text, { plugins: [capture] })
  return captured.map(toNode)
}

/**
 * The document's single root element when it is an `<svg>`, or `undefined` when the
 * document holds anything else at the top level besides whitespace.
 *
 * @param nodes - The top-level nodes of a parsed document.
 * @returns The `<svg>` element.
 */
export function svgRoot(nodes: readonly SvgNode[]): SvgElementNode | undefined {
  const [only, ...rest] = nodes
  if (only?.type !== 'element' || only.name !== 'svg' || rest.length > 0) return undefined
  return only
}

/**
 * Whether an element is the spark dot: the filled detail any line icon may carry, a
 * `circle` of radius 1 filled with `currentColor`.
 *
 * @param name - The element's tag name.
 * @param attributes - The element's attributes.
 * @returns True for the spark dot.
 */
export function isSparkDot(name: string, attributes: Readonly<Record<string, string>>): boolean {
  return name === 'circle' && attributes['r'] === '1' && attributes['fill'] === 'currentColor'
}

/** Writes the kind's fixed root attributes, replacing whatever the root carried. */
function setRootPlugin(kind: SvgKind): CustomPlugin {
  return {
    // Stryker disable next-line StringLiteral: SVGO uses a custom plugin's name only as a label, so any string behaves the same.
    name: 'bymax-set-root',
    fn: () => ({
      element: {
        enter: (node: XastElement, parent: XastParent): void => {
          if (parent.type === 'root') node.attributes = { ...rootAttributes(kind) }
        }
      }
    })
  }
}

/**
 * Removes the paint the root owns from every drawing element: every `stroke*` attribute,
 * and on a stroked kind every fill control except a `fill` of `currentColor`.
 */
function stripPaintPlugin(kind: SvgKind): CustomPlugin {
  const stroked = isStrokeKind(kind)
  return {
    // Stryker disable next-line StringLiteral: SVGO uses a custom plugin's name only as a label, so any string behaves the same.
    name: 'bymax-strip-paint',
    fn: () => ({
      element: {
        // The root is stripped too; the plugin that runs after this one rewrites it whole.
        enter: (node: XastElement): void => {
          // A fill of currentColor is kept for the lint to judge: the spark dot and a partial
          // state may carry it, and the lint refuses it anywhere else.
          const ownColour = node.attributes['fill'] === 'currentColor'
          for (const name of Object.keys(node.attributes)) {
            const fillControl =
              name === 'fill' ? !ownColour : name === 'fill-rule' || name === 'clip-rule'
            if (name.startsWith('stroke') || (stroked && fillControl)) {
              Reflect.deleteProperty(node.attributes, name)
            }
          }
        }
      }
    })
  }
}

/**
 * Normalises a source SVG: SVGO's default preset without shape-to-path conversion or path
 * merging, numbers at three decimals, the paint the root owns stripped from the elements,
 * colours kept as `#rrggbb`, the kind's fixed root attributes, and one element per line.
 * The result is what a source file must hold, byte for byte.
 *
 * @param text - The source file's contents.
 * @param kind - The directory the file lives in.
 * @returns The normalised file, ending with a newline.
 * @throws {Error} When the text is not well-formed XML.
 */
export function normalizeSvg(text: string, kind: SvgKind): string {
  return optimize(text, {
    floatPrecision: 3,
    js2svg: { pretty: true, indent: 2, eol: 'lf' },
    plugins: [
      setRootPlugin(kind),
      {
        name: 'preset-default',
        params: {
          overrides: {
            convertShapeToPath: false,
            mergePaths: false,
            convertColors: { shorthex: false, shortname: false }
          }
        }
      },
      stripPaintPlugin(kind),
      setRootPlugin(kind)
    ]
  }).data
}

/** Escapes an attribute value for a double-quoted XML attribute. */
function escapeAttribute(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
}

/**
 * Writes an opening tag's name and attributes, as in `path d="M4 12h16"`.
 *
 * @param tag - The element name.
 * @param attributes - The attributes, written in their order.
 * @returns The tag body, without angle brackets.
 */
export function tagBody(tag: string, attributes: Readonly<Record<string, string>>): string {
  const written = Object.entries(attributes).map(
    ([name, value]) => ` ${name}="${escapeAttribute(value)}"`
  )
  return `${tag}${written.join('')}`
}

/**
 * Writes a container element around drawing elements, one element per line.
 *
 * @param tag - The container's name, `svg` or `symbol`.
 * @param attributes - The container's attributes.
 * @param elements - The drawing.
 * @param indent - The indentation of the container's own line.
 * @returns The element's text, without a trailing newline.
 */
export function serializeContainer(
  tag: string,
  attributes: Readonly<Record<string, string>>,
  elements: readonly DrawingElement[],
  indent = ''
): string {
  const lines = elements.map(
    (element) => `${indent}  <${tagBody(element.tag, element.attributes)}/>`
  )
  return [`${indent}<${tagBody(tag, attributes)}>`, ...lines, `${indent}</${tag}>`].join('\n')
}
