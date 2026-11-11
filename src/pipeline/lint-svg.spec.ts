/**
 * Unit tests for the rules one source SVG must pass.
 *
 * Layer: unit, with SVGO and resvg.
 * Goal: one failing fixture per rule of spec section 6.3 (parse, normalised form, root
 * attributes, allowed elements, forbidden attributes, fills with the spark-dot exception,
 * precision, live area), each asserted as the exact issue, and the drawing a clean file
 * yields.
 * Mocks: none.
 */

import { CIRCLE, drawing } from './__tests__/support.ts'
import { lintSvg } from './lint-svg.ts'
import type { SvgKind } from './svg-kind.ts'

const PATH = 'icons/line/a.svg'

/** Lints a file text as `icons/<kind>/a.svg`. */
const lint = (text: string, kind: SvgKind = 'line', multicolor = false) =>
  lintSvg({ file: { fileName: 'a.svg', path: `icons/${kind}/a.svg`, text }, kind, multicolor })

/** The messages of one rule. */
const messages = (text: string, rule: string, kind: SvgKind = 'line', multicolor = false) =>
  lint(text, kind, multicolor)
    .issues.filter((issue) => issue.rule === rule)
    .map((issue) => issue.message)

/** A drawing body in normalised form, so only the rule under test can fail. */
const normalised = (body: string, kind: SvgKind = 'line') => drawing(kind, body)

/** The stroked root, written by hand around a body the formatter would change. */
const raw = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`

describe('lintSvg: a clean file', () => {
  it('reports nothing and returns the drawing', () => {
    /**
     * Scenario: a normalised line drawing inside the live area passes every rule, and its
     * elements come back as the outputs write them.
     */
    expect(
      lint(normalised(`${CIRCLE}<circle cx="19" cy="5" r="1" fill="currentColor"/>`))
    ).toStrictEqual({
      issues: [],
      elements: [
        { tag: 'circle', attributes: { cx: '12', cy: '12', r: '7.25' } },
        { tag: 'circle', attributes: { cx: '19', cy: '5', r: '1', fill: 'currentColor' } }
      ]
    })
  })

  it.each([
    ['path', '<path d="M4 12h16"/>'],
    ['line', '<line x1="4" x2="20" y1="12" y2="12"/>'],
    ['polyline', '<polyline points="4 4 12 12 20 4"/>'],
    ['polygon', '<polygon points="4 4 12 12 20 4"/>'],
    ['circle', '<circle cx="12" cy="12" r="4"/>'],
    ['ellipse', '<ellipse cx="12" cy="12" rx="4" ry="6"/>'],
    ['rect', '<rect width="8" height="8" x="4" y="4" rx="2" ry="1"/>']
  ])('accepts a <%s> with its full geometry', (_tag, body) => {
    /**
     * Scenario: each allowed element of spec section 6.3, with every geometry attribute
     * it may carry, is a valid drawing.
     */
    expect(lint(normalised(body)).issues).toStrictEqual([])
  })

  it.each([
    ['filled', '<path fill-rule="evenodd" d="M4 4h16v16H4z" clip-rule="evenodd"/>'],
    ['brands', '<path d="M4 4h16v16H4z"/>']
  ] as const)('accepts a %s drawing filled by its root', (kind, body) => {
    /**
     * Scenario: a filled icon or a monochrome brand mark fills with the root's
     * currentColor and may knock out its interior with fill-rule and clip-rule.
     */
    expect(lint(normalised(body, kind), kind).issues).toStrictEqual([])
  })
})

describe('lintSvg: svg-parse', () => {
  it('reports text that is not well-formed XML, and returns no drawing', () => {
    /**
     * Scenario: a truncated file is reported with the parser's message, and no other rule
     * runs on it.
     */
    const report = lint('<svg><path d="M0 0"></svg>')
    expect(report.elements).toBeUndefined()
    expect(report.issues).toHaveLength(1)
    expect(report.issues[0]).toStrictEqual({
      file: PATH,
      rule: 'svg-parse',
      message: expect.stringContaining('SvgoParserError')
    })
  })

  it('reports a document whose root is not a single <svg>', () => {
    /**
     * Scenario: a file holding another root element is not a drawing file.
     */
    expect(lint('<g/>')).toStrictEqual({
      issues: [
        { file: PATH, rule: 'svg-parse', message: 'the file must hold a single <svg> root' }
      ],
      elements: undefined
    })
  })
})

describe('lintSvg: svg-normalised', () => {
  it('reports a file that is not what the formatter writes', () => {
    /**
     * Scenario: root attributes are written by the formatter, never by hand (spec section
     * 6.3), so a committed file that differs from its normalised form fails, even when
     * the drawing is otherwise valid.
     */
    const text = normalised(CIRCLE).replace('\n  <circle', '<circle')
    expect(lint(text).issues).toStrictEqual([
      {
        file: PATH,
        rule: 'svg-normalised',
        message: 'the file is not normalised: run pnpm generate'
      }
    ])
  })
})

describe('lintSvg: svg-normalised, when the formatter cannot read the file', () => {
  it.each([
    ['an element named like an object property', '<constructor/>'],
    ['a style value that is not CSS', '<path d="M4 12h16" style="x"/>']
  ])('reports %s instead of throwing', (_label, body) => {
    /**
     * Scenario: SVGO parses the file and then fails inside one of its plugins; the lint
     * reports that and goes on with every other rule and file.
     */
    expect(messages(raw(body), 'svg-normalised')).toStrictEqual([
      expect.stringMatching(/^the formatter cannot read the file: TypeError: /)
    ])
  })
})

describe('lintSvg: svg-root', () => {
  it('reports every root attribute that is missing, wrong or extra', () => {
    /**
     * Scenario: the root carries exactly the kind's fixed attributes; each departure is
     * named on its own.
     */
    const text = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" id="x" constructor="y">${CIRCLE}</svg>`
    expect(messages(text, 'svg-root')).toStrictEqual([
      'root attribute stroke-width must be "1.5"',
      'root attribute stroke-linejoin must be "round"',
      'root attribute id is not allowed',
      'root attribute constructor is not allowed'
    ])
  })

  it('holds a filled drawing to the filled root', () => {
    /**
     * Scenario: a filled icon's root fills with currentColor and carries no stroke.
     */
    expect(messages(raw(CIRCLE), 'svg-root', 'filled')).toStrictEqual([
      'root attribute fill must be "currentColor"',
      'root attribute stroke is not allowed',
      'root attribute stroke-width is not allowed',
      'root attribute stroke-linecap is not allowed',
      'root attribute stroke-linejoin is not allowed'
    ])
  })
})

