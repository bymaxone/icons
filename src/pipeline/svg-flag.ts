/**
 * @fileoverview The formatter of a country flag source. A flag keeps the drawing of its source:
 * the path data, the shapes and their numbers are not rewritten, so the formatter runs SVGO
 * without the plugins that rewrite them. What it does change is the form: groups are flattened
 * onto their children (no SVGO plugin moves presentation attributes down), the stray `class`
 * and `clip-rule` are dropped, colours are written as lower-case `#rrggbb`, and the root keeps
 * its namespace and its own view box.
 * @layer Pipeline
 *
 * Relative imports in `src/pipeline` carry the `.ts` extension: Node runs this directory
 * directly with native type stripping.
 */

import { optimize } from 'svgo'
import type { CustomPlugin, XastChild, XastElement, XastParent } from 'svgo'

/** The presentation attributes of a group, written onto each of its children. */
const MOVED_DOWN = [
  'fill',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-miterlimit',
  'stroke-linejoin'
] as const

/** Attributes a flag does not keep: a class with no style sheet, and a rule for a clip. */
const DROPPED = ['class', 'clip-rule']

/** Attributes of a group that are neither moved nor dropped, so it cannot be flattened. */
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const HEX_COLOUR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function isElement(node: XastChild): node is XastElement {
  return node.type === 'element'
}

/**
 * Flattens one group: its presentation attributes are written onto each child that does not
 * carry its own, and the children take the group's place. An `opacity` moves only when the
 * group has one child that carries none, because on several children it would change how they
 * blend where they overlap.
 */
function flattenGroup(group: XastElement): XastChild[] {
  const inner = flattenChildren(group.children)
  const loose = inner.find((child) => !isElement(child))
  if (loose !== undefined) throw new Error(`a <g> holds ${loose.type} content`)
  const elements = inner.filter(isElement)
  const moved: Record<string, string> = {}
  for (const [name, value] of Object.entries(group.attributes)) {
    if (DROPPED.includes(name)) continue
    if (name === 'opacity') {
      const [only] = elements
      if (elements.length !== 1 || only === undefined || 'opacity' in only.attributes) {
        throw new Error('a <g> with an opacity holds several elements, or one with its own opacity')
      }
      only.attributes['opacity'] = value
    } else if ((MOVED_DOWN as readonly string[]).includes(name)) moved[name] = value
    else throw new Error(`a <g> carries ${name}, which cannot be moved onto its children`)
  }
  for (const child of elements) child.attributes = { ...moved, ...child.attributes }
  return elements
}

/** Flattens every group among the children, the innermost first. */
function flattenChildren(children: readonly XastChild[]): XastChild[] {
  return children.flatMap((child) =>
    isElement(child) && child.name === 'g' ? flattenGroup(child) : [child]
  )
}

/** Writes a colour as lower-case `#rrggbb`, and leaves any other value as it is. */
function hexColour(value: string): string {
  if (!HEX_COLOUR.test(value)) return value
  const digits = value.slice(1).toLowerCase()
  const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join('') : digits
  return `#${full}`
}

/** Flattens the groups under the root `<svg>`. */
const flattenGroups: CustomPlugin = {
  // Stryker disable next-line StringLiteral: SVGO uses a custom plugin's name only as a label, so any string behaves the same.
  name: 'bymax-flatten-groups',
  fn: () => ({
    element: {
      enter: (node: XastElement, parent: XastParent): void => {
        if (parent.type === 'root') node.children = flattenChildren(node.children)
      }
    }
  })
}

/** Drops the attributes a flag does not keep, and writes the colours that are left. */
const tidyAttributes: CustomPlugin = {
  // Stryker disable next-line StringLiteral: SVGO uses a custom plugin's name only as a label, so any string behaves the same.
  name: 'bymax-tidy-flag',
  fn: () => ({
    element: {
      enter: (node: XastElement): void => {
        for (const name of DROPPED) Reflect.deleteProperty(node.attributes, name)
        for (const name of ['fill', 'stroke']) {
          const value = node.attributes[name]
          if (value !== undefined) node.attributes[name] = hexColour(value)
        }
      }
    }
  })
}

/** Keeps the namespace and the view box of the source on the root, and nothing else. */
const keepRoot: CustomPlugin = {
  // Stryker disable next-line StringLiteral: SVGO uses a custom plugin's name only as a label, so any string behaves the same.
  name: 'bymax-flag-root',
  fn: () => ({
    element: {
      enter: (node: XastElement, parent: XastParent): void => {
        if (parent.type !== 'root') return
        const { viewBox } = node.attributes
        node.attributes = viewBox === undefined ? {} : { viewBox }
        node.attributes = { xmlns: SVG_NAMESPACE, ...node.attributes }
      }
    }
  })
}

/**
 * Normalises a flag source: SVGO's default preset without the plugins that rewrite a drawing
 * (path data, shapes, transforms, groups), attributes kept even when they equal the default (a
 * black stripe keeps its `fill`, so no inherited `fill` can repaint it), groups flattened, colours
 * as `#rrggbb`, one element per line.
 *
 * @param text - The file's contents.
 * @returns The normalised file, ending with a newline.
 * @throws {Error} When the text is not well-formed XML, or a group cannot be flattened.
 */
export function normalizeFlag(text: string): string {
  return optimize(text, {
    floatPrecision: 3,
    js2svg: { pretty: true, indent: 2, eol: 'lf' },
    plugins: [
      flattenGroups,
      {
        name: 'preset-default',
        params: {
          overrides: {
            convertShapeToPath: false,
            convertEllipseToCircle: false,
            mergePaths: false,
            convertPathData: false,
            convertTransform: false,
            moveElemsAttrsToGroup: false,
            moveGroupAttrsToElems: false,
            collapseGroups: false,
            removeUnknownsAndDefaults: { defaultAttrs: false },
            convertColors: { shorthex: false, shortname: false }
          }
        }
      },
      tidyAttributes,
      keepRoot
    ]
  }).data
}
