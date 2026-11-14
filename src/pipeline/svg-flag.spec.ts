/**
 * Unit tests for the formatter of a country flag source.
 *
 * Layer: unit, on in-memory SVG text.
 * Goal: pin what the flag formatter keeps (the path data, the shapes, the numbers and the view
 * box) and what it changes (groups flattened onto their children, colours as `#rrggbb`, the
 * stray `class` and `clip-rule` dropped, the root reduced to its namespace and view box).
 * Mocks: none.
 */

import { normalizeFlag } from './svg-flag.ts'

const ROOT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 513 342">'

/** A flag source as a flag file holds it: a root, its body and the closing tag. */
const flag = (body: string, attributes = 'viewBox="0 0 513 342"'): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${attributes}>${body}</svg>`

describe('normalizeFlag: what it keeps', () => {
  it('keeps path data exactly as written', () => {
    /**
     * Scenario: the default SVGO preset would shorten `M 0 0 L 10 0 L 10 10 Z`; the flag
     * formatter leaves the drawing as the source wrote it, so the path of a flag is the source's.
     */
    const d = 'M 0 0 L 10 0 L 10 10 Z m 1.500 2.0 l -3 0'
    expect(normalizeFlag(flag(`<path fill="#fff" d="${d}"/>`))).toContain(`d="${d}"`)
  })

  it('keeps an ellipse an ellipse and a rect a rect', () => {
    /**
     * Scenario: the preset converts a round ellipse to a circle and a rectangle to a path;
     * a flag keeps the shapes it was drawn with.
     */
    const out = normalizeFlag(
      flag(
        '<ellipse cx="5" cy="5" rx="3" ry="3" fill="#000"/><rect width="4" height="2" fill="#000"/>'
      )
    )
    expect(out).toContain('<ellipse')
    expect(out).toContain('<rect')
    expect(out).not.toContain('<circle')
  })

  it('keeps the view box of the source and the namespace, and nothing else on the root', () => {
    /**
     * Scenario: the root holds `xmlns` and the file's own `viewBox`; a width, a height or any
     * other root attribute of the source is dropped.
     */
    const out = normalizeFlag(
      flag('<path fill="#fff" d="M0 0h1v1z"/>', 'viewBox="0 85.333 512 341.333" width="24" id="x"')
    )
    expect(
      out.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 85.333 512 341.333">')
    ).toBe(true)
  })

  it('writes a root with the namespace alone when the source has no view box', () => {
    /** Scenario: nothing is invented; the lint reports the missing view box. */
    expect(normalizeFlag('<svg><path fill="#fff" d="M0 0h1v1z"/></svg>')).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg">\n  <path fill="#ffffff" d="M0 0h1v1z"/>\n</svg>\n'
    )
  })

  it('writes one element per line, indented by two spaces, ending in a newline', () => {
    /** Scenario: the file is the form the formatter writes, byte for byte. */
    expect(
      normalizeFlag(flag('<path fill="#fff" d="M0 0h1v1z"/><path fill="#000" d="M1 1h1v1z"/>'))
    ).toBe(
      `${ROOT}\n  <path fill="#ffffff" d="M0 0h1v1z"/>\n  <path fill="#000000" d="M1 1h1v1z"/>\n</svg>\n`
    )
  })

  it('is stable: formatting the output changes nothing', () => {
    /** Scenario: a file the formatter wrote is a fixed point, which `check:generated` relies on. */
    const once = normalizeFlag(
      flag('<g fill="red" stroke="#ABC"><path d="M0 0h1v1z"/><circle cx="1" cy="1" r="1"/></g>')
    )
    expect(normalizeFlag(once)).toBe(once)
  })
})

describe('normalizeFlag: colours', () => {
  it.each([
    ['#FFF', '#ffffff'],
    ['#abc', '#aabbcc'],
    ['#ABCDEF', '#abcdef'],
    ['red', '#ff0000'],
    ['none', 'none'],
    ['currentColor', 'currentColor']
  ])('writes the fill %p as %p', (given, written) => {
    /**
     * Scenario: a three-digit or upper-case hex is written as lower-case `#rrggbb`, a named
     * colour becomes its hex, and `none` and any other value are left for the lint to judge.
     */
    expect(normalizeFlag(flag(`<path fill="${given}" d="M0 0h1v1z"/>`))).toContain(
      `<path fill="${written}"`
    )
  })

  it('writes a stroke colour the same way', () => {
    /** Scenario: `stroke` is a colour attribute like `fill`. */
    expect(normalizeFlag(flag('<path stroke="#0F0" fill="none" d="M0 0h1v1z"/>'))).toContain(
      'stroke="#00ff00"'
    )
  })
})

