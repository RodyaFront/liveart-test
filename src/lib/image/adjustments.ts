import { DEFAULT_ADJUSTMENTS, type Adjustments } from '@/types/editor'

const MIN = -100
const MAX = 100

export function clampAdjustment(value: number): number {
  return Math.min(MAX, Math.max(MIN, Math.round(value)))
}

export function isDefaultAdjustments(adjustments: Adjustments): boolean {
  return adjustments.brightness === 0
    && adjustments.contrast === 0
    && adjustments.saturation === 0
}

function sliderToFactor(value: number): number {
  return (100 + clampAdjustment(value)) / 100
}

export function adjustmentsToCssFilter(adjustments: Adjustments): string | null {
  if (isDefaultAdjustments(adjustments)) {
    return null
  }

  const brightness = sliderToFactor(adjustments.brightness)
  const contrast = sliderToFactor(adjustments.contrast)
  const saturation = sliderToFactor(adjustments.saturation)

  return `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`
}

export function mergeAdjustments(
  current: Adjustments,
  partial: Partial<Adjustments>,
): Adjustments {
  return {
    brightness: partial.brightness !== undefined
      ? clampAdjustment(partial.brightness)
      : current.brightness,
    contrast: partial.contrast !== undefined
      ? clampAdjustment(partial.contrast)
      : current.contrast,
    saturation: partial.saturation !== undefined
      ? clampAdjustment(partial.saturation)
      : current.saturation,
  }
}

export { DEFAULT_ADJUSTMENTS }
