import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { onUnmounted, type Ref } from 'vue'
import { cropRectsEqual, roundCropRect } from '@/lib/image/cropRect'
import type { CropRect } from '@/types/editor'

export interface UseCropperOptions {
  getInitialCrop?: () => CropRect | null
  onCrop?: (rect: CropRect) => void
}

export function useCropper(
  imageRef: Ref<HTMLImageElement | null>,
  options: UseCropperOptions = {},
) {
  let cropper: Cropper | null = null

  function destroy() {
    cropper?.destroy()
    cropper = null
  }

  function emitCropData() {
    if (!cropper || !options.onCrop) {
      return
    }

    const data = cropper.getData()
    options.onCrop(roundCropRect({
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
    }))
  }

  function init() {
    const image = imageRef.value
    if (!image?.src) {
      return
    }

    destroy()

    cropper = new Cropper(image, {
      viewMode: 1,
      dragMode: 'crop',
      responsive: true,
      restore: false,
      checkCrossOrigin: false,
      checkOrientation: true,
      autoCropArea: 1,
      background: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      ready() {
        const initialCrop = options.getInitialCrop?.()
        if (initialCrop) {
          cropper?.setData(initialCrop)
        }
        emitCropData()

        requestAnimationFrame(() => {
          if (!cropper) {
            return
          }

          // cropperjs runtime exposes resize(); @types/cropperjs does not
          ;(cropper as Cropper & { resize(): void }).resize()
          emitCropData()
        })
      },
      crop() {
        emitCropData()
      },
    })
  }

  function setCropData(rect: CropRect) {
    if (!cropper) {
      return
    }

    const current = roundCropRect(cropper.getData())
    if (cropRectsEqual(current, rect)) {
      return
    }

    cropper.setData(rect)
  }

  onUnmounted(destroy)

  return {
    init,
    destroy,
    setCropData,
  }
}
