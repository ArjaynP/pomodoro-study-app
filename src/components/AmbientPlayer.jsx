import { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { SectionCard } from './SectionCard'

const createNoiseNode = (audioCtx) => {
  const bufferSize = audioCtx.sampleRate * 2
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1
  }

  const source = audioCtx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  return source
}

const createTrackNodes = (audioCtx, track, volumeValue) => {
  const master = audioCtx.createGain()
  master.gain.value = volumeValue

  const nodes = [master]

  if (track === 'rain') {
    const noise = createNoiseNode(audioCtx)
    const filter = audioCtx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 1600
    const gain = audioCtx.createGain()
    gain.gain.value = 0.5

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(master)

    noise.start()
    nodes.push(noise, filter, gain)
  }

  if (track === 'lofi') {
    const hum = audioCtx.createOscillator()
    hum.type = 'sine'
    hum.frequency.value = 180
    const humGain = audioCtx.createGain()
    humGain.gain.value = 0.08

    const crackle = createNoiseNode(audioCtx)
    const crackleFilter = audioCtx.createBiquadFilter()
    crackleFilter.type = 'highpass'
    crackleFilter.frequency.value = 2500
    const crackleGain = audioCtx.createGain()
    crackleGain.gain.value = 0.03

    hum.connect(humGain)
    humGain.connect(master)

    crackle.connect(crackleFilter)
    crackleFilter.connect(crackleGain)
    crackleGain.connect(master)

    hum.start()
    crackle.start()
    nodes.push(hum, humGain, crackle, crackleFilter, crackleGain)
  }

  if (track === 'cafe') {
    const chatter = createNoiseNode(audioCtx)
    const chatterFilter = audioCtx.createBiquadFilter()
    chatterFilter.type = 'bandpass'
    chatterFilter.frequency.value = 600
    const chatterGain = audioCtx.createGain()
    chatterGain.gain.value = 0.2

    const lowRumble = createNoiseNode(audioCtx)
    const rumbleFilter = audioCtx.createBiquadFilter()
    rumbleFilter.type = 'lowpass'
    rumbleFilter.frequency.value = 180
    const rumbleGain = audioCtx.createGain()
    rumbleGain.gain.value = 0.12

    chatter.connect(chatterFilter)
    chatterFilter.connect(chatterGain)
    chatterGain.connect(master)

    lowRumble.connect(rumbleFilter)
    rumbleFilter.connect(rumbleGain)
    rumbleGain.connect(master)

    chatter.start()
    lowRumble.start()
    nodes.push(chatter, chatterFilter, chatterGain, lowRumble, rumbleFilter, rumbleGain)
  }

  master.connect(audioCtx.destination)
  return { master, nodes }
}

export const AmbientPlayer = () => {
  const { state, dispatch } = useAppContext()
  const [playing, setPlaying] = useState(false)

  const audioCtxRef = useRef(null)
  const activeNodesRef = useRef([])

  useEffect(() => {
    if (!playing) {
      return undefined
    }

    const audioCtx =
      audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)()
    audioCtxRef.current = audioCtx

    audioCtx.resume()

    const { nodes } = createTrackNodes(
      audioCtx,
      state.settings.ambientTrack,
      state.settings.ambientVolume / 100,
    )

    activeNodesRef.current = nodes

    return () => {
      activeNodesRef.current.forEach((node) => {
        if (typeof node.stop === 'function') {
          try {
            node.stop()
          } catch {
            // no-op when node has already stopped
          }
        }
        if (typeof node.disconnect === 'function') {
          node.disconnect()
        }
      })
      activeNodesRef.current = []
    }
  }, [playing, state.settings.ambientTrack, state.settings.ambientVolume])

  return (
    <SectionCard title="Ambient Player" subtitle="Background textures for focus: rain, lo-fi, and cafe noise.">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="text-sm">
          Sound profile
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            value={state.settings.ambientTrack}
            onChange={(event) =>
              dispatch({
                type: 'UPDATE_SETTINGS',
                payload: { ambientTrack: event.target.value },
              })
            }
          >
            <option value="rain">Rain</option>
            <option value="lofi">Lo-fi</option>
            <option value="cafe">Cafe</option>
          </select>
        </label>

        <button
          className="rounded-lg bg-slate-900 px-4 py-2 text-white dark:bg-cyan-600"
          onClick={() => setPlaying((prev) => !prev)}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>

      <label className="mt-3 block text-sm">
        Volume: {state.settings.ambientVolume}%
        <input
          type="range"
          min={0}
          max={100}
          value={state.settings.ambientVolume}
          onChange={(event) =>
            dispatch({
              type: 'UPDATE_SETTINGS',
              payload: { ambientVolume: Number(event.target.value) },
            })
          }
          className="mt-1 w-full"
        />
      </label>
    </SectionCard>
  )
}
