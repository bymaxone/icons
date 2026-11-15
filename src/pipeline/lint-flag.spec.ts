/**
 * Unit tests for the `flag` lint profile.
 *
 * Layer: unit, on in-memory files.
 * Goal: pin every rule a country flag source must pass on its own: it is what the flag
 * formatter writes, its root is the namespace and a 3:2 view box, its elements and attributes
 * are the ones the profile allows, its colours are `#rrggbb` or `none`, its numbers carry at
 * most three decimals, and it stays under 8 KiB.
 * Mocks: none.
 */

import { BANDS, flagDrawing } from './__tests__/support.ts'
import { FLAG_MAX_BYTES, lintFlag } from './lint-flag.ts'
import type { LintIssue } from './lint-issue.ts'

/** Lints a text as the file `icons/flags/se-flag.svg`. */
const lint = (text: string): ReturnType<typeof lintFlag> =>
  lintFlag({ fileName: 'se-flag.svg', path: 'icons/flags/se-flag.svg', text })

/** The messages of the issues of one rule. */
const messages = (issues: readonly LintIssue[], rule: LintIssue['rule']): string[] =>
  issues.filter((issue) => issue.rule === rule).map((issue) => issue.message)

/** A flag file the formatter would write, from a root and a body, whatever they hold. */
const written = (body: string, root = 'viewBox="0 0 513 342"'): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${root}>\n${body}\n</svg>\n`

describe('lintFlag: a valid flag', () => {
  it('passes with no issue and returns its drawing and its view box', () => {
    /**
     * Scenario: a flag the formatter wrote, with allowed elements, attributes and colours,
     * is clean, and the report carries what the generator needs.
     */
    const report = lint(flagDrawing(BANDS))
    expect(report.issues).toStrictEqual([])
    expect(report.viewBox).toBe('0 0 513 342')
    expect(report.elements).toStrictEqual([
      { tag: 'path', attributes: { fill: '#004f8e', d: 'M0 0h513v342H0z' } },
      { tag: 'path', attributes: { fill: '#f6c500', d: 'M0 171h513v57H0z' } }
    ])
  })

  it('accepts every element, every paint attribute and a stroked drawing', () => {
    /**
     * Scenario: the profile is the union of what the 265 sources use: the five shapes, the
     * fill and the stroke with their controls, and an opacity.
     */
    const text = flagDrawing(
      '<path fill="#ffffff" fill-rule="evenodd" opacity=".5" d="M0 0h1v1z"/>' +
        '<circle fill="none" stroke="#000000" stroke-width="8" stroke-miterlimit="10" stroke-linejoin="bevel" cx="1" cy="1" r="1"/>' +
        '<ellipse fill="#111111" cx="1" cy="1" rx="2" ry="1"/>' +
        '<rect fill="#222222" x="1" y="1" width="2" height="1" rx=".5"/>' +
        '<polygon fill="#333333" points="0 0 1 0 1 1"/>'
    )
    expect(lint(text).issues).toStrictEqual([])
  })
})

describe('lintFlag: the file', () => {
  it('reports a file that is not what the formatter writes', () => {
    /** Scenario: a shortened colour and a different layout are caught by the formatter. */
    const text = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 513 342"><path fill="#fff" d="M0 0h513v342H0z"/></svg>`
    expect(messages(lint(text).issues, 'svg-normalised')).toStrictEqual([
      'the file is not normalised: run pnpm generate'
    ])
  })

  it('reports a file the formatter cannot read', () => {
    /**
     * Scenario: a group that cannot be flattened stops the formatter; that is reported on the
     * file, and the rest of the lint carries on.
     */
    const text = written('<g transform="scale(2)"><path fill="#ffffff" d="M0 0h1v1z"/></g>')
    expect(messages(lint(text).issues, 'svg-normalised')).toStrictEqual([
      'the formatter cannot read the file: Error: a <g> carries transform, which cannot be moved onto its children'
    ])
  })

  it('reports a file the XML parser rejects', () => {
    /** Scenario: a truncated file is reported with the parser's message, and no other rule runs. */
    const report = lint('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"></svg>')
    expect(report.issues).toHaveLength(1)
    expect(report.issues[0]?.rule).toBe('svg-parse')
    expect(report.elements).toBeUndefined()
  })

  it('reports text that is not XML, and a document that is not an svg', () => {
    /** Scenario: nothing else can be checked without a single `<svg>` root. */
    expect(lint('<svg').issues.map((issue) => issue.rule)).toStrictEqual(['svg-parse'])
    expect(lint('<div/>').issues).toStrictEqual([
      {
        file: 'icons/flags/se-flag.svg',
        rule: 'svg-parse',
        message: 'the file must hold a single <svg> root'
      }
    ])
    expect(lint('<svg xmlns="http://www.w3.org/2000/svg"/><svg/>').elements).toBeUndefined()
  })

  it('holds a file to 8 KiB', () => {
    /** Scenario: a flag that grows past the limit is reported with its size. */
    const body = `<path fill="#ffffff" d="M0 0h1v1z"/>\n`.repeat(Math.ceil(FLAG_MAX_BYTES / 36))
    const text = written(body)
    expect(messages(lint(text).issues, 'svg-size')).toStrictEqual([
      `the file holds ${Buffer.byteLength(text)} bytes: at most ${FLAG_MAX_BYTES}`
    ])
  })
})

