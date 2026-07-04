export interface AsyncGuard {
  next(): number
  isCurrent(value: number): boolean
  invalidate(): void
}

export function createAsyncGuard(): AsyncGuard {
  let seq = 0

  return {
    next() {
      seq += 1
      return seq
    },
    isCurrent(value: number) {
      return value === seq
    },
    invalidate() {
      seq += 1
    },
  }
}
