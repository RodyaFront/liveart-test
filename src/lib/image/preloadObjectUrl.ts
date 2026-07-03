export function preloadObjectUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Failed to preload image'))
    image.src = url
  })
}