describe('lintFlag: the root', () => {
  it('requires the namespace', () => {
    /** Scenario: a root without the SVG namespace is not an SVG a browser draws. */
    const text = '<svg viewBox="0 0 513 342"><path fill="#ffffff" d="M0 0h1v1z"/></svg>'
    expect(messages(lint(text).issues, 'svg-root')).toStrictEqual([
      'root attribute xmlns must be "http://www.w3.org/2000/svg"'
    ])
  })

  it('refuses another root attribute', () => {
    /** Scenario: the root holds the namespace and the view box, and nothing else. */
    const text = written('<path fill="#ffffff" d="M0 0h1v1z"/>', 'viewBox="0 0 513 342" width="24"')
    expect(messages(lint(text).issues, 'svg-root')).toStrictEqual([
      'root attribute width is not allowed'
    ])
  })

  it('requires a view box', () => {
    /** Scenario: a flag keeps its own view box, so one without it cannot be sized. */
    expect(
      messages(lint(written('<path fill="#ffffff" d="M0 0h1v1z"/>', '')).issues, 'svg-root')
    ).toStrictEqual(['root attribute viewBox is required'])
  })

  it.each(['wide', '0 0 513', '0 0 0 342'])('refuses the view box %p', (viewBox) => {
    /** Scenario: a view box that is not four numbers with a positive size is reported. */
    const text = written('<path fill="#ffffff" d="M0 0h1v1z"/>', `viewBox="${viewBox}"`)
    expect(messages(lint(text).issues, 'svg-root')).toStrictEqual([
      `the viewBox "${viewBox}" is not four numbers with a positive size`
    ])
  })

  it.each(['0 0 513 513', '0 0 100 100', '0 0 200 100'])(
    'refuses the view box %p, which is not 3:2',
    (viewBox) => {
      /** Scenario: a flag is 3:2 within 0.2%, as every flag of the source is. */
      const text = written('<path fill="#ffffff" d="M0 0h1v1z"/>', `viewBox="${viewBox}"`)
      expect(messages(lint(text).issues, 'svg-root')).toStrictEqual([
        `the viewBox "${viewBox}" is not 3:2`
      ])
    }
  )

  it.each(['0 0 513 342', '0 85.333 512 341.333', '0 0 22.5 15', '0 0 744 496'])(
    'accepts the view box %p',
    (viewBox) => {
      /** Scenario: the view boxes of the source, with an offset origin and decimals, are 3:2. */
      const text = written('<path fill="#ffffff" d="M0 0h1v1z"/>', `viewBox="${viewBox}"`)
      expect(messages(lint(text).issues, 'svg-root')).toStrictEqual([])
    }
  )
})

describe('lintFlag: elements and attributes', () => {
  it('refuses an element outside the profile, and children and other nodes in the root', () => {
    /**
     * Scenario: a line, a group, text and a comment are not part of a flag; a drawing element
     * may not have children.
     */
    const text = written(
      '<line x1="0" y1="0" x2="1" y2="1"/>\n<g/>\n<path fill="#ffffff" d="M0 0h1v1z"><title>x</title></path>\nloose text\n<!-- c -->'
    )
    expect(messages(lint(text).issues, 'svg-element')).toStrictEqual([
      '<line> is not an allowed element',
      '<g> is not an allowed element',
      '<path> may not have children',
      'text content is not allowed in a flag',
      'comment content is not allowed in a flag'
    ])
  })

  it('reports a flag that paints nothing', () => {
    /** Scenario: an empty drawing is no flag. */
    expect(messages(lint(written('')).issues, 'svg-element')).toStrictEqual([
      'the flag paints nothing'
    ])
  })

  it.each([
    'transform="scale(2)"',
    'id="a"',
    'style="fill:red"',
    'class="c"',
    'fill-opacity=".5"',
    'clip-rule="evenodd"',
    'x1="1"'
  ])('refuses %s on a path', (attribute) => {
    /**
     * Scenario: only the geometry of the element and the paint of the profile may be there;
     * the geometry of another shape is not.
     */
    const text = written(`<path fill="#ffffff" ${attribute} d="M0 0h1v1z"/>`)
    expect(messages(lint(text).issues, 'svg-attribute')).toStrictEqual([
      `<path> may not carry ${attribute.split('=')[0]}`
    ])
  })
})

