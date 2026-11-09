/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */
/**
 * Render smoke test of every generated component.
 *
 * Layer: integration, in jsdom and through `react-dom/server`.
 * Goal: spec section 12, "every icon renders": each component every icon and brand
 * module exports, aliases included, renders an `<svg>` with the default accessibility
 * attributes and its class names, in the DOM and on the server; the root re-exports the
 * module's own objects. The list comes from the generated metadata and the naming rules,
 * so a component missing from a module fails here.
 * Mocks: none.
 */

import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'

import * as root from '@bymax-one/icons'
import * as brands from '@bymax-one/icons/brands'
import { BRAND_METADATA, BRAND_NAMES, ICON_METADATA, ICON_NAMES } from '@bymax-one/icons/meta'
import type { BrandMetadata, IconMetadata } from '@bymax-one/icons/meta'
import type { IconComponent } from '@bymax-one/icons/runtime'

import { componentName, variantName } from '../pipeline/naming.ts'
import type { Variant } from '../pipeline/naming.ts'

/** One component to render: where it is exported, its name, and the class it writes. */
interface Expected {
  readonly module: Record<string, unknown>
  readonly name: string
  readonly className: string
}

/** Loads one icon entry the way a consumer imports `@bymax-one/icons/icons/<name>`. */
const iconModule = (name: string): Record<string, unknown> =>
  require(`@bymax-one/icons/icons/${name}`) as Record<string, unknown>

/** Every component an icon or brand exports: its own name and each alias, per variant. */
function expectedOf(
  module: Record<string, unknown>,
  name: string,
  aliases: readonly { readonly name: string }[],
  variants: readonly Variant[]
): Expected[] {
  return [name, ...aliases.map((alias) => alias.name)].flatMap((exported) =>
    variants.map((variant) => ({
      module,
      name: componentName(exported, variant),
      className: `bx-icon bx-icon-${variantName(name, variant)}`
    }))
  )
}

// Read through string keys: before the first drawing the name unions are `never`.
const iconNames: readonly string[] = ICON_NAMES
const brandNames: readonly string[] = BRAND_NAMES
const icons: Readonly<Record<string, IconMetadata>> = ICON_METADATA
const brandRecords: Readonly<Record<string, BrandMetadata>> = BRAND_METADATA

const EXPECTED: Expected[] = [
  ...iconNames.flatMap((name) =>
    expectedOf(iconModule(name), name, icons[name]?.aliases ?? [], icons[name]?.variants ?? [])
  ),
  ...brandNames.flatMap((name) =>
    expectedOf(brands, name, brandRecords[name]?.aliases ?? [], ['brand'])
  )
]

describe('every generated component', () => {
  it('is exported exactly as the metadata declares', () => {
    /**
     * Scenario: each icon module and the brand module export one component per name and
     * variant, and nothing else.
     */
    const count = iconNames.reduce((sum, name) => sum + Object.keys(iconModule(name)).length, 0)
    expect(count + Object.keys(brands).length).toBe(EXPECTED.length)
    for (const { module, name } of EXPECTED) expect(typeof module[name]).toBe('function')
  })

  it('is re-exported by the root as the same object', () => {
    /**
     * Scenario: the root re-exports each icon from its own subpath, so each component
     * exists once; a copy would break identity and double the bundle.
     */
    const rootExports: Record<string, unknown> = root
    for (const { module, name } of EXPECTED.filter((expected) => expected.module !== brands)) {
      expect(rootExports[name]).toBe(module[name])
    }
  })

  it('renders on the server, silent by default and carrying its class names', () => {
    /**
     * Scenario: a decorative icon is `aria-hidden` and not focusable; its classes let CSS
     * target every icon or one of them.
     */
    for (const { module, name, className } of EXPECTED) {
      const Component = module[name] as IconComponent
      const html = renderToStaticMarkup(<Component />)
      expect(
        html.startsWith(
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"'
        )
      ).toBe(true)
      expect(html).toContain('focusable="false" aria-hidden="true"')
      expect(html).toContain(`class="${className}"`)
    }
  })

  it('renders in the DOM as an SVG element, named when titled', () => {
    /**
     * Scenario: in a browser the icon is a real SVG element; with a title it is announced
     * as an image with that name.
     */
    for (const { module, name } of EXPECTED) {
      const Component = module[name] as IconComponent
      const { container, getByRole, unmount } = render(<Component title={name} />)
      expect(container.firstElementChild?.namespaceURI).toBe('http://www.w3.org/2000/svg')
      expect(getByRole('img', { name }).tagName.toLowerCase()).toBe('svg')
      unmount()
    }
  })
})
