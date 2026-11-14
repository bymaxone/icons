/**
 * @jest-environment-options {"customExportConditions": ["react-server", "node", "node-addons"]}
 */

/**
 * Server Components tests for the runtime.
 *
 * Layer: unit, in the Node environment resolving packages with the `react-server`
 * export condition, as a Server Components bundler does.
 * Goal: render icons through the React Server Components (Flight) renderer of
 * `react-server-dom-webpack`, under the server build of React that has no
 * `useState`, `useEffect` or `createContext`, and check the serialised tree. A
 * negative control proves the harness fails a component that calls a hook, and a
 * source scan proves the runtime carries no client directive and imports only
 * `createElement` from React.
 *
 * What this does not prove: it does not run a framework (Next.js) or a bundler,
 * and it does not decode the payload on a client. It proves the components run
 * and serialise under the server React build, which is where a hook, a context or
 * a client-only API would fail.
 * Mocks: none.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Writable } from 'node:stream'

import * as React from 'react'
import type { ReactNode } from 'react'

import { createIcon } from './create-icon'
import { Icon } from './icon'
import type { IconNode } from './icon-node'

/** The part of the Flight server API this spec uses. */
interface FlightServer {
  renderToPipeableStream(
    model: ReactNode,
    webpackMap: Record<string, never>,
    options: { onError: (error: unknown) => void }
  ): { pipe(destination: Writable): Writable }
}

const FIXTURE: IconNode = [['path', { d: 'M4.75 12h14.5' }]]

/** Renders a model through Flight and resolves with the payload, or rejects on a render error. */
function renderFlight(model: ReactNode): Promise<string> {
  // `./server` resolves only under the `react-server` condition; anywhere else it
  // throws, so loading it is itself the check that the condition is in effect.
  const flight = jest.requireActual<FlightServer>('react-server-dom-webpack/server')
  return new Promise((resolve, reject) => {
    let payload = ''
    const sink = new Writable({
      write(chunk: Buffer, _encoding, callback): void {
        payload += chunk.toString()
        callback()
      },
      final(callback): void {
        resolve(payload)
        callback()
      }
    })
    flight.renderToPipeableStream(model, {}, { onError: reject }).pipe(sink)
  })
}

/** A serialised element, with the development-only owner and stack fields dropped. */
interface FlightElement {
  type: string
  props: Record<string, unknown>
}

/**
 * Decodes one element tuple of a Flight row, `['$', type, key, props, ...debug]`,
 * and its element children, so a test compares the tree rather than the wire form.
 */
function decode(value: unknown): unknown {
  if (!Array.isArray(value)) return value
  if (value[0] !== '$') return value.map(decode)
  const { children, ...props } = value[3] as Record<string, unknown>
  return {
    type: value[1] as string,
    props: children === undefined ? props : { ...props, children: decode(children) }
  }
}

/** The root model row of a Flight payload, decoded. Debug rows (`0:D...`) are skipped. */
function rootOf(payload: string): FlightElement {
  const row = payload.split('\n').find((line) => line.startsWith('0:['))
  if (row === undefined) throw new Error(`no root row in payload:\n${payload}`)
  return decode(JSON.parse(row.slice(2))) as FlightElement
}

/** The name and environment of the component the payload's debug rows record. */
function componentsOf(payload: string): { name: unknown; env: unknown }[] {
  return payload
    .split('\n')
    .map((line) => /^[0-9a-f]+:(\{.*\})$/.exec(line)?.[1])
    .filter((json): json is string => json !== undefined)
    .map((json) => JSON.parse(json) as Record<string, unknown>)
    .filter((info) => 'name' in info)
    .map(({ name, env }) => ({ name, env }))
}

