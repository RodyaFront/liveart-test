# Image Editor — ТЗ и подход к разработке

Документ фиксирует исходное задание, принципы реализации и **актуальный прогресс**. Редактор реализован end-to-end на `/`; wireframe-прототип удалён.

---

## 1. Техническое задание

### Контекст

В полиграфии подготовка и корректировка изображений — ежедневная работа. Задача — небольшой браузерный редактор в этом духе. **Главный интерес — как смоделированы правки, а не только пиксели.**

Ориентир по времени: ~1 день. Сначала — обязательные требования; бонус — по возможности.

### Стек и setup

| Технология | Статус |
|---|---|
| Vue 3 | ✅ |
| Vuetify 3 | ✅ |
| Pinia | ✅ |
| TypeScript | ✅ |
| CropperJS | ✅ (`useCropper`, `EditorPreview`) |
| Запуск | `npm i && npm run dev` |
| Тесты | `npm test` (Vitest + happy-dom) |

### Требования

- [x] Загрузка изображения через file upload
- [x] Обрезка (crop) загруженного изображения
- [x] Live-слайдеры с превью в реальном времени:
  - [x] brightness
  - [x] contrast
  - [x] saturation
- [x] View original — временный просмотр нередактированного оригинала без уничтожения операций; reset adjustments — в панели Adjustments
- [x] Export — скачивание результата (Canvas pipeline)
- [x] Crop не активен сразу после upload — пользователь нажимает **Crop** в панели

### Бонус (опционально)

- [x] Фильтры grayscale и sepia
- [x] Export операций в JSON (`EditDocument`, `version: 1`)
- [x] Import JSON — восстановление `operations[]` и preview из `EditDocument` (тот же оригинал по размерам)
- [x] `replayDocument()` — JSON + originalBlob → Blob (общий pipeline с export)

### Ограничения и заметки

- Редактирование остаётся **неразрушающим** (`originalBlob` immutable, правки в `operations[]`)
- AI разрешён и приветствуется
- Дизайн-решения (модель операций, pipeline, UX) — на исполнителе, с пояснением trade-offs

### Что сдать

- Ссылка на git-репозиторий или zip, который запускается через `npm i && npm run dev`
- Краткие заметки о ключевых решениях, trade-offs и бонусе (формат операций, replay)

---

## 2. Ключевые принципы разработки (mid+ / senior)

### 2.1. Модель данных важнее UI

Оригинал — immutable. Все изменения — **операции над состоянием**:

```
Original (Blob)
    └── operations[]
            ├── crop
            ├── adjust (brightness + contrast + saturation)
            └── filter
                    ↓
            Preview (CSS filter + crop preview URL)
            Export (Canvas: crop → filter → Blob)
```

### 2.2. Разделение слоёв

| Слой | Ответственность | Где |
|---|---|---|
| **Types** | Контракты операций, `EditDocument` | `src/types/editor.ts` |
| **Store (Pinia)** | Оригинал, операции, derived state, orchestration | `src/stores/editor.ts` |
| **Composables** | Cropper lifecycle, file upload | `useCropper`, `useImageUpload` |
| **Render pipeline** | Pure functions: `operations + original → Blob` | `src/lib/image/*` |
| **Components** | UI, события, привязка к store | `src/components/main/*` |

### 2.3. Типобезопасная модель операций

Реализовано в `src/types/editor.ts`:

```ts
type EditOperation =
  | { type: 'crop'; x: number; y: number; width: number; height: number }
  | { type: 'adjust'; brightness: number; contrast: number; saturation: number }
  | { type: 'filter'; name: 'grayscale' | 'sepia' }

interface EditDocument {
  version: 1
  source: { name: string; width: number; height: number }
  operations: EditOperation[]
}
```

Слайдеры: диапазон **−100…100**, одна операция `adjust` в стеке.

### 2.4. Pipeline: preview vs export

| Путь | Техника | Модуль |
|---|---|---|
| **Live preview** | CSS `filter` на `.editor-preview__stage` + CropperJS | `adjustments.ts`, `filters.ts`, `useCropper` |
| **Export** | Canvas: `cropImageBlob` → `ctx.filter` → `toBlob()` | `exportImage.ts` |

