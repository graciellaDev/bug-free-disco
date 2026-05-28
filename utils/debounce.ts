/**
 * Лёгкий debounce (замена `lodash/debounce`).
 * По умолчанию trailing: вызов после паузы `waitMs` с момента последнего вызова.
 */
export type DebouncedFunction<T extends (...args: unknown[]) => unknown> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  waitMs = 0,
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      timeoutId = undefined
      fn(...args)
    }, waitMs)
  }

  debounced.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
  }

  return debounced
}