describe('lintFlag: paint', () => {
  it.each(['red', 'currentColor', '#fff', '#FFFFFF', 'url(#g)', 'rgb(0,0,0)'])(
    'refuses the fill %p',
    (fill) => {
      /** Scenario: a colour is lower-case `#rrggbb` or `none`; nothing else. */
      const text = written(`<path fill="${fill}" d="M0 0h1v1z"/>`)
      expect(messages(lint(text).issues, 'svg-fill')).toStrictEqual([
        `<path> fill="${fill}" must be #rrggbb or none`
      ])
    }
  )

  it('applies the colour rule to a stroke', () => {
    /** Scenario: `stroke` is a colour attribute as well. */
    const text = written('<path fill="none" stroke="blue" d="M0 0h1v1z"/>')
    expect(messages(lint(text).issues, 'svg-fill')).toStrictEqual([
      '<path> stroke="blue" must be #rrggbb or none'
    ])
  })

  it.each(['2', '-0.1', 'half', ''])('refuses the opacity %p', (opacity) => {
    /** Scenario: an opacity is a number from 0 to 1. */
    const text = written(`<path fill="#ffffff" opacity="${opacity}" d="M0 0h1v1z"/>`)
    expect(messages(lint(text).issues, 'svg-fill')).toStrictEqual([
      `<path> opacity="${opacity}" must be a number from 0 to 1`
    ])
  })

  it.each([
    ['fill-rule', 'odd', 'nonzero, evenodd'],
    ['stroke-linejoin', 'point', 'miter, round, bevel']
  ])('refuses the %s %p', (name, value, allowed) => {
    /** Scenario: a keyword attribute takes the values SVG defines. */
    const text = written(`<path fill="#ffffff" ${name}="${value}" d="M0 0h1v1z"/>`)
    expect(messages(lint(text).issues, 'svg-fill')).toStrictEqual([
      `<path> ${name}="${value}" must be one of ${allowed}`
    ])
  })
})

describe('lintFlag: numbers', () => {
  it.each([
    ['cx', '0x10', 'circle'],
    ['r', '10px', 'circle'],
    ['rx', '', 'ellipse'],
    ['width', '1 2', 'rect'],
    ['height', 'wide', 'rect'],
    ['stroke-width', '1e', 'path'],
    ['stroke-miterlimit', '0b1', 'path']
  ])('refuses %s="%s" on a %s', (name, value, tag) => {
    /**
     * Scenario: a numeric attribute holds one SVG number; `Number()` would read `0x10` as 16
     * and a blank as 0, so the raw SVG and the generated component would disagree.
     */
    const text = written(`<${tag} fill="#ffffff" ${name}="${value}"/>`)
    expect(messages(lint(text).issues, 'svg-fill')).toStrictEqual([
      `<${tag}> ${name}="${value}" must be a number`
    ])
  })

  it('accepts a number in every notation of SVG', () => {
    /** Scenario: signs, a leading or trailing point and an exponent are numbers. */
    const text = flagDrawing(
      '<rect fill="#ffffff" x="-.5" y="+1." width="2e1" height="1.5E+1" rx="0"/>'
    )
    expect(messages(lint(text).issues, 'svg-fill')).toStrictEqual([])
  })
})

describe('lintFlag: precision', () => {
  it('reports more than three decimals and an exponent, in the view box and the elements', () => {
    /**
     * Scenario: numbers carry at most three decimals and no exponent, whether they are in the
     * view box or in the geometry of an element; colours and keywords are not numbers.
     */
    const text = written(
      '<path fill="#ffffff" d="M0.1234 0h1e3v1z"/>\n<circle fill="#000000" stroke-width="1.2345" cx="1" cy="1" r="1"/>',
      'viewBox="0 0 513.0001 342"'
    )
    expect(messages(lint(text).issues, 'svg-precision')).toStrictEqual([
      '<svg> viewBox holds 513.0001: at most 3 decimals, no exponent',
      '<path> d holds 0.1234: at most 3 decimals, no exponent',
      '<path> d holds 1e3: at most 3 decimals, no exponent',
      '<circle> stroke-width holds 1.2345: at most 3 decimals, no exponent'
    ])
  })
})