Оба пути читают один `operations[]`. Возможное расхождение CSS vs Canvas — задокументированный trade-off.

**Crop (инварианта):** в `operations[]` — **одна** crop-операция; координаты **всегда** относительно `originalBlob`. Re-crop («Adjust crop») = replace crop op + `syncCropPreviewFromOperations`. **Undo crop** удаляет эту единственную crop-операцию (не multi-step history). `workingBlob` / `croppedPreviewUrl` — derived cache, не source of truth.

Во время `isCropEditing` cropper показывает оригинал (`cropperImageUrl`); adjustments/filters по-прежнему применяются через CSS на stage (кроме «View original»).

### 2.5. Управление памятью

- `URL.revokeObjectURL` при смене файла, undo crop, `reset()`
- CropperJS `destroy()` при выходе из crop mode / смене URL
- Один `originalBlob`; `croppedPreviewUrl` / `cropApplyHistory` — derived cache для preview (не stack операций)

### 2.6. Обработка ошибок

| Сценарий | Поведение |
|---|---|
| Не изображение / >20 MB | `validateImageFile`, alert на upload screen |
| Битый файл | `READ_IMAGE_ERROR` в store |
| Export / crop fail | `store.error`, alert в `EditorLayout` |
| Export во время crop editing | Disabled + tooltip «Apply or cancel crop first» |
| Crop без изображения | Cropper не показывается |

### 2.7. UX

- Empty state: `UploadPromptCard` — квадратная drop zone (1:1, max 20rem), click + drag-and-drop
- **Upload new** в Actions — замена изображения без reload страницы
- Loading на upload и apply crop / export image
- View original: toggle, success-состояние кнопки + info chip «Viewing original»; без затемнения preview (opacity 1)
- Info chips в preview: размеры (tooltip с полным текстом) + статус view original
- Layout: preview слева + sidebar справа на **100vh**; скролл только у sidebar; mobile stack
- Sidebar UI: квадратные кнопки в Actions (2×2 grid + Export image block снизу) и Filter (2 кнопки); Crop + Undo в одной строке (2fr / 1fr)
- Компактные Vuetify controls (select 32px, menu overrides) — в Adjustments и прочих select-based панелях

### 2.8. Тестируемость

Vitest (`npm test`, `npm run test:watch`). Покрытие pure pipeline:

| Модуль | Что проверяется |
|---|---|
| `operations.test.ts` | `upsertCropOperation`, `removeCropOperation`, find helpers |
| `documentValidation.test.ts` | valid doc, version, duplicate ops, crop bounds, clamp adjust |
| `exportImage.test.ts` | crop from original, `replayDocument` === export pipeline |
| `rebuildCropPreview.test.ts` | `syncCropPreviewFromOperations` |

Canvas integration в Node нестабилен — export-тесты мокают `cropImageBlob`. Fixture: `tests/fixtures/32x32.png`.

### 2.9. Структура проекта (фактическая)

```
src/
├── types/editor.ts
├── stores/editor.ts
├── composables/
│   ├── useCropper.ts
│   ├── useImageUpload.ts
│   └── useJsonImport.ts
├── lib/image/
│   ├── adjustments.ts
│   ├── cropImageBlob.ts
│   ├── cropRect.ts
│   ├── document.ts
│   ├── documentValidation.ts
│   ├── downloadFile.ts
│   ├── exportImage.ts
│   ├── filters.ts
│   ├── operations.ts          # find/upsert crop, buildPreviewCssFilter
│   ├── preloadObjectUrl.ts
│   ├── readImageMeta.ts       # EXIF-aware via createImageBitmap
│   ├── rebuildCropPreview.ts  # syncCropPreviewFromOperations
│   ├── replayDocument.ts
│   └── validateImageFile.ts
├── components/main/
│   ├── UploadPromptCard.vue
│   ├── MainEditor.vue
│   ├── EditorLayout.vue
│   ├── EditorPreview.vue
│   ├── EditorSidebar.vue
│   ├── EditorCropPanel.vue
│   ├── EditorAdjustmentsPanel.vue
│   ├── EditorFilterPanel.vue
│   └── EditorActionsPanel.vue
├── plugins/vuetify/          # theme, defaults
├── styles/                     # settings, tokens, overrides
├── views/MainView.vue          # /
└── router/index.ts             # / → MainView; /main → redirect /
tests/
├── fixtures/32x32.png
└── unit/                       # *.test.ts
```

