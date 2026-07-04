# Image Editor (LiveArt test)

Browser image editor with a non-destructive operation model. Vue 3 + Vuetify 3 + Pinia + TypeScript + CropperJS.

## Run

```bash
npm i && npm run dev   # http://localhost:5173
npm test               # Vitest
```

## Key decisions

- **Non-destructive editing:** immutable `originalBlob` + typed `operations[]` (`crop`, `adjust`, `filter`).
- **Single crop op:** coordinates are always relative to the original; re-crop replaces the op, it does not stack.

## Trade-offs

- **Live preview** uses CSS `filter`; **export / replay** use Canvas (`crop → filter → blob`). Same filter strings, minor rendering differences — speed over pixel-perfect preview.

## Bonus features

- **Grayscale / Sepia** — `operations[]` with `type: 'filter'` and `name: 'grayscale' | 'sepia'`.
- **Export JSON** — `buildEditDocument(meta, operations)` → `EditDocument` v1: `source` (name, width, height) + `operations[]`.
- **Import JSON** — `parseEditDocument` → `validateEditDocument` → restore `operations[]` and crop preview. Requires the same original image already loaded (matching `width` / `height`; filename may differ).
- **Replay** — `replayDocument(originalBlob, doc)` = `exportImageBlob(originalBlob, doc.operations)` — same pipeline as Export image.
