import { useEffect, useRef } from 'react'

/**
 * A mutation's onSuccess still fires even after its component unmounts (e.g. the user tapped a
 * bottom-nav tab while a slow create request was in flight) — guard any navigate() call in
 * onSuccess with this so a late response can't redirect the user somewhere they didn't ask for.
 */
export function useIsMounted() {
  const ref = useRef(true)
  useEffect(() => {
    ref.current = true
    return () => {
      ref.current = false
    }
  }, [])
  return ref
}