describe('Server Components: environment', () => {
  it('runs against the server build of React', () => {
    /**
     * Scenario: the `react-server` condition selects the React build Server
     * Components run on, which leaves out the client-only APIs; were it not in
     * effect this file would prove nothing.
     */
    const client = React as unknown as Record<string, unknown>
    expect(client['useState']).toBeUndefined()
    expect(client['useEffect']).toBeUndefined()
    expect(client['createContext']).toBeUndefined()
    expect(typeof React.createElement).toBe('function')
  })

  it('fails a component that calls a hook', async () => {
    /**
     * Scenario: negative control. A component that calls `useState` throws
     * under the server build, and the render rejects, so a green render of the
     * runtime means it called no such API.
     */
    function Stateful(): ReactNode {
      React.useState(0)
      return null
    }
    await expect(renderFlight(<Stateful />)).rejects.toThrow(TypeError)
  })
})

describe('Server Components: rendering', () => {
  it('serialises the Icon base with its default root attributes', async () => {
    /**
     * Scenario: the base renders as a Server Component; the payload holds the
     * `<svg>` with the grid, the stroke and the silent default, and the drawing.
     */
    expect(rootOf(await renderFlight(<Icon iconNode={FIXTURE} />))).toEqual({
      type: 'svg',
      props: {
        xmlns: 'http://www.w3.org/2000/svg',
        width: 24,
        height: 24,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        focusable: 'false',
        'aria-hidden': 'true',
        // createElement stores a single child as the element itself, not a list.
        children: { type: 'path', props: { d: 'M4.75 12h14.5' } }
      }
    })
  })

  it('serialises a named component with a title, run as a server component', async () => {
    /**
     * Scenario: a component from createIcon renders on the server: the debug rows
     * record it under its displayName in the Server environment, and the tree
     * holds its class names and the title's role, label and `<title>` child.
     */
    const ShieldIcon = createIcon('shield', FIXTURE)
    const payload = await renderFlight(<ShieldIcon title="Protected" />)
    expect(componentsOf(payload)).toEqual([{ name: 'ShieldIcon', env: 'Server' }])
    const root = rootOf(payload)
    expect(root.type).toBe('svg')
    expect(root.props).toMatchObject({
      className: 'bx-icon bx-icon-shield',
      role: 'img',
      'aria-label': 'Protected',
      children: [
        { type: 'title', props: { children: 'Protected' } },
        { type: 'path', props: { d: 'M4.75 12h14.5' } }
      ]
    })
    expect(root.props).not.toHaveProperty('aria-hidden')
  })
})

describe('Server Components: source', () => {
  const runtimeDir = __dirname
  const sources = readdirSync(runtimeDir)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'))
    .map((file) => [file, readFileSync(join(runtimeDir, file), 'utf8')] as const)

  it('scans every runtime source file', () => {
    /**
     * Scenario: the scan below is only as good as its file list; it must see the
     * base, the factory and the helpers it renders with.
     */
    expect(sources.map(([file]) => file).sort()).toEqual([
      'accessibility.ts',
      'create-flag.ts',
      'create-icon.ts',
      'flag-node.ts',
      'flag-props.ts',
      'flag.ts',
      'icon-node.ts',
      'icon-props.ts',
      'icon.ts',
      'index.ts',
      'stroke.ts',
      'view-box.ts'
    ])
  })

  it.each(sources)('carries no client directive in %s', (_file, source) => {
    /**
     * Scenario: a `'use client'` directive would move every consumer behind a
     * client boundary; no runtime file may hold one.
     */
    expect(source).not.toMatch(/['"]use client['"]/)
  })

  it.each(sources)('imports only createElement from React in %s', (_file, source) => {
    /**
     * Scenario: hooks, context and every other client-only API are imported from
     * `react`; allowing only `createElement` as a value import (types are erased)
     * keeps them out of the runtime.
     */
    const valueImports = [...source.matchAll(/^import\s+(?!type\b)(.*?)\s+from\s+'react'/gms)].map(
      (match) => match[1]
    )
    for (const names of valueImports) expect(names).toBe('{ createElement }')
  })
})
