/**
 * Render smoke test of every generated React Native component.
 *
 * Layer: integration; the components are pure functions, so each returns its element tree
 * directly, with no renderer.
 * Goal: every icon and brand module exports, aliases included, a component that returns the
 * root `Svg` with the default accessibility props, names itself when titled, takes `color`
 * on the root (icons) or ignores it (flags), and never throws; every flag does the same with
 * its own view box; the `./native`, `./native/brands` and `./native/flags` entries re-export
 * the modules' own objects. The list comes from the generated metadata and the naming rules,
 * so a component missing from a module fails here.
 * Mocks: react-native-svg, which cannot load in Jest, replaced by named function components.
 */

import type { ReactElement } from 'react'
import Svg from 'react-native-svg'

import * as nativeBrands from '@bymax-one/icons/native/brands'
import * as nativeFlags from '@bymax-one/icons/native/flags'
import * as native from '@bymax-one/icons/native'
import {
  BRAND_METADATA,
  BRAND_NAMES,
  FLAG_NAMES,
  ICON_GRID,
  ICON_METADATA,
  ICON_NAMES
} from '@bymax-one/icons/meta'
import type { BrandMetadata, IconMetadata } from '@bymax-one/icons/meta'

import { componentName } from '../pipeline/naming.ts'
import type { Variant } from '../pipeline/naming.ts'

jest.mock('react-native-svg', () => {
  const named = (name: string): (() => null) => {
    const component = (): null => null
    Object.defineProperty(component, 'name', { value: name })
    return component
  }
  return {
    __esModule: true,
    default: named('Svg'),
    Path: named('Path'),
    Line: named('Line'),
    Polyline: named('Polyline'),
    Polygon: named('Polygon'),
    Circle: named('Circle'),
    Ellipse: named('Ellipse'),
    Rect: named('Rect')
  }
})

/** A native component as a module exports it. */
type Component = (props: Record<string, unknown>) => ReactElement

/** One component to render: where it is exported, its name and its default size. */
interface Expected {
  readonly module: Record<string, unknown>
  readonly name: string
  /** The default width and height: the master size, 16 for a 16 px master. */
  readonly size: number
}

/** Loads one icon entry the way a consumer imports `@bymax-one/icons/native/icons/<name>`. */
const iconModule = (name: string): Record<string, unknown> =>
  require(`@bymax-one/icons/native/icons/${name}`) as Record<string, unknown>

/** Loads one flag entry the way a consumer imports `@bymax-one/icons/native/flags/<name>`. */
const flagModule = (name: string): Record<string, unknown> =>
  require(`@bymax-one/icons/native/flags/${name}`) as Record<string, unknown>

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
      size: variant === 'sm' ? ICON_GRID.smSize : ICON_GRID.size
    }))
  )
}

/** The props of an element, read loosely. */
const propsOf = (element: ReactElement): Record<string, unknown> =>
  element.props as Record<string, unknown>

// Read through string keys: before the first drawing the name unions are `never`.
const iconNames: readonly string[] = ICON_NAMES
const brandNames: readonly string[] = BRAND_NAMES
const flagNames: readonly string[] = FLAG_NAMES
const icons: Readonly<Record<string, IconMetadata>> = ICON_METADATA
const brandRecords: Readonly<Record<string, BrandMetadata>> = BRAND_METADATA

const EXPECTED: Expected[] = [
  ...iconNames.flatMap((name) =>
    expectedOf(iconModule(name), name, icons[name]?.aliases ?? [], icons[name]?.variants ?? [])
  ),
  ...brandNames.flatMap((name) =>
    expectedOf(nativeBrands, name, brandRecords[name]?.aliases ?? [], ['brand'])
  )
]