describe('lintSvg: svg-element', () => {
  it.each([
    'g',
    'use',
    'linearGradient',
    'radialGradient',
    'mask',
    'filter',
    'style',
    'script',
    'image',
    'text',
    'title',
    'defs',
    'clipPath',
    'symbol',
    'foreignObject',
    'constructor',
    'toString'
  ])('reports a <%s> element', (tag) => {
    /**
     * Scenario: only path, line, polyline, polygon, circle, ellipse and rect may appear
     * (spec section 6.3); a name an object prototype carries is not an element either.
     */
    expect(messages(raw(`${CIRCLE}<${tag}/>`), 'svg-element')).toStrictEqual([
      `<${tag}> is not an allowed element`
    ])
  })

  it('reports an allowed element that has children', () => {
    /**
     * Scenario: drawing elements are empty; an `<animate>` or a `<title>` inside one is
     * content the runtime would never render.
     */
    expect(
      messages(raw('<path d="M4 12h16"><title>t</title></path>'), 'svg-element')
    ).toStrictEqual(['<path> may not have children'])
  })

  it.each([
    ['text', 'hello'],
    ['comment', '<!-- note -->'],
    ['cdata', '<![CDATA[x]]>']
  ])('reports %s content inside the root', (type, content) => {
    /**
     * Scenario: a drawing holds elements only; text, comments and CDATA are reported by
     * their kind.
     */
    expect(messages(raw(`${CIRCLE}${content}`), 'svg-element')).toStrictEqual([
      `${type} content is not allowed in a drawing`
    ])
  })

  it('leaves forbidden elements out of the drawing it returns', () => {
    /**
     * Scenario: the drawing holds only the allowed elements, so no output can carry a
     * forbidden one even while its issue is open.
     */
    expect(lint(raw(`${CIRCLE}<g/>`)).elements).toStrictEqual([
      { tag: 'circle', attributes: { cx: '12', cy: '12', r: '7.25' } }
    ])
  })
})