/** A clean path, the body of a flag whose only variable part is the root or one attribute. */
const PATH = '<path fill="#ffffff" d="M0 0h1v1z"/>'

describe('lintFlag: the edges of each rule', () => {
  it('reports a parse failure with the parser message, not the missing-root message', () => {
    /**
     * Scenario: a truncated file is reported with what the parser said; the catch must
     * return the issue itself and not fall through to the "single root" message.
     */
    const report = lint('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"></svg>')
    expect(report.issues[0]?.message).toContain('Error')
    expect(report.issues[0]?.message).not.toBe('the file must hold a single <svg> root')
  })

  it.each(['0 0 15019 10000', '0 0 14981 10000', '0 0 3 2'])(
    'accepts the view box %p, within the 0.2% tolerance',
    (viewBox) => {
      /** Scenario: a ratio just inside the tolerance on either side of 3:2 is accepted. */
      expect(
        messages(lint(written(PATH, `viewBox="${viewBox}"`)).issues, 'svg-root')
      ).toStrictEqual([])
    }
  )

  it.each(['0 0 15021 10000', '0 0 14979 10000'])(
    'refuses the view box %p, just past the tolerance',
    (viewBox) => {
      /** Scenario: a ratio just past the tolerance on either side of 3:2 is refused. */
      expect(
        messages(lint(written(PATH, `viewBox="${viewBox}"`)).issues, 'svg-root')
      ).toStrictEqual([`the viewBox "${viewBox}" is not 3:2`])
    }
  )

  it.each(['0', '1', '0.5', '0.00', '1.0'])('accepts the opacity %p', (opacity) => {
    /** Scenario: 0 and 1 are the bounds of an opacity and are both allowed. */
    const text = written(`<path fill="#ffffff" opacity="${opacity}" d="M0 0h1v1z"/>`)
    expect(messages(lint(text).issues, 'svg-fill')).toStrictEqual([])
  })

  it.each(['-0.01', '1.01'])('refuses the opacity %p, just outside 0 to 1', (opacity) => {
    /** Scenario: a hair below 0 or above 1 is not an opacity. */
    const text = written(`<path fill="#ffffff" opacity="${opacity}" d="M0 0h1v1z"/>`)
    expect(messages(lint(text).issues, 'svg-fill')).toStrictEqual([
      `<path> opacity="${opacity}" must be a number from 0 to 1`
    ])
  })

  it('accepts a file of exactly the size limit and refuses one byte more', () => {
    /** Scenario: at most 8 KiB is allowed, so the limit itself passes and the next byte fails. */
    const fit = written(PATH)
    const exact = written(PATH + ' '.repeat(FLAG_MAX_BYTES - Buffer.byteLength(fit)))
    expect(Buffer.byteLength(exact)).toBe(FLAG_MAX_BYTES)
    expect(messages(lint(exact).issues, 'svg-size')).toStrictEqual([])
    const over = exact.replace('</svg>', ' </svg>')
    expect(Buffer.byteLength(over)).toBe(FLAG_MAX_BYTES + 1)
    expect(messages(lint(over).issues, 'svg-size')).toStrictEqual([
      `the file holds ${FLAG_MAX_BYTES + 1} bytes: at most ${FLAG_MAX_BYTES}`
    ])
  })

  it('accepts three decimals and refuses four', () => {
    /** Scenario: at most three decimals, so 1.234 passes and 1.2345 fails, whatever the attribute. */
    const three = written('<circle fill="#ffffff" cx="1.234" cy="1" r="1"/>')
    expect(messages(lint(three).issues, 'svg-precision')).toStrictEqual([])
    const four = written('<circle fill="#ffffff" cx="1.2345" cy="1" r="1"/>')
    expect(messages(lint(four).issues, 'svg-precision')).toStrictEqual([
      '<circle> cx holds 1.2345: at most 3 decimals, no exponent'
    ])
  })

  it('reads an exponent whole, with its digits and its sign', () => {
    /**
     * Scenario: the message names the whole number, so a multi-digit mantissa and exponent
     * and a signed exponent are matched in full.
     */
    const text = written('<path fill="#ffffff" d="M12e3 0h1e+5v1e-5z"/>')
    expect(messages(lint(text).issues, 'svg-precision')).toStrictEqual([
      '<path> d holds 12e3: at most 3 decimals, no exponent',
      '<path> d holds 1e+5: at most 3 decimals, no exponent',
      '<path> d holds 1e-5: at most 3 decimals, no exponent'
    ])
    const wide = written('<path fill="#ffffff" d="M1e55 0z"/>')
    expect(messages(lint(wide).issues, 'svg-precision')).toStrictEqual([
      '<path> d holds 1e55: at most 3 decimals, no exponent'
    ])
  })

  it('does not read the colours or the keywords as numbers', () => {
    /**
     * Scenario: `#1e3456` and `#2e5555` look like exponents, and are colours; only geometry
     * and stroke metrics are read for precision.
     */
    const text = written(
      '<path fill="#1e3456" stroke="#2e5555" fill-rule="evenodd" d="M0 0h1v1z"/>'
    )
    expect(messages(lint(text).issues, 'svg-precision')).toStrictEqual([])
  })

  it('reads only the view box among the root attributes for precision', () => {
    /**
     * Scenario: another root attribute is refused as such, and its number is not also
     * reported for precision.
     */
    const text = written(PATH, 'viewBox="0 0 513 342" width="1.23456"')
    expect(messages(lint(text).issues, 'svg-precision')).toStrictEqual([])
    expect(messages(lint(text).issues, 'svg-root')).toStrictEqual([
      'root attribute width is not allowed'
    ])
  })
})

