'use client'

import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/lib/app-context'
import type { AmbientSound } from '@/lib/types'
import {
  CloudRain,
  Music,
  Coffee,
  TreePine,
  Waves,
  VolumeX,
  Volume2,
} from 'lucide-react'

const SOUNDS: { value: AmbientSound; label: string; icon: React.ElementType; url: string }[] = [
  { value: 'none', label: 'Off', icon: VolumeX, url: '' },
  { 
    value: 'rain', 
    label: 'Rain', 
    icon: CloudRain, 
    url: 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3' 
  },
  { 
    value: 'lofi', 
    label: 'Lo-Fi', 
    icon: Music, 
    url: 'https://assets.mixkit.co/active_storage/sfx/123/123-preview.mp3' 
  },
  { 
    value: 'cafe', 
    label: 'Cafe', 
    icon: Coffee, 
    url: 'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3' 
  },
  { 
    value: 'forest', 
    label: 'Forest', 
    icon: TreePine, 
    url: 'https://assets.mixkit.co/active_storage/sfx/17/17-preview.mp3' 
  },
  { 
    value: 'waves', 
    label: 'Waves', 
    icon: Waves, 
    url: 'https://assets.mixkit.co/active_storage/sfx/2196/2196-preview.mp3' 
  },
]

export function AmbientPlayer() {
  const { state, dispatch } = useApp()
  const { currentAmbientSound, appSettings } = state
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [volume, setVolume] = useState(0.5)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const sound = SOUNDS.find(s => s.value === currentAmbientSound)
    
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    
    if (sound && sound.url && currentAmbientSound !== 'none') {
      audioRef.current = new Audio(sound.url)
      audioRef.current.loop = true
      audioRef.current.volume = volume
      
      if (appSettings.soundEnabled) {
        audioRef.current.play().then(() => {
          setIsPlaying(true)
        }).catch(() => {
          setIsPlaying(false)
        })
      }
    } else {
      setIsPlaying(false)
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [currentAmbientSound, appSettings.soundEnabled])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const handleSoundChange = (sound: AmbientSound) => {
    dispatch({ type: 'SET_AMBIENT_SOUND', payload: sound })
  }

  return (
    <div className="bg-secondary rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="w-4 h-4 text-sky-400" />
        <span className="font-medium">Ambient Sounds</span>
        {isPlaying && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Playing
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {SOUNDS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => handleSoundChange(value)}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
              currentAmbientSound === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-background/80'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>

      {currentAmbientSound !== 'none' && (
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Volume</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            className="w-full h-2 bg-background rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          />
        </div>
      )}
    </div>
  )
}
