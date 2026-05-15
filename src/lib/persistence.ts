export function debounce<TArgs extends unknown[]>(fn: (...args: TArgs) => void, delayMs: number) {
  let timeout: number | undefined

  return (...args: TArgs) => {
    window.clearTimeout(timeout)
    timeout = window.setTimeout(() => fn(...args), delayMs)
  }
}

export function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function readJsonFile(file: File) {
  return new Promise<unknown>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)))
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