describe('lintFlag: each numeric attribute and the regular expressions', () => {
  it.each([
    ['cy', 'circle', '<circle fill="#ffffff" cx="1" cy="x" r="1"/>'],
    ['ry', 'ellipse', '<ellipse fill="#ffffff" cx="1" cy="1" rx="1" ry="x"/>'],
    ['x', 'rect', '<rect fill="#ffffff" x="x" y="1" width="1" height="1"/>'],
    ['y', 'rect', '<rect fill="#ffffff" x="1" y="x" width="1" height="1"/>'],
    ['ry', 'rect', '<rect fill="#ffffff" x="1" y="1" width="1" height="1" ry="x"/>']
  ])('refuses %s="x" on a %s, the only bad number', (name, tag, body) => {
    /** Scenario: each attribute is checked as a number on its own, the others being valid. */
    expect(messages(lint(written(body)).issues, 'svg-fill')).toStrictEqual([
      `<${tag}> ${name}="x" must be a number`
    ])
  })

  it('allows ry on a rect', () => {
    /** Scenario: a rect may carry a vertical corner radius beside the horizontal one. */
    const text = written('<rect fill="#ffffff" x="1" y="1" width="2" height="2" rx="1" ry="1"/>')
    expect(messages(lint(text).issues, 'svg-attribute')).toStrictEqual([])
  })

  it.each(['#abc', '#abcd', '#ggg', '#abcdef0', 'x#abcdef', '#ABCDEF', '#abcdeg'])(
    'refuses the colour %p',
    (fill) => {
      /** Scenario: a colour is exactly six lower-case hexadecimal digits after `#`, no more or less. */
      const text = written(`<path fill="${fill}" d="M0 0h1v1z"/>`)
      expect(messages(lint(text).issues, 'svg-fill')).toStrictEqual([
        `<path> fill="${fill}" must be #rrggbb or none`
      ])
    }
  )

  it('accepts a colour of six lower-case digits', () => {
    /** Scenario: `#abcdef` and `#012345` are colours. */
    const text = written('<path fill="#abcdef" stroke="#012345" d="M0 0h1v1z"/>')
    expect(messages(lint(text).issues, 'svg-fill')).toStrictEqual([])
  })

  it.each(['1.', '.5', '-0', '1e5', '1e+5', '1e-5', '1e55', '.55', '12.25', '+1.5E10'])(
    'accepts the number %p',
    (value) => {
      /** Scenario: every notation of an SVG number, with several digits where the regexp has `+`. */
      const text = written(`<rect fill="#ffffff" width="${value}"/>`)
      expect(messages(lint(text).issues, 'svg-fill')).toStrictEqual([])
    }
  )

  it.each(['1e', 'a.5', 'x1', '1ex5', '1e+', '1.5.5', '.', '--1', '1e5e5'])(
    'refuses the number %p',
    (value) => {
      /** Scenario: a letter before the point, an exponent with no digits or a stray letter is no number. */
      const text = written(`<rect fill="#ffffff" width="${value}"/>`)
      expect(messages(lint(text).issues, 'svg-fill')).toStrictEqual([
        `<rect> width="${value}" must be a number`
      ])
    }
  )
})