describe('lintSvg: svg-attribute', () => {
  it.each([
    'transform',
    'style',
    'id',
    'class',
    'filter',
    'mask',
    'clip-path',
    'opacity',
    'onclick',
    'stroke',
    'href'
  ])('reports a %s attribute', (name) => {
    /**
     * Scenario: no transform, style, id, class, filter or mask (spec section 6.3); a
     * drawing element carries its geometry and the fill controls only.
     */
    expect(messages(raw(`<path d="M4 12h16" ${name}="x"/>`), 'svg-attribute')).toStrictEqual([
      `<path> may not carry ${name}`
    ])
  })

  it('reports a geometry attribute of another element', () => {
    /**
     * Scenario: each element's geometry is its own: a line has no `d`, a path has no `r`.
     */
    expect(
      messages(
        raw('<line x1="4" y1="4" x2="20" y2="4" d="M0 0"/><path d="M4 12h16" r="2"/>'),
        'svg-attribute'
      )
    ).toStrictEqual(['<line> may not carry d', '<path> may not carry r'])
  })

  it('reports a namespaced reference and still measures the geometry', () => {
    /**
     * Scenario: an `xlink:href` on an allowed element is an attribute issue, not a crash.
     * The live area is measured from the geometry attributes alone, so nothing else the
     * file carries reaches the renderer: a hostile attribute is reported, never rendered.
     */
    const text = raw(
      '<path d="M4 12h16" xlink:href="file:///etc/hosts" href="file:///etc/hosts"/>'
    ).replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ')
    expect(messages(text, 'svg-attribute')).toStrictEqual([
      '<path> may not carry xlink:href',
      '<path> may not carry href'
    ])
    expect(messages(text, 'svg-live-area')).toStrictEqual([])
  })
})

describe('lintSvg: svg-fill', () => {
  const STROKED =
    'carries fill: a stroked drawing fills only the spark dot (a circle with r="1" and fill="currentColor")'

  it.each(['line', 'sm'] as const)('reports every fill control on a %s drawing', (kind) => {
    /**
     * Scenario: line icons fill nothing except the spark dot (spec section 2.4), so a
     * fill, a fill-rule or a clip-rule on any other element is reported.
     */
    expect(
      messages(
        raw('<path d="M4 12h16" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"/>'),
        'svg-fill',
        kind
      )
    ).toStrictEqual([
      `<path> ${STROKED}`,
      `<path> ${STROKED.replace('carries fill', 'carries fill-rule')}`,
      `<path> ${STROKED.replace('carries fill', 'carries clip-rule')}`
    ])
  })

  it('accepts the spark dot and reports a fill rule on it', () => {
    /**
     * Scenario: the dot is a circle of radius 1 filled with currentColor; its fill is the
     * exception, a fill-rule on it is not.
     */
    expect(
      messages(raw('<circle cx="19" cy="5" r="1" fill="currentColor"/>'), 'svg-fill')
    ).toStrictEqual([])
    expect(
      messages(
        raw('<circle cx="19" cy="5" r="1" fill="currentColor" fill-rule="evenodd"/>'),
        'svg-fill'
      )
    ).toStrictEqual([`<circle> ${STROKED.replace('carries fill', 'carries fill-rule')}`])
  })

  it.each([
    ['a larger dot', '<circle cx="19" cy="5" r="2" fill="currentColor"/>', '<circle>'],
    ['a dot of another colour', '<circle cx="19" cy="5" r="1" fill="#ff0000"/>', '<circle>'],
    ['a filled ellipse', '<ellipse cx="19" cy="5" rx="1" ry="1" fill="currentColor"/>', '<ellipse>']
  ])('reports %s as a fill, not a spark dot', (_label, body, tag) => {
    /**
     * Scenario: only the exact spark dot is exempt; any other filled shape in a line icon
     * is a fill.
     */
    expect(messages(raw(body), 'svg-fill')).toStrictEqual([`${tag} ${STROKED}`])
  })

  it.each(['filled', 'brands'] as const)('holds a %s drawing to currentColor', (kind) => {
    /**
     * Scenario: filled icons and monochrome brand marks follow the text colour (spec
     * sections 2.7 and 5); a literal colour or `none` is reported, an explicit
     * currentColor is not.
     */
    const body =
      '<path d="M4 4h4" fill="#ff0000"/><path d="M8 8h4" fill="none"/><path d="M2 2h4" fill="currentColor"/>'
    expect(messages(raw(body), 'svg-fill', kind)).toStrictEqual([
      '<path> fill="#ff0000" must be currentColor',
      '<path> fill="none" must be currentColor'
    ])
  })

  it('lets a multicolour brand mark keep #rrggbb colours, and nothing else', () => {
    /**
     * Scenario: the optional google-color mark keeps the owner's colours (decision D3);
     * they must be six-digit lower-case hex, which is what the formatter writes.
     */
    const body =
      '<path d="M2 2h4" fill="#4285f4"/><path d="M4 4h4" fill="currentColor"/><path d="M6 6h4" fill="#4285F4"/><path d="M8 8h4" fill="#4285f4ff"/><path d="M8 8h4" fill="red"/><path d="M8 8h4" fill="x#4285f4"/>'
    expect(messages(raw(body), 'svg-fill', 'brands', true)).toStrictEqual([
      '<path> fill="#4285F4" must be currentColor or a #rrggbb colour',
      '<path> fill="#4285f4ff" must be currentColor or a #rrggbb colour',
      '<path> fill="red" must be currentColor or a #rrggbb colour',
      '<path> fill="x#4285f4" must be currentColor or a #rrggbb colour'
    ])
  })
})