describe('normalizeFlag: groups', () => {
  it('writes the presentation attributes of a group onto each child', () => {
    /**
     * Scenario: no SVGO plugin moves `fill` and `stroke` down, so the formatter flattens a
     * group: its attributes land on every child, and the group is gone.
     */
    const out = normalizeFlag(
      flag(
        '<g fill="#d80027" stroke="#000" stroke-width="2" stroke-miterlimit="10" stroke-linejoin="round" fill-rule="evenodd"><path d="M0 0h1v1z"/><circle cx="1" cy="1" r="1"/></g>'
      )
    )
    expect(out).not.toContain('<g')
    expect(out).toContain(
      '<path fill="#d80027" fill-rule="evenodd" stroke="#000000" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="2" d="M0 0h1v1z"/>'
    )
    expect(out).toContain('<circle cx="1" cy="1" r="1" fill="#d80027"')
  })

  it('lets an attribute of a child win over the group', () => {
    /** Scenario: as in SVG, the nearest `fill` applies. */
    const out = normalizeFlag(
      flag('<g fill="#111"><path fill="#222" d="M0 0h1v1z"/><path d="M1 1h1v1z"/></g>')
    )
    expect(out).toContain('<path fill="#222222" d="M0 0h1v1z"/>')
    expect(out).toContain('<path fill="#111111" d="M1 1h1v1z"/>')
  })

  it('flattens nested groups, the innermost first', () => {
    /** Scenario: an outer group's attribute reaches a child through the inner group. */
    const out = normalizeFlag(
      flag('<g fill="#111" stroke="#222"><g fill="#333"><path d="M0 0h1v1z"/></g></g>')
    )
    expect(out).not.toContain('<g')
    expect(out).toContain('<path fill="#333333" stroke="#222222" d="M0 0h1v1z"/>')
  })

  it('moves an opacity onto a group with one child', () => {
    /**
     * Scenario: the opacity of a group with one child is the child's, exactly; this is the
     * one group of the source set that carries one.
     */
    expect(normalizeFlag(flag('<g fill="#fff" opacity=".5"><path d="M0 0h1v1z"/></g>'))).toContain(
      '<path fill="#ffffff" d="M0 0h1v1z" opacity=".5"/>'
    )
  })

  it('refuses an opacity on a group of several children', () => {
    /**
     * Scenario: on several children an opacity changes how they blend where they overlap, so
     * the import fails instead of drawing a different flag.
     */
    expect(() =>
      normalizeFlag(flag('<g opacity=".5"><path d="M0 0h1v1z"/><path d="M1 1h1v1z"/></g>'))
    ).toThrow('a <g> with an opacity holds several elements, or one with its own opacity')
  })

  it('refuses an opacity on a group whose child has its own', () => {
    /** Scenario: the two opacities would multiply; the formatter does not guess. */
    expect(() =>
      normalizeFlag(flag('<g opacity=".5"><path opacity=".5" d="M0 0h1v1z"/></g>'))
    ).toThrow('a <g> with an opacity holds several elements, or one with its own opacity')
  })

  it('refuses an empty group that carries an opacity', () => {
    /** Scenario: there is no child to move it onto. */
    expect(() => normalizeFlag(flag('<g opacity=".5"></g>'))).toThrow(
      'a <g> with an opacity holds several elements, or one with its own opacity'
    )
  })

  it.each(['transform="translate(1 1)"', 'id="a"', 'style="fill:red"', 'clip-path="url(#c)"'])(
    'refuses a group that carries %s',
    (attribute) => {
      /**
       * Scenario: an attribute that is neither moved down nor dropped cannot be flattened, so
       * the file is reported rather than changed.
       */
      const name = attribute.split('=')[0]
      expect(() => normalizeFlag(flag(`<g ${attribute}><path d="M0 0h1v1z"/></g>`))).toThrow(
        `a <g> carries ${name}, which cannot be moved onto its children`
      )
    }
  )

  it('refuses a group that holds text', () => {
    /** Scenario: a group of a flag holds elements only. */
    expect(() => normalizeFlag(flag('<g fill="#fff">hello<path d="M0 0h1v1z"/></g>'))).toThrow(
      'a <g> holds text content'
    )
  })

  it('drops the class and the clip rule of a group instead of moving them', () => {
    /** Scenario: the attributes the flag does not keep are not carried down either. */
    const out = normalizeFlag(flag('<g class="st1" clip-rule="evenodd"><path d="M0 0h1v1z"/></g>'))
    expect(out).not.toContain('class')
    expect(out).not.toContain('clip-rule')
  })
})

describe('normalizeFlag: attributes it drops', () => {
  it('drops a class and a clip rule from an element', () => {
    /** Scenario: a class with no style sheet and a rule for a clip mean nothing on a flag. */
    const out = normalizeFlag(
      flag('<path class="st1" clip-rule="evenodd" fill="#fff" d="M0 0h1v1z"/>')
    )
    expect(out).toContain('<path fill="#ffffff" d="M0 0h1v1z"/>')
  })
})
