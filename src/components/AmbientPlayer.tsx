import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, CloudRain, Music, Coffee, TreePine, Waves } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AmbientSound } from '@/types'

const AMBIENT_SOUNDS: {
  id: AmbientSound
  label: string
  icon: React.ReactNode
  url: string
}[] = [
  { 
    id: 'none', 
    label: 'Off', 
    icon: <VolumeX className="w-4 h-4" />,
    url: ''
  },
  { 
    id: 'rain', 
    label: 'Rain', 
    icon: <CloudRain className="w-4 h-4" />,
    url: 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3'
  },
  { 
    id: 'lofi', 
    label: 'Lo-fi', 
    icon: <Music className="w-4 h-4" />,
    url: 'https://assets.mixkit.co/active_storage/sfx/123/123-preview.mp3'
  },
  { 
    id: 'cafe', 
    label: 'Cafe', 
    icon: <Coffee className="w-4 h-4" />,
    url: 'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3'
  },
  { 
    id: 'forest', 
    label: 'Forest', 
    icon: <TreePine className="w-4 h-4" />,
    url: 'https://assets.mixkit.co/active_storage/sfx/2430/2430-preview.mp3'
  },
  { 
    id: 'ocean', 
    label: 'Ocean', 
    icon: <Waves className="w-4 h-4" />,
    url: 'https://assets.mixkit.co/active_storage/sfx/2432/2432-preview.mp3'
  }
]

export default function AmbientPlayer() {
  const [activeSound, setActiveSound] = useState<AmbientSound>('none')
  const [volume, setVolume] = useState(0.5)
  const [isExpanded, setIsExpanded] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (activeSound === 'none') {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      return
    }

    const soundConfig = AMBIENT_SOUNDS.find(s => s.id === activeSound)
    if (!soundConfig) return

    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(soundConfig.url)
    audio.loop = true
    audio.volume = volume
    audioRef.current = audio

    audio.play().catch(() => {
      // Autoplay may be blocked
      console.log('Audio autoplay blocked - user interaction required')
    })

    return () => {
      audio.pause()
    }
  }, [activeSound])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const handleSoundSelect = (sound: AmbientSound) => {
    if (sound === activeSound) {
      setActiveSound('none')
    } else {
      setActiveSound(sound)
    }
  }

  return (
    <div className="bg-card rounded-2xl p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium text-foreground">Ambient Sounds</span>
        </div>
        {activeSound !== 'none' && (
          <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
            {AMBIENT_SOUNDS.find(s => s.id === activeSound)?.label}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Sound Selection */}
          <div className="grid grid-cols-3 gap-2">
            {AMBIENT_SOUNDS.map(sound => (
              <button
                key={sound.id}
                onClick={() => handleSoundSelect(sound.id)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-xl transition-colors",
                  activeSound === sound.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {sound.icon}
                <span className="text-xs">{sound.label}</span>
              </button>
            ))}
          </div>

          {/* Volume Control */}
          {activeSound !== 'none' && (
            <div className="flex items-center gap-3">
              <VolumeX className="w-4 h-4 text-muted-foreground" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
