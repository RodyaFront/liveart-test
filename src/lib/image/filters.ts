import type { FilterValue } from '@/types/editor'

export function filterToCssFilter(value: FilterValue): string | null {
  if (value === 'grayscale') {
    return 'grayscale(100%)'
  }

  if (value === 'sepia') {
    return 'sepia(100%)'
  }

  return null
}

export function combineCssFilters(...parts: Array<string | null | undefined>): string | null {
  const filters = parts.filter((part): part is string => Boolean(part))

  return filters.length > 0 ? filters.join(' ') : null
}
