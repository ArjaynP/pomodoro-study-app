import { useState, useEffect, useRef } from 'react'
import { Volume2, VolumeX, CloudRain, Music, Coffee, Wind, Waves } from 'lucide-react'
import { cn } from '../lib/utils'

type SoundType = 'rain' | 'lofi' | 'cafe' | 'wind' | 'waves'

interface Sound {
  id: SoundType
  name: string
  icon: typeof CloudRain
  color: string
}

const SOUNDS: Sound[] = [
  { id: 'rain', name: 'Rain', icon: CloudRain, color: 'text-blue-500' },
  { id: 'lofi', name: 'Lo-fi', icon: Music, color: 'text-purple-500' },
  { id: 'cafe', name: 'Cafe', icon: Coffee, color: 'text-amber-500' },
  { id: 'wind', name: 'Wind', icon: Wind, color: 'text-teal-500' },
  { id: 'waves', name: 'Waves', icon: Waves, color: 'text-cyan-500' },
]

// Generate ambient noise using Web Audio API
class AmbientNoiseGenerator {
  private audioContext: AudioContext | null = null
  private noiseNode: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private filterNode: BiquadFilterNode | null = null
  private isPlaying = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
  }

  private createNoiseBuffer(type: SoundType): AudioBuffer {
    if (!this.audioContext) throw new Error('AudioContext not available')
    
    const bufferSize = this.audioContext.sampleRate * 2
    const buffer = this.audioContext.createBuffer(2, bufferSize, this.audioContext.sampleRate)
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < bufferSize; i++) {
        // Different noise characteristics based on type
        switch (type) {
          case 'rain':
            data[i] = (Math.random() * 2 - 1) * 0.5
            if (Math.random() > 0.99) data[i] *= 3 // occasional louder drops
            break
          case 'wind':
            data[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.0001) * 0.4
            break
          case 'waves':
            data[i] = (Math.random() * 2 - 1) * (0.3 + 0.2 * Math.sin(i * 0.00005))
            break
          case 'cafe':
            data[i] = (Math.random() * 2 - 1) * 0.3
            // Add some "murmur" by modulating
            data[i] *= 0.5 + 0.5 * Math.sin(i * 0.0003)
            break
          case 'lofi':
            // Warmer, more filtered noise
            data[i] = (Math.random() * 2 - 1) * 0.4
            break
          default:
            data[i] = (Math.random() * 2 - 1) * 0.5
        }
      }
    }
    
    return buffer
  }

  play(type: SoundType, volume: number) {
    if (!this.audioContext) return
    
    this.stop()
    
    // Create nodes
    this.noiseNode = this.audioContext.createBufferSource()
    this.noiseNode.buffer = this.createNoiseBuffer(type)
    this.noiseNode.loop = true
    
    this.gainNode = this.audioContext.createGain()
    this.gainNode.gain.value = volume * 0.5
    
    this.filterNode = this.audioContext.createBiquadFilter()
    
    // Apply different filter settings based on sound type
    switch (type) {
      case 'rain':
        this.filterNode.type = 'lowpass'
        this.filterNode.frequency.value = 4000
        break
      case 'wind':
        this.filterNode.type = 'bandpass'
        this.filterNode.frequency.value = 800
        this.filterNode.Q.value = 0.5
        break
      case 'waves':
        this.filterNode.type = 'lowpass'
        this.filterNode.frequency.value = 2000
        break
      case 'cafe':
        this.filterNode.type = 'lowpass'
        this.filterNode.frequency.value = 3000
        break
      case 'lofi':
        this.filterNode.type = 'lowpass'
        this.filterNode.frequency.value = 1500
        break
    }
    
    // Connect nodes
    this.noiseNode.connect(this.filterNode)
    this.filterNode.connect(this.gainNode)
    this.gainNode.connect(this.audioContext.destination)
    
    this.noiseNode.start()
    this.isPlaying = true
  }

  stop() {
    if (this.noiseNode) {
      this.noiseNode.stop()
      this.noiseNode.disconnect()
      this.noiseNode = null
    }
    if (this.filterNode) {
      this.filterNode.disconnect()
      this.filterNode = null
    }
    if (this.gainNode) {
      this.gainNode.disconnect()
      this.gainNode = null
    }
    this.isPlaying = false
  }

  setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = volume * 0.5
    }
  }

  getIsPlaying() {
    return this.isPlaying
  }
}

export default function AmbientPlayer() {
  const [activeSound, setActiveSound] = useState<SoundType | null>(null)
  const [volume, setVolume] = useState(0.5)
  const [isExpanded, setIsExpanded] = useState(false)
  const generatorRef = useRef<AmbientNoiseGenerator | null>(null)

  useEffect(() => {
    generatorRef.current = new AmbientNoiseGenerator()
    return () => {
      generatorRef.current?.stop()
    }
  }, [])

  useEffect(() => {
    if (activeSound) {
      generatorRef.current?.play(activeSound, volume)
    } else {
      generatorRef.current?.stop()
    }
  }, [activeSound])

  useEffect(() => {
    generatorRef.current?.setVolume(volume)
  }, [volume])

  const toggleSound = (soundId: SoundType) => {
    if (activeSound === soundId) {
      setActiveSound(null)
    } else {
      setActiveSound(soundId)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute bottom-14 right-0 w-64 p-4 bg-card border border-border rounded-xl shadow-xl mb-2">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">Ambient Sounds</span>
            {activeSound ? (
              <VolumeX 
                className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => setActiveSound(null)}
              />
            ) : (
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          
          {/* Sound Options */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {SOUNDS.map(sound => {
              const Icon = sound.icon
              const isActive = activeSound === sound.id
              return (
                <button
                  key={sound.id}
                  onClick={() => toggleSound(sound.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
                    isActive
                      ? 'bg-primary/20 ring-1 ring-primary'
                      : 'bg-secondary hover:bg-secondary/80'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isActive ? sound.color : 'text-muted-foreground')} />
                  <span className="text-xs">{sound.name}</span>
                </button>
              )
            })}
          </div>
          
          {/* Volume Slider */}
          <div className="flex items-center gap-3">
            <VolumeX className="w-4 h-4 text-muted-foreground" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="flex-1 accent-primary"
            />
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all',
          activeSound
            ? 'bg-primary text-primary-foreground'
            : 'bg-card border border-border text-muted-foreground hover:text-foreground'
        )}
      >
        {activeSound ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <Music className="w-5 h-5" />
        )}
      </button>
    </div>
  )
}
