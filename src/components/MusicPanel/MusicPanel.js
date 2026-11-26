import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getImagePath } from '../../utils/assetPaths';
import './MusicPanel.css';

const tracks = [
  {
    title: "#440 - Pieter Levels: Programming, Viral Al Startups, and Digital Nomad Life",
    album: "Lex Fridman Podcast",
    art: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts115/v4/3e/e3/9c/3ee39c89-de08-47a6-7f3d-3849cef6d255/mza_16657851278549137484.png/600x600bb.webp",
    // audio: "/audio/podcasts/lex_fridman_440_ai_pieter_levels.mp3"
    audio: "https://content.blubrry.com/takeituneasy/lex_ai_pieter_levels.mp3"
  },
  {
    title: "#438 – Elon Musk: Neuralink and the Future of Humanity",
    album: "Lex Fridman Podcast",
    art: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts115/v4/3e/e3/9c/3ee39c89-de08-47a6-7f3d-3849cef6d255/mza_16657851278549137484.png/600x600bb.webp",
    audio: "https://content.blubrry.com/takeituneasy/lex_ai_elon_musk_and_neuralink_team.mp3"
  },
  {
    title: "SEP 5 - S01E77 - The Road to Autonomous Intelligence with Andrej Karpathy",
    album: "No Priors Podcast",
    art: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts122/v4/a6/4d/9c/a64d9c5a-2ca4-6a1b-3ceb-424efe00d022/mza_1247466525586262525.jpg/600x600bb.webp",
    audio: "https://dcs-spotify.megaphone.fm/PDP5840775995.mp3?key=ddb7f40d09aa7f54678599bee8fe8735&request_event_id=db0b2f9d-9700-4f1d-9a84-163472e7824c&timetoken=1726938704_F98B8D0954A9F5A6E4C44CD6BC70A492"
  },
  // Add more tracks here
];

const getRandomIndex = (max) => Math.floor(Math.random() * max);

export function MusicPanel({ volume }) {
    const [currentTrackIndex, setCurrentTrackIndex] = useState(() => getRandomIndex(tracks.length));
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(null);
    const lastTapTimeRef = useRef(0);
    const progressBarRef = useRef(null);
    const currentTimeRef = useRef(0);

    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;
        const updateProgress = () => {
            currentTimeRef.current = audio.currentTime;
            setCurrentTime(audio.currentTime);
        };
        const updateDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        const endPlayback = () => setIsPlaying(false);
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', endPlayback);
        return () => {
            audio.pause();
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', endPlayback);
            audio.removeAttribute('src');
            audio.load();
            audioRef.current = null;
        };
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        audio.src = tracks[currentTrackIndex].audio;
        currentTimeRef.current = 0;
        setCurrentTime(0);
        setDuration(0);
    }, [currentTrackIndex]);

    useEffect(() => {
        let cancelled = false;
        if (isPlaying) {
            audioRef.current.play().catch(() => {
                if (!cancelled) setIsPlaying(false);
            });
        } else {
            audioRef.current.pause();
        }
        return () => { cancelled = true; };
    }, [currentTrackIndex, isPlaying]);

    useEffect(() => {
        audioRef.current.volume = Math.max(0, Math.min(1, volume / 100));
    }, [volume]);

    const togglePlayPause = useCallback(() => {
        setIsPlaying(prevIsPlaying => !prevIsPlaying);
    }, []);

    const handlePrevious = useCallback(() => {
        const now = Date.now();
        if (now - lastTapTimeRef.current < 1000) {
            setCurrentTrackIndex((prevIndex) => 
                prevIndex === 0 ? tracks.length - 1 : prevIndex - 1
            );
        } else {
            audioRef.current.currentTime = 0;
        }
        lastTapTimeRef.current = now;
    }, []);

    const handleNext = useCallback(() => {
        setCurrentTrackIndex((prevIndex) => 
            prevIndex === tracks.length - 1 ? 0 : prevIndex + 1
        );
    }, []);

    const formatTime = (time) => {
        const safeTime = Number.isFinite(time) ? Math.max(0, time) : 0;
        const minutes = Math.floor(safeTime / 60);
        const seconds = Math.floor(safeTime % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleProgressBarClick = useCallback((event) => {
        const progressBar = progressBarRef.current;
        if (!progressBar || progressBar.offsetWidth <= 0 || !Number.isFinite(duration) || duration <= 0) return;
        const clickPosition = (event.clientX - progressBar.getBoundingClientRect().left) / progressBar.offsetWidth;
        audioRef.current.currentTime = Math.max(0, Math.min(1, clickPosition)) * duration;
    }, [duration]);
    const handleProgressBarDrag = useCallback((event) => {
        if (event.buttons === 1) {
            handleProgressBarClick(event);
        }
    }, [handleProgressBarClick]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.target.closest?.('input, textarea, [contenteditable="true"]') || event.repeat) return;
            if (event.key === ' ') {
                event.preventDefault();
                togglePlayPause();
            } else if (event.shiftKey) {
                switch (event.key) {
                    case '>':
                        event.preventDefault();
                        handleNext();
                        break;
                    case '<':
                        event.preventDefault();
                        handlePrevious();
                        break;
                    default:
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [togglePlayPause, handleNext, handlePrevious]);

    return (
        <div className="musicPanel">
            <div className="albumArt">
                <img alt="" src={tracks[currentTrackIndex].art}/>
            </div>
            <div className="musicText">
                <div className="title">{tracks[currentTrackIndex].title}</div>
                <img className="sourceIcon" src={getImagePath("icon-music-bluetooth.svg")} alt="Bluetooth" />
                <div className="albumTitle">{tracks[currentTrackIndex].album}</div>
            </div>
            <div className="musicProgressBar">
                <div 
                    className="progressBackground"
                    ref={progressBarRef}
                    onClick={handleProgressBarClick}
                    onMouseMove={handleProgressBarDrag}
                >
                    <div 
                        className="progressForeground" 
                        style={{width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0}%`}}
                    >
                        <div className="progressIndicator ctaBtn"></div>
                    </div>
                </div>
                <div className="timeCode">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>
            <div className="musicBtnBar">
                <button className="musicBtn" onClick={handlePrevious}>
                    <img className="musicIcon ctaBtn" src={getImagePath("icon-music-previous.svg")} alt="Previous Track" />
                </button>
                <button className="musicBtn" onClick={togglePlayPause}>
                    <img 
                        className="musicIcon ctaBtn" 
                        src={isPlaying ? getImagePath("icon-music-pause.svg") : getImagePath("icon-music-play.svg")} 
                        alt="Play & Pause" 
                    />
                </button>
                <button className="musicBtn" onClick={handleNext}>
                    <img className="musicIcon ctaBtn" src={getImagePath("icon-music-next.svg")} alt="Next Track" />
                </button>
                <button className="musicBtn">
                    <img className="musicIcon ctaBtn" src={getImagePath("icon-settings.svg")} alt="Settings" />
                </button>
                <button className="musicBtn">
                    <img className="musicIcon ctaBtn" src={getImagePath("icon-search.svg")} alt="Search" />
                </button>
            </div>
        </div>
    );
}