### 2.10. Pinia store — реализованный контракт

**State (ключевое):** `originalBlob`, `originalMeta`, `operations[]`, crop state (`isCropEditing`, `cropDraft`, `appliedCrop`, `workingBlob`, `croppedPreviewUrl`), `isViewingOriginal`, `isExportingImage`, `isImportingDocument`, `error`.

**Getters:** `hasImage`, `effectivePreviewUrl`, `cropperImageUrl`, `effectivePreviewCssFilter`, `imageDimensionsLabel`, `imageDimensionsTooltip`, `adjustValues`, `filterValue`, `canExport`, `canViewOriginal`, `editDocument`, …

**Actions:** `loadImage`, `setCropDraft`, `startCropEditing`, `applyCrop`, `undoLastCrop`, `setAdjust`, `resetAdjustments`, `setFilter`, `toggleViewOriginal`, `exportImage`, `exportDocumentJson`, `importEditDocument`, `reset`.

**Async guards:** `loadSeq`, `cropSeq`, `exportSeq`, `importSeq` — защита от stale apply/import/export при двойном клике.

### 2.11. Export JSON

Скачивается `{basename}.json`. Пример:

```json
{
  "version": 1,
  "source": {
    "name": "photo.jpg",
    "width": 4000,
    "height": 3000
  },
  "operations": [
    { "type": "crop", "x": 100, "y": 50, "width": 800, "height": 600 },
    { "type": "adjust", "brightness": 10, "contrast": 5, "saturation": -20 },
    { "type": "filter", "name": "grayscale" }
  ]
}
```

### 2.12. Scope control (не делали)

- Backend / server upload
- Полноценный undo/redo stack (есть **undo crop** — снятие единственной crop-операции)
- Reset all edits одной кнопкой
- WebGL / WASM
- Web Worker export
- Wireframe-прототип (удалён)

### 2.13. EXIF orientation

`readImageMeta` использует `createImageBitmap(file, { imageOrientation: 'from-image' })` для width/height после нормализации ориентации — выравнивает metadata с CropperJS (`checkOrientation: true`) и import JSON. Fallback на `Image()` если API недоступен.

### 2.14. Trade-offs для README при сдаче

1. **Operation stack** vs canvas as source of truth — single crop relative to original
2. **CSS preview vs Canvas export** — допустимое расхождение рендеринга
3. **JSON format** + `replayDocument` === `exportImageBlob`
4. **Дальше:** e2e, Web Worker export

---

## 3. Порядок реализации

### Выполнено

| # | Этап | Статус |
|---|---|---|
| 0 | Scaffold: Vue 3, Vuetify 3, Pinia, TS, Vite, CropperJS, vue-router | ✅ |
| 0 | Кастомизация Vuetify: theme, SASS, overrides (button, select, menu, cropper) | ✅ |
| 1 | Upload: UI + валидация + Pinia + DnD | ✅ |
| 2 | Editor layout: preview + sidebar | ✅ |
| 3 | Crop: CropperJS, apply/undo, операция `crop` | ✅ |
| 4 | Adjustments: слайдеры, CSS preview, операция `adjust` | ✅ |
| 5 | Filter: кнопки grayscale/sepia, операция `filter` | ✅ |
| 6 | Actions: View original, Export image, Export JSON | ✅ |
| 7 | Роутинг: продакшн на `/`, удаление wireframe | ✅ |
| 8 | UX: info chips, media object в crop panel | ✅ |
| 9 | Import JSON: parse/validate, rebuild crop preview, restore session | ✅ |
| 10 | Critical fixes: single crop model, operations layer, EXIF, P1 hardening, unit tests | ✅ |
| 11 | UI polish: 100vh layout, square sidebar buttons, crop row, dimensions tooltip, crop UX fixes | ✅ |

