// vitest-axe (0.1.0) ships an ambient augmentation targeting the old
// `Vi.Assertion` namespace, which Vitest 4's @vitest/expect no longer
// extends — `Assertion<T>` now composes via the (deliberately empty)
// `Matchers<T>` interface instead. Augmenting that directly here is what
// makes `expect(...).toHaveNoViolations()` type-check under Vitest 4.
import type { AxeResults } from 'axe-core'

declare module '@vitest/expect' {
  interface Matchers<T = unknown> {
    toHaveNoViolations(): T extends AxeResults ? void : never
  }
}
