import { defer, Await } from "react-router-dom"

export { Await }

export function useDeferredLoaderData() {
  return {}
}

export function deferredLoader<T>(loader: () => T) {
  return () => defer(loader() as Record<string, unknown>)
}