### Дальше (опционально)

1. README для сдачи (сейчас — дефолтный Vite template)
2. E2E-тесты
3. Web Worker export

---

## 4. Текущее состояние репозитория

### Инфраструктура

- `npm i && npm run dev` — работает
- `npm test` — Vitest (12 tests)
- **Роутинг:** `/` — редактор (`MainView`); `/main` — redirect на `/`
- **Pinia:** `src/stores/editor.ts`
- **CropperJS:** `src/composables/useCropper.ts`

### Кастомизация Vuetify

| Что | Где |
|---|---|
| Primary `#000000`, success `#4CAF50` | `src/plugins/vuetify/theme.ts` |
| SASS variables | `src/styles/settings.scss` |
| Кнопки: flat, 32px, radius 10px | `src/styles/overrides/_button.scss`, `defaults.ts` |
| Select / menu compact | `src/styles/overrides/_select.scss`, `_menu.scss` |
| App tokens (preview, panels, chips) | `src/styles/_tokens.scss` |

### Статус по ТЗ

| Требование | Статус | Реализация |
|---|---|---|
| Загрузка изображения | ✅ | `UploadPromptCard`, `useImageUpload`, `loadImage` |
| Crop | ✅ | `EditorCropPanel`, `useCropper`, `cropImageBlob`, `applyCrop` |
| Brightness / contrast / saturation | ✅ | `EditorAdjustmentsPanel`, CSS preview, `setAdjust` |
| View original | ✅ | `toggleViewOriginal`, `effectivePreviewUrl`, info chip |
| Reset adjustments | ✅ | `resetAdjustments` в панели Adjustments |
| Export image | ✅ | `exportImageBlob`, `downloadBlob`, `{name}-edited.ext` |
| Bonus: фильтр | ✅ | `EditorFilterPanel`, grayscale + sepia |
| Bonus: export JSON | ✅ | `buildEditDocument`, `downloadEditDocument` |
| Bonus: import / replay JSON | ✅ | `importEditDocument`, `replayDocument`, `syncCropPreviewFromOperations` |

### P0 / P1 fixes (аудит)

| Проблема | Решение |
|---|---|
| Re-crop ломал export (coords от cropped, не original) | `applyCrop` → `cropImageBlob(originalBlob)` + `upsertCropOperation` |
| Cropper на уже обрезанном preview | `cropperImageUrl` = original during `isCropEditing` |
| CSS filter во время crop | Adjustments/filters на stage; cropper остаётся на оригинале |
| EXIF mismatch при import | `createImageBitmap` в `readImageMeta` |
| Crop out of bounds в JSON | Валидация в `validateEditDocument` |
| Async races | `cropSeq` / `exportSeq` / `importSeq` |
| Нет Upload new | Кнопка в `EditorActionsPanel` |
| Export disabled без подсказки | Tooltip на disabled Export |
| Crop не стартует после upload | `loadImage` → `isCropEditing = false`; пользователь нажимает Crop |
| Apply crop disabled при re-crop без движения handles | `canApplyCrop` не требует `cropDraft !== appliedCrop` |
| View original затемнял preview | Убран `opacity: 0.85` на `.editor-preview__image--original` |
| Adjustments не видны во время crop | `effectivePreviewCssFilter` не обнуляется при `isCropEditing` |

### Что закрыто по ТЗ

**End-to-end:** загрузка, crop, live adjustments, view original, export image, bonus filter + JSON export/import (session restore).

**Архитектура:** non-destructive `originalBlob` + `operations[]`, разделение preview (CSS) и export/replay (Canvas).

### Известные ограничения

- Import JSON требует уже загруженный оригинал с **совпадающими width/height** (имя файла может отличаться; EXIF-normalized dimensions)
- Canvas integration-тесты в Node нестабильны — export покрыт с mock `cropImageBlob`

### Следующий шаг

README для сдачи (`npm i && npm run dev`, краткие trade-offs — см. §2.14).
