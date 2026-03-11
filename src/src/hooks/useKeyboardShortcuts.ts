import { useEffect } from 'react'

interface ShortcutHandlers {
  onToggleTimer?: () => void
  onReset?: () => void
  onSkip?: () => void
  onToggleFlowMode?: () => void
  onToggleZenMode?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault()
          handlers.onToggleTimer?.()
          break
        case 'r':
          handlers.onReset?.()
          break
        case 's':
          handlers.onSkip?.()
          break
        case 'f':
          handlers.onToggleFlowMode?.()
          break
        case 'z':
          handlers.onToggleZenMode?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
