'use client'

import { useEffect } from 'react'

export default function PwaZoomGuard() {
  useEffect(() => {
    const preventGesture = (event: Event) => {
      event.preventDefault()
    }

    const preventMultiTouchZoom = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault()
      }
    }

    document.addEventListener('gesturestart', preventGesture, { passive: false })
    document.addEventListener('gesturechange', preventGesture, { passive: false })
    document.addEventListener('gestureend', preventGesture, { passive: false })
    document.addEventListener('touchmove', preventMultiTouchZoom, { passive: false })

    return () => {
      document.removeEventListener('gesturestart', preventGesture)
      document.removeEventListener('gesturechange', preventGesture)
      document.removeEventListener('gestureend', preventGesture)
      document.removeEventListener('touchmove', preventMultiTouchZoom)
    }
  }, [])

  return null
}

