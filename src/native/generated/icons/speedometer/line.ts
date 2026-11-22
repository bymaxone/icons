/**
 * @fileoverview The `speedometer` icon, line variant.
 * Written by `pnpm generate` from icons/line/speedometer.svg: edit the source, never this file.
 * @layer Generated
 */

import { createNativeIcon } from '@bymax-one/icons/native/runtime'

/**
 * The `speedometer` icon, line variant: speedometer, gauge, dial, limit, budget, cap.
 *
 * @since 1.0.0
 */
export const SpeedometerIcon = /* @__PURE__ */ createNativeIcon(
  'speedometer',
  [
    [
      'path',
      {
        d: 'M3.74 18.27c-.51-.32-.97-3-.78-4.52.97-7.5 10.05-10.74 15.39-5.49 2.51 2.48 3.44 6.42 2.23 9.48-.49 1.24-1.4.59-.95-.68.1-.28.21-.77.25-1.1l.08-.59h-.71c-.76 0-1-.14-1-.55 0-.4.24-.54.99-.54h.69v-.37c0-.94-.82-3.07-1.48-3.87l-.28-.33-.47.44c-1.01.93-2.5 2.43-3.17 3.18l-.71.78.13.56c.33 1.42-1.02 2.69-2.39 2.26-2.2-.71-1.63-3.84.68-3.71l.73.04 2.23-2.18 2.22-2.18-.52-.44c-.64-.55-1.95-1.18-2.98-1.44-1.32-.32-1.32-.32-1.32.6 0 .7-.03.79-.28.91-.56.25-.8-.03-.8-.92 0-.91 0-.91-1.32-.58S6.92 8.38 6.75 8.84c-.04.09.16.4.44.71.89.96.1 1.55-.88.65l-.53-.48-.41.63c-.68 1.03-1.3 2.72-1.3 3.53v.4h.78c1.41 0 1.35.99-.06 1.06l-.75.04.08.59c.04.32.15.81.25 1.09.35.99.02 1.63-.63 1.21m8.9-2.6c.33-.33.36-.67.11-1.01-.66-.89-1.92.01-1.28.92.22.32.89.37 1.17.09'
      }
    ]
  ],
  { paint: 'fill' }
)

/** @deprecated `spending-cap` is a deprecated alias of `speedometer`, removed in 2.0.0. Renamed to speedometer, the object the drawing shows. Use {@link SpeedometerIcon}. */
export const SpendingCapIcon = SpeedometerIcon

/** `gauge`: an alias of {@link SpeedometerIcon}. */
export const GaugeIcon = SpeedometerIcon
