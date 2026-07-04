import { describe, expect, it } from 'vitest'
import { createAsyncGuard } from '@/lib/async/createAsyncGuard'

describe('createAsyncGuard', () => {
  it('tracks the latest sequence with next and isCurrent', () => {
    const guard = createAsyncGuard()

    const first = guard.next()
    expect(guard.isCurrent(first)).toBe(true)

    const second = guard.next()
    expect(guard.isCurrent(first)).toBe(false)
    expect(guard.isCurrent(second)).toBe(true)
  })

  it('invalidates in-flight operations', () => {
    const guard = createAsyncGuard()

    const seq = guard.next()
    guard.invalidate()

    expect(guard.isCurrent(seq)).toBe(false)
    expect(guard.isCurrent(guard.next())).toBe(true)
  })
})
