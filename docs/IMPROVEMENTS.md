# Improvements backlog

Документ фиксирует известные проблемы архитектуры, UX и clean code — выявлены при ревью перед сдачей. Используем как чеклист для последующих правок.

**Статус:** открыто  
**Приоритет:** P1 (cancel crop, dead state) → P2 (state model) → P3 (store decomposition)

---

## 1. Clean code

### 1.1. Dead state: `workingBlob`

| | |
|---|---|
| **Где** | `src/stores/editor.ts`, `src/lib/image/rebuildCropPreview.ts`, `src/types/editor.ts` |
| **Проблема** | Поле записывается в store (`loadImage`, `applyCropPreviewState`, `clearCrop`), но **нигде не читается** — ни getter, ни component. |
| **Нарушает** | YAGNI, single source of truth |
| **Решение** | Удалить из `EditorState`, `CropPreviewState`, тестов. Preview и export опираются на `originalBlob` + `operations[]` + `croppedPreviewUrl`. |
| **Статус** | [x] |

### 1.2. Псевдо-history: `cropApplyHistory`

| | |
|---|---|
| **Где** | `src/stores/editor.ts`, `src/lib/image/rebuildCropPreview.ts`, `src/types/editor.ts` (`CropHistoryEntry`) |
| **Проблема** | При single-crop модели массив всегда содержит 0 или 1 entry. Не stack undo — только обёртка вокруг одного URL для revoke. Название вводит в заблуждение. |
| **Нарушает** | KISS, honest naming |
| **Решение** | Удалить `cropApplyHistory` и `CropHistoryEntry`. Revoke старого preview URL — в одной функции при replace (`applyCropPreviewState`). |
| **Статус** | [x] |

### 1.3. Fat store (~600 строк)

| | |
|---|---|
| **Где** | `src/stores/editor.ts` |
| **Проблема** | Store совмещает domain (operations upsert), infrastructure (URL lifecycle), UI session (crop editing), async guards (`loadSeq`, `cropSeq`, …), error messages. |
| **Нарушает** | SRP |
| **Решение (P3, опционально)** | Вынести: `rebuildCropPreview` + revoke → `lib/image/previewCache.ts`; crop session → composable `useCropSession` или отдельный модуль; seq guards → `createAsyncGuard()`. Store остаётся фасадом. |
| **Статус** | [x] |

### 1.4. Module-level seq counters

| | |
|---|---|
| **Где** | `src/stores/editor.ts` — `let loadSeq`, `cropSeq`, `exportSeq`, `importSeq` вне store |
| **Проблема** | Скрытая связь с `reset()`; сложнее изолированно тестировать store. |
| **Решение** | Перенести в closure/composable или private fields factory; документировать контракт invalidate. |
| **Статус** | [x] |

### 1.5. Дублирование canvas pipeline (minor)

| | |
|---|---|
| **Где** | `src/lib/image/cropImageBlob.ts`, `src/lib/image/exportImage.ts` |
| **Проблема** | Оба: blob → Image → canvas → toBlob. |
| **Решение** | Обобщить в `renderBlobWithCanvas()` — только если diff оправдан; для тестового low priority. |
| **Статус** | [ ] |

### 1.6. Runtime type assertion в `readImageMeta`

| | |
|---|---|
| **Где** | `src/lib/image/readImageMeta.ts` — `mimeType: file.type as ImageMimeType` |
| **Проблема** | Cast без runtime check; validation в `validateImageFile` не связана явно. |
| **Решение** | Использовать validated mime из `validateImageFile` или narrow helper. |
| **Статус** | [ ] |

---

## 2. Cancel flows

### 2.1. Нет Cancel crop (P1)

| | |
|---|---|
| **Где** | `EditorCropPanel.vue`, `stores/editor.ts`, tooltip в `EditorActionsPanel.vue` |
| **Проблема** | Export disabled с текстом «Apply or cancel crop first», но кнопки **Cancel нет**. В crop mode доступен только Apply — пользователь не может выйти без commit или reload / Upload new. |
| **Сценарии** | |

**Сценарий A — первый crop (нет crop op):**

```
Upload → Crop → передумал → Cancel → full preview, operations[] без crop
```

**Сценарий B — re-crop (Adjust crop):**

```
Crop applied → Adjust crop → двинул handles → Cancel → preview как до входа в crop mode, operations[] не меняются
```

| **Решение** | |
|---|---|
| Action | `cancelCropEditing()` в store |
| Logic | `isCropEditing = false`; `cropDraft` сбросить к baseline (`appliedCrop` / committed crop из `operations[]`); `operations[]` и `croppedPreviewUrl` **не трогать** |
| UI | Кнопка Cancel рядом с Apply crop в `EditorCropPanel.vue` |
| **Статус** | [ ] |