describe('lintSvg: svg-precision', () => {
  it.each([
    ['4.1234', 'x1'],
    ['.0001', 'x2'],
    ['-12.5005', 'y1'],
    ['12e10', 'y2'],
    ['1.5E-2', 'x1']
  ])('reports %p in %s', (number, name) => {
    /**
     * Scenario: coordinates carry at most three decimals (spec section 6.3), and an
     * exponent hides how many they carry.
     */
    const attributes = { x1: '4', y1: '4', x2: '20', y2: '4', [name]: number }
    const body = `<line ${Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')}/>`
    expect(messages(raw(body), 'svg-precision')).toStrictEqual([
      `<line> ${name} holds ${number}: at most 3 decimals, no exponent`
    ])
  })

  it('reads every number of path data and point lists, in every notation', () => {
    /**
     * Scenario: numbers in `d` and `points` run together (`4.5.5`, `-3-2`); each one is
     * checked.
     */
    const body = '<path d="M4.5.5l-3-2.2502h1.25"/><polyline points="4,4 8.125,8.1255"/>'
    expect(messages(raw(body), 'svg-precision')).toStrictEqual([
      '<path> d holds -2.2502: at most 3 decimals, no exponent',
      '<polyline> points holds 8.1255: at most 3 decimals, no exponent'
    ])
  })

  it('accepts three decimals, integers, a trailing point and signs', () => {
    /**
     * Scenario: 4.125, 12, 5. and +3 are all within the precision.
     */
    expect(messages(raw('<path d="M4.125 12L+3 5.h-1.5"/>'), 'svg-precision')).toStrictEqual([])
  })

  it('does not read colours as numbers', () => {
    /**
     * Scenario: a fill such as `#1e5a3c` is a colour, judged by the fill rule only, even
     * though `1e5` inside it reads as a number with an exponent.
     */
    expect(
      messages(raw('<path d="M4 4h4" fill="#1e5a3c"/>'), 'svg-precision', 'brands', true)
    ).toStrictEqual([])
  })
})

describe('lintSvg: svg-live-area', () => {
  it('reports a geometry outside the 21 x 21 limit, with both boxes', () => {
    /**
     * Scenario: a drawing reaching past the half-pixel allowance of the live area
     * (spec section 2.1) is reported with where it is and where it may be.
     */
    expect(
      messages(normalised('<line x1="1" x2="20" y1="12" y2="12"/>'), 'svg-live-area')
    ).toStrictEqual(['the geometry spans 1 12 20 12, outside the live area 1.5 1.5 22.5 22.5'])
  })

  it('reports a drawing that paints nothing', () => {
    /**
     * Scenario: an empty `<svg>` or a drawing of degenerate shapes is not an icon.
     */
    expect(messages(normalised(''), 'svg-live-area')).toStrictEqual(['the drawing paints nothing'])
  })
})