describe('every generated native icon and brand', () => {
  it('is exported exactly as the metadata declares', () => {
    /**
     * Scenario: each icon module and the brand module export one component per name and
     * variant, and nothing else.
     */
    const count = iconNames.reduce((sum, name) => sum + Object.keys(iconModule(name)).length, 0)
    expect(count + Object.keys(nativeBrands).length).toBe(EXPECTED.length)
    for (const { module, name } of EXPECTED) expect(typeof module[name]).toBe('function')
  })

  it('is re-exported by ./native as the same object', () => {
    /**
     * Scenario: `./native` re-exports each icon from its own subpath, so each component
     * exists once; a copy would break identity and double the bundle.
     */
    const entry: Record<string, unknown> = native
    for (const { module, name } of EXPECTED.filter(
      (expected) => expected.module !== nativeBrands
    )) {
      expect(entry[name]).toBe(module[name])
    }
  })

  it('renders the root Svg, hidden from accessibility and at its master size by default', () => {
    /**
     * Scenario: a decorative icon is hidden from assistive technology on both platforms, has
     * no color on the root, and renders at its master size, 16 for a 16 px master and 24 for
     * every other icon.
     */
    for (const { module, name, size } of EXPECTED) {
      const element = (module[name] as Component)({})
      const props = propsOf(element)
      expect(element.type).toBe(Svg)
      expect(props).toMatchObject({
        width: size,
        height: size,
        viewBox: ICON_GRID.viewBox,
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants'
      })
      expect(props).not.toHaveProperty('color')
      expect(props).not.toHaveProperty('accessibilityLabel')
    }
  })

  it('is exposed as a named image when titled', () => {
    /**
     * Scenario: a title gives the accessibility label and role and exposes the icon, instead
     * of hiding it.
     */
    for (const { module, name } of EXPECTED) {
      const props = propsOf((module[name] as Component)({ title: 'x' }))
      expect(props).toMatchObject({
        accessible: true,
        accessibilityRole: 'image',
        accessibilityLabel: 'x'
      })
      expect(props).not.toHaveProperty('accessibilityElementsHidden')
    }
  })

  it('passes color to the root Svg and draws something', () => {
    /**
     * Scenario: the shapes read `currentColor`, which react-native-svg resolves from the
     * root's color; the component passes `color` to the root and renders at least one shape.
     */
    for (const { module, name } of EXPECTED) {
      const element = (module[name] as Component)({ color: 'red' })
      expect(propsOf(element)['color']).toBe('red')
      expect(propsOf(element)['children']).toBeDefined()
    }
  })
})

describe('every generated native flag', () => {
  const entry: Record<string, unknown> = nativeFlags

  it('is exported by ./native/flags and by its own entry, as the same object', () => {
    /**
     * Scenario: `./native/flags` re-exports each flag from its own subpath, so each component
     * exists once; the barrel holds exactly one component per flag, named from the flag.
     */
    expect(Object.keys(entry).sort()).toStrictEqual(
      flagNames.map((name) => componentName(name, 'flag')).sort()
    )
    for (const name of flagNames) {
      const exported = componentName(name, 'flag')
      expect(typeof flagModule(name)[exported]).toBe('function')
      expect(entry[exported]).toBe(flagModule(name)[exported])
    }
  })

  it('renders the root Svg, 16 high with its own view box, hidden by default', () => {
    /**
     * Scenario: a decorative flag is hidden from assistive technology, is 16 high, keeps
     * its own view box and takes the width that box gives.
     */
    for (const name of flagNames) {
      const element = (flagModule(name)[componentName(name, 'flag')] as Component)({})
      const props = propsOf(element)
      expect(element.type).toBe(Svg)
      expect(props).toMatchObject({
        height: 16,
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants'
      })
      const [, , width, height] = (props['viewBox'] as string).split(' ').map(Number)
      expect(props['width']).toBeCloseTo((16 * (width as number)) / (height as number), 3)
    }
  })

  it('is exposed as a named image when titled, and takes no color', () => {
    /**
     * Scenario: a title exposes the flag with its label; a flag keeps its own colours, so a
     * `color` prop never reaches the root.
     */
    for (const name of flagNames) {
      const Flag = flagModule(name)[componentName(name, 'flag')] as Component
      const props = propsOf(Flag({ title: 'x', color: 'red' }))
      expect(props).toMatchObject({
        accessible: true,
        accessibilityRole: 'image',
        accessibilityLabel: 'x'
      })
      expect(props).not.toHaveProperty('color')
      expect(propsOf(Flag({ color: 'red' }))).not.toHaveProperty('color')
    }
  })
})
