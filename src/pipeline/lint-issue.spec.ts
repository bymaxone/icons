/**
 * Unit tests for the lint issue format.
 *
 * Layer: unit.
 * Goal: pin the one-line form every issue is printed in.
 * Mocks: none.
 */

import { formatIssue } from './lint-issue.ts'

describe('formatIssue', () => {
  it('prints the path, the rule in brackets and the message', () => {
    /**
     * Scenario: an editor or CI log links the path at the start of the line, and the
     * rule id names what to look up.
     */
    expect(formatIssue({ file: 'icons/line/a.svg', rule: 'svg-fill', message: 'is filled' })).toBe(
      'icons/line/a.svg: [svg-fill] is filled'
    )
  })
})
