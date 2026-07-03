import { findCropOperation as findCropOperationInList } from '@/lib/image/operations'
import { clampAdjustment } from '@/lib/image/adjustments'
import type {
  EditDocument,
  EditOperation,
  FilterName,
  ImageSourceMeta,
} from '@/types/editor'

export class EditDocumentParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EditDocumentParseError'
  }
}

export class EditDocumentValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EditDocumentValidationError'
  }
}

export class EditDocumentSourceMismatchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EditDocumentSourceMismatchError'
  }
}

const FILTER_NAMES: FilterName[] = ['grayscale', 'sepia']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function parseCropOperation(value: Record<string, unknown>): EditOperation {
  const { x, y, width, height } = value
  if (
    typeof x !== 'number' || !Number.isFinite(x)
    || typeof y !== 'number' || !Number.isFinite(y)
    || typeof width !== 'number' || !Number.isFinite(width)
    || typeof height !== 'number' || !Number.isFinite(height)
  ) {
    throw new EditDocumentValidationError('Invalid crop operation')
  }

  if (width <= 0 || height <= 0) {
    throw new EditDocumentValidationError('Crop width and height must be positive')
  }

  return {
    type: 'crop',
    x,
    y,
    width,
    height,
  }
}

function parseAdjustOperation(value: Record<string, unknown>): EditOperation {
  const { brightness, contrast, saturation } = value
  if (
    typeof brightness !== 'number' || !Number.isFinite(brightness)
    || typeof contrast !== 'number' || !Number.isFinite(contrast)
    || typeof saturation !== 'number' || !Number.isFinite(saturation)
  ) {
    throw new EditDocumentValidationError('Invalid adjust operation')
  }

  return {
    type: 'adjust',
    brightness: clampAdjustment(brightness),
    contrast: clampAdjustment(contrast),
    saturation: clampAdjustment(saturation),
  }
}

function parseFilterOperation(value: Record<string, unknown>): EditOperation {
  const { name } = value
  if (typeof name !== 'string' || !FILTER_NAMES.includes(name as FilterName)) {
    throw new EditDocumentValidationError('Invalid filter operation')
  }

  return {
    type: 'filter',
    name: name as FilterName,
  }
}

function parseOperation(value: unknown): EditOperation {
  if (!isRecord(value) || typeof value.type !== 'string') {
    throw new EditDocumentValidationError('Invalid operation')
  }

  switch (value.type) {
    case 'crop':
      return parseCropOperation(value)
    case 'adjust':
      return parseAdjustOperation(value)
    case 'filter':
      return parseFilterOperation(value)
    default:
      throw new EditDocumentValidationError(`Unknown operation type: ${value.type}`)
  }
}

export function parseEditDocument(json: string): unknown {
  try {
    return JSON.parse(json)
  }
  catch {
    throw new EditDocumentParseError('Invalid JSON file')
  }
}

export function validateEditDocument(doc: unknown): EditDocument {
  if (!isRecord(doc)) {
    throw new EditDocumentValidationError('Document must be an object')
  }

  if (doc.version !== 1) {
    throw new EditDocumentValidationError('Unsupported document version')
  }

  if (!isRecord(doc.source)) {
    throw new EditDocumentValidationError('Missing source metadata')
  }

  const { name, width, height } = doc.source
  if (typeof name !== 'string' || name.length === 0) {
    throw new EditDocumentValidationError('Invalid source name')
  }

  if (!isPositiveNumber(width) || !isPositiveNumber(height)) {
    throw new EditDocumentValidationError('Invalid source dimensions')
  }

  if (!Array.isArray(doc.operations)) {
    throw new EditDocumentValidationError('Operations must be an array')
  }

  const operations = doc.operations.map((operation) => parseOperation(operation))

  const cropCount = operations.filter((operation) => operation.type === 'crop').length
  const adjustCount = operations.filter((operation) => operation.type === 'adjust').length
  const filterCount = operations.filter((operation) => operation.type === 'filter').length

  if (cropCount > 1 || adjustCount > 1 || filterCount > 1) {
    throw new EditDocumentValidationError('Duplicate operation types are not supported')
  }

  const cropOperation = findCropOperationInList(operations)
  if (cropOperation) {
    if (
      cropOperation.x < 0
      || cropOperation.y < 0
      || cropOperation.x + cropOperation.width > width
      || cropOperation.y + cropOperation.height > height
    ) {
      throw new EditDocumentValidationError('Crop operation is outside source image bounds')
    }
  }

  return {
    version: 1,
    source: { name, width, height },
    operations,
  }
}

export function assertDocumentMatchesSource(meta: ImageSourceMeta, document: EditDocument): void {
  if (
    document.source.width !== meta.width
    || document.source.height !== meta.height
  ) {
    throw new EditDocumentSourceMismatchError(
      'Image dimensions do not match the JSON source metadata',
    )
  }
}

