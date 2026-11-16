/**
 * Parity tests between the native helpers and the web runtime's.
 *
 * Layer: unit. The native runtime keeps copies of the naming, stroke, view box and flag
 * width helpers so `./runtime` exposes no extra surface; this spec runs one case table
 * through each pair and fails when the copies drift.
 * Mocks: none. The web modules are imported from their source paths on purpose.
 */

import {
  ICON_NAME as WEB_ICON_NAME,
  toComponentName as webToComponentName
} from '../../runtime/create-icon'
import { Flag } from '../../runtime/flag'
import { resolveStrokeWidth as webResolveStrokeWidth } from '../../runtime/stroke'
import { parseViewBox as webParseViewBox } from '../../runtime/view-box'
import {
  FLAG_DEFAULT_SIZE,
  ICON_NAME,
  flagWidth,
  parseViewBox,
  resolveStrokeWidth,
  toComponentName
} from './native-helpers'

const NAMES = [
  'lightning',
  'lightning-filled',
  'lightning-sm',
  'google-brand',
  'arrow-up-right',
  'file-2',
  'x',
  '',
  'Play',
  'play_icon',
  '1play',
  'play--x',
  '-play',
  'play-',
  'play x',
  'a1-2b-3',
  'a-1'
]

describe('helpers parity: names', () => {
  it.each(NAMES)('matches the web kebab-case rule for %p', (name) => {
    /** Scenario: the native pattern accepts and rejects exactly what the web one does. */
    expect(ICON_NAME.test(name)).toBe(WEB_ICON_NAME.test(name))
    expect(ICON_NAME.source).toBe(WEB_ICON_NAME.source)
  })

  it.each(NAMES.filter((name) => WEB_ICON_NAME.test(name)))(
    'derives the web component name for %p',
    (name) => {
      /** Scenario: digits and hyphens map to the same component name as on the web. */
      expect(toComponentName(name)).toBe(webToComponentName(name))
    }
  )
})

describe('helpers parity: stroke width', () => {
  // 0.1 is not exact after `* 24 / 24`, so a master of 24 must return it untouched.
  const widths = [0, 0.1, 0.5, 1, 1.5, 2, 3, Number.POSITIVE_INFINITY, Number.NaN]
  const sizes = [0, -4, 12, 16, 20, 24, 32, 48, 96, Number.NaN]
  const cases = widths.flatMap((width) =>
    sizes.flatMap((size) =>
      [false, true].flatMap((absolute) =>
        [24, 16, 32].map((master) => [width, size, absolute, master] as const)
      )
    )
  )

  it('returns what the web returns for every width, size, mode and master', () => {
    /**
     * Scenario: with and without absoluteStrokeWidth, at several sizes and for a 16 and a
     * 32 master as well as the 24 default, the native width equals the web width.
     */
    for (const [width, size, absolute, master] of cases) {
      expect([
        width,
        size,
        absolute,
        master,
        resolveStrokeWidth(width, size, absolute, master)
      ]).toEqual([
        width,
        size,
        absolute,
        master,
        webResolveStrokeWidth(width, size, absolute, master)
      ])
    }
  })

  it('returns what the web returns with the default master size', () => {
    /** Scenario: the master size defaults to 24 in both. */
    for (const [width, size, absolute] of cases) {
      expect(resolveStrokeWidth(width, size, absolute)).toEqual(
        webResolveStrokeWidth(width, size, absolute)
      )
    }
  })
})

describe('helpers parity: view box', () => {
  const boxes = [
    '0 0 513 342',
    ' 0 0 513 342 ',
    '0,0,513,342',
    '0 , 0 , 513 , 342',
    '-1.5 +2 .5 3.',
    '0 0 1e2 5E1',
    '0 0 0 342',
    '0 0 513 -1',
    '0 0 513 0',
    '0 0 513',
    '0 0 513 342 1',
    '0,,0 1 1',
    '0 0 1e999 1',
    '',
    'nope',
    '0x1 0 1 1'
  ]

  it.each(boxes)('parses %p like the web', (box) => {
    /** Scenario: the same text is accepted or refused, with the same width and height. */
    const web = webParseViewBox(box)
    expect(parseViewBox(box)).toEqual(web && { width: web.width, height: web.height })
  })
})

describe('helpers parity: flag width', () => {
  const boxes = ['0 0 513 342', '0 0 1 3', '0 0 640 480', '0 0 7 5']
  const sizes = [1, 10, 16, 24, 33, 100]

  it('computes the width the web flag writes', () => {
    /** Scenario: for each box and height, the native width equals the web root width. */
    for (const viewBox of boxes) {
      const box = parseViewBox(viewBox)
      for (const size of sizes) {
        const web = Flag({ flagNode: [], viewBox, size }).props as { width: number }
        expect(flagWidth(size, box?.width ?? 0, box?.height ?? 1)).toBe(web.width)
      }
    }
  })

  it('defaults the flag height as the web does', () => {
    /** Scenario: a flag with no size is 16 high in both. */
    const web = Flag({ flagNode: [], viewBox: '0 0 3 2' }).props as { height: number }
    expect(FLAG_DEFAULT_SIZE).toBe(web.height)
  })
})
