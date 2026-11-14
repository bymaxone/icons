/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */
/**
 * Render smoke test of every country flag.
 *
 * Layer: integration, in jsdom and through `react-dom/server`.
 * Goal: spec section 12, "every icon renders", for the flags: each flag component renders an
 * `<svg>` 16 px high with the width its own view box gives, silent by default, with its class
 * names, in the DOM and on the server; `./flags` re-exports the module of each flag as the
 * same object; and each flag is exported under the name its metadata gives. The list comes
 * from the generated metadata, so a flag missing from `./flags` fails here.
 * Mocks: none.
 */

import { render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'

import * as flags from '@bymax-one/icons/flags'
import { FLAG_NAMES } from '@bymax-one/icons/meta'
import type { FlagComponent } from '@bymax-one/icons/runtime'

import { componentName } from '../pipeline/naming.ts'

/** Loads one flag entry the way a consumer imports `@bymax-one/icons/flags/<name>`. */
const flagModule = (name: string): Record<string, unknown> =>
  require(`@bymax-one/icons/flags/${name}`) as Record<string, unknown>

/** The view box a flag's source file holds, and the width a 16 px high flag has in it. */
function sizeOf(name: string): { viewBox: string; width: number } {
  const text = readFileSync(join(__dirname, '..', '..', 'icons', 'flags', `${name}.svg`), 'utf8')
  const viewBox = /viewBox="([^"]+)"/.exec(text)?.[1] as string
  const [, , width, height] = viewBox.split(' ').map(Number) as [number, number, number, number]
  return { viewBox, width: Math.round(((16 * width) / height) * 1000) / 1000 }
}

const names: readonly string[] = FLAG_NAMES

describe('every country flag', () => {
  it('is exported by ./flags and by its own entry, as the same object', () => {
    /**
     * Scenario: `./flags` re-exports each flag from its own subpath, so each component exists
     * once; the barrel holds exactly one component per flag, named from the flag.
     */
    expect(Object.keys(flags).sort()).toStrictEqual(
      names.map((name) => componentName(name, 'flag')).sort()
    )
    for (const name of names) {
      const exported = componentName(name, 'flag')
      expect(typeof flagModule(name)[exported]).toBe('function')
      expect((flags as Record<string, unknown>)[exported]).toBe(flagModule(name)[exported])
    }
  })

  it('renders on the server, 16 px high, silent by default and carrying its class names', () => {
    /**
     * Scenario: a decorative flag is `aria-hidden` and not focusable; its class lets CSS target
     * it; it is 16 px high with the width of its own view box, which it keeps.
     */
    for (const name of names) {
      const Component = flagModule(name)[componentName(name, 'flag')] as FlagComponent
      const { viewBox, width } = sizeOf(name)
      const html = renderToStaticMarkup(<Component />)
      expect(
        html.startsWith(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="16" viewBox="${viewBox}" focusable="false" aria-hidden="true" class="bx-icon bx-icon-${name}"`
        )
      ).toBe(true)
    }
  })

  it('renders in the DOM as an SVG element, named when titled', () => {
    /**
     * Scenario: in a browser the flag is a real SVG element; with a title it is announced as an
     * image with that name.
     */
    for (const name of names) {
      const Component = flagModule(name)[componentName(name, 'flag')] as FlagComponent
      const { container, getByRole, unmount } = render(<Component title={name} />)
      expect(container.firstElementChild?.namespaceURI).toBe('http://www.w3.org/2000/svg')
      expect(getByRole('img', { name }).tagName.toLowerCase()).toBe('svg')
      unmount()
    }
  })
})