### 2.2. Export disabled reason — только `title` (minor)

| | |
|---|---|
| **Где** | `EditorActionsPanel.vue` — `:title="exportDisabledReason"` |
| **Проблема** | На touch/mobile tooltip не виден. |
| **Решение** | `v-tooltip` на disabled Export (как dimensions chip в layout). |
| **Статус** | [ ] |

### 2.3. Прочие cancel flows (backlog, не блокер)

| Flow | Сейчас | Идея |
|---|---|---|
| Upload new | Заменяет всё без confirm | Confirm dialog при несохранённых правках (optional) |
| Import JSON | Перезаписывает operations | Confirm + hint про matching dimensions |

---

## 3. Cleaner state model

### 3.1. Три слоя state (целевая модель)

```
Layer 1 — Immutable (load once)
  originalBlob, originalMeta, previewObjectUrl

Layer 2 — Document (source of truth)
  operations[]

Layer 3 — Derived cache (async rebuild)
  croppedPreviewUrl

Layer 4 — Session (transient, только crop UI)
  cropSession: { baseline, draft } | null

Layer 5 — Flags
  isViewingOriginal, isLoading, isApplyingCrop, …
```

**Правило:** export, JSON export/import, `replayDocument` читают только `originalBlob + operations[]`. Всё остальное — projection или cache.

### 3.2. Дублирование `appliedCrop` vs `operations[]`

| | |
|---|---|
| **Сейчас** | После apply `appliedCrop` совпадает с `findCropOperation(operations)`. Дублирование. |
| **Зачем `appliedCrop` нужен** | Baseline для crop session: при re-crop `cropDraft` меняется, `operations[]` ещё старые — без baseline cancel и `hasPendingCrop` невозможны. |
| **Решение** | Вне crop mode: committed rect только из `operations[]` (getter `committedCropRect`). В crop mode: baseline в session object, не плоские поля. |
| **Статус** | [ ] |

### 3.3. Session object вместо плоских полей

| | |
|---|---|
| **Сейчас** | `isCropEditing`, `cropDraft`, `appliedCrop` — три поля, теоретически inconsistent combos |
| **Цель** | `cropSession: { baseline: CropRect \| null, draft: CropRect \| null } \| null` |
| **Плюс** | `cropSession === null` ⇔ not editing; один объект = одна UI-модальность |
| **Статус** | [ ] |

### 3.4. Упростить `rebuildCropPreview`

| | |
|---|---|
| **Сейчас** | `CropPreviewState` — 3 поля (`croppedPreviewUrl`, `appliedCrop`, `cropDraft`) |
| **Цель** | Возвращать только `{ croppedPreviewUrl }`; session fields задаёт store при enter/exit crop mode |
| **Статус** | [ ] |

### 3.5. Invalid states, которые модель должна исключать

| Invalid state | После cleanup |
|---|---|
| `workingBlob` ≠ reality | поля нет |
| `cropApplyHistory` out of sync | поля нет |
| `isCropEditing=true`, нет baseline при re-crop | session.baseline set в `startCropEditing` |
| `cropDraft` без active session | draft только inside `cropSession` |

---

## 4. Рекомендуемый порядок работ

| # | Задача | Effort | ROI |
|---|---|---|---|
| 1 | `cancelCropEditing()` + UI Cancel | ~30 min | Закрывает UX-дыру, tooltip mismatch |
| 2 | Удалить `workingBlob`, `cropApplyHistory` | ~45 min | Clean code, −~40 строк, хорошая story на интервью |
| 3 | `v-tooltip` на disabled Export | ~15 min | Mobile UX |
| 4 | `cropSession` object + упростить `CropPreviewState` | ~2 h | Cleaner state model |
| 5 | Store decomposition, seq guards | ~2–3 h | Senior polish, не обязательно для сдачи |

---

## 5. Критерии готовности

- [ ] Cancel crop работает в обоих сценариях (A, B)
- [x] `workingBlob` удалён, тесты зелёные
- [x] `cropApplyHistory` удалён, тесты зелёные
- [ ] `npm test` pass
- [ ] `docs/PROJECT.md` обновлён при изменении state contract (если нужно)
- [ ] README trade-offs без изменений или с одной строкой про cancel (optional)

---

## Связанные файлы

```
src/stores/editor.ts
src/lib/image/rebuildCropPreview.ts
src/types/editor.ts
src/components/main/EditorCropPanel.vue
src/components/main/EditorActionsPanel.vue
tests/unit/rebuildCropPreview.test.ts
```
