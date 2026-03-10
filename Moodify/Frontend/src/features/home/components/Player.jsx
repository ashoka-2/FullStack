import React, { useRef, useState, useEffect } from 'react'
import { useSong } from '../hooks/useSong'
import 'remixicon/fonts/remixicon.css' // Import this if using npm package
import './player.scss'

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]

const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

const Player = () => {
    const { song } = useSong()

    const audioRef = useRef(null)
    const progressRef = useRef(null)

    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [speed, setSpeed] = useState(1)
    const [volume, setVolume] = useState(1)
    const [showSpeed, setShowSpeed] = useState(false)
    const [isMuted, setIsMuted] = useState(false)

    // Auto-play logic
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !song?.url) return;

        const handleAutoplay = async () => {
            try {
                audio.pause();
                audio.currentTime = 0;
                audio.src = song.url;
                audio.load();
                await audio.play();
                setIsPlaying(true);
            } catch (err) {
                console.warn("Playback interrupted or blocked:", err);
                setIsPlaying(false);
            }
        };

        handleAutoplay();

        return () => {
            audio.pause();
            audio.src = "";
        };
    }, [song?.url]);

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return
        if (isPlaying) {
            audio.pause()
            setIsPlaying(false)
        } else {
            audio.play().then(() => setIsPlaying(true))
        }
    }

    const skip = (secs) => {
        const audio = audioRef.current
        if (!audio) return
        audio.currentTime = Math.min(Math.max(audio.currentTime + secs, 0), duration)
    }

    const handleTimeUpdate = () => setCurrentTime(audioRef.current.currentTime)
    const handleLoadedMetadata = () => setDuration(audioRef.current.duration)

    const handleProgressClick = (e) => {
        const bar = progressRef.current
        const rect = bar.getBoundingClientRect()
        const ratio = (e.clientX - rect.left) / rect.width
        const newTime = ratio * duration
        audioRef.current.currentTime = newTime
        setCurrentTime(newTime)
    }

    const handleSpeedChange = (s) => {
        setSpeed(s)
        audioRef.current.playbackRate = s
        setShowSpeed(false)
    }

    const handleVolume = (e) => {
        const val = parseFloat(e.target.value)
        setVolume(val)
        audioRef.current.volume = val
        setIsMuted(val === 0)
    }

    const toggleMute = () => {
        const audio = audioRef.current
        if (isMuted) {
            audio.volume = volume || 0.5
            setIsMuted(false)
        } else {
            audio.volume = 0
            setIsMuted(true)
        }
    }

    const handleSongEnd = () => {
        setIsPlaying(false)
        setCurrentTime(0)
    }

    const progress = duration ? (currentTime / duration) * 100 : 0

    if (!song) return null

    return (
        <div className="player">
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleSongEnd}
            />

            {/* Poster + Info */}
            <div className="player__info">
                <div className="player__poster-wrapper">
                    <img className="player__poster" src={song.posterUrl} alt={song.title} />
                    {isPlaying && <div className="playing-indicator"></div>}
                </div>
                <div className="player__meta">
                    <p className="player__title">{song.title}</p>
                    <span className="player__mood">{song.mood}</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="player__progress-wrap">
                <span className="player__time">{formatTime(currentTime)}</span>
                <div className="player__progress" ref={progressRef} onClick={handleProgressClick}>
                    <div className="player__progress-fill" style={{ width: `${progress}%` }} />
                    <div className="player__progress-thumb" style={{ left: `${progress}%` }} />
                </div>
                <span className="player__time">{formatTime(duration)}</span>
            </div>

            {/* Controls */}
            <div className="player__controls">
                
                {/* Speed picker */}
                <div className="player__speed-wrap">
                    <button className="player__btn player__btn--speed" onClick={() => setShowSpeed(!showSpeed)}>
                        {speed}×
                    </button>
                    {showSpeed && (
                        <div className="player__speed-menu">
                            {SPEED_OPTIONS.map((s) => (
                                <button
                                    key={s}
                                    className={`player__speed-option ${s === speed ? 'active' : ''}`}
                                    onClick={() => handleSpeedChange(s)}
                                >
                                    {s}×
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Backward 5s */}
                <button className="player__btn player__btn--skip" onClick={() => skip(-5)} title="Back 5s">
                    <i className="ri-rewind-fill"></i>
                </button>

                {/* Play / Pause */}
                <button className="player__btn player__btn--play" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                    <i className={isPlaying ? "ri-pause-fill" : "ri-play-fill"}></i>
                </button>

                {/* Forward 5s */}
                <button className="player__btn player__btn--skip" onClick={() => skip(5)} title="Forward 5s">
                    <i className="ri-speed-fill"></i>
                </button>

                {/* Volume */}
                <div className="player__volume">
                    <button className="player__btn player__btn--vol" onClick={toggleMute} title="Mute">
                        <i className={isMuted || volume === 0 ? "ri-volume-mute-fill" : "ri-volume-up-fill"}></i>
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolume}
                        className="player__volume-slider"
                    />
                </div>
            </div>
        </div>
    )
}

export default Player