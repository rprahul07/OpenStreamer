import React, { createContext, useContext, useState, useRef, useMemo, useCallback, ReactNode, useEffect } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, AudioPlayer } from 'expo-audio';
import { Track } from '@/lib/data';

type RepeatMode = 'off' | 'all' | 'one';

interface PlayerContextValue {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  position: number;
  duration: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  isLoading: boolean;
  playTrack: (track: Track, playlist?: Track[]) => void;
  playPlaylist: (tracks: Track[], startIndex?: number) => void;
  togglePlayPause: () => void;
  seekTo: (position: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [originalQueue, setOriginalQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isLoading, setIsLoading] = useState(false);

  const player = useAudioPlayer(currentTrack?.uri || null);
  const status = useAudioPlayerStatus(player);

  const isPlaying = status.playing;
  const position = Math.floor((status.currentTime || 0) * 1000);
  const duration = Math.floor((status.duration || 0) * 1000);

  const queueRef = useRef(queue);
  const currentIndexRef = useRef(currentIndex);
  const repeatModeRef = useRef(repeatMode);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    if (status.didJustFinish) {
      handleTrackEnd();
    }
  }, [status.didJustFinish]);

  function handleTrackEnd() {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    const rm = repeatModeRef.current;

    if (rm === 'one') {
      player.seekTo(0);
      player.play();
      return;
    }
    if (idx < q.length - 1) {
      const nextIdx = idx + 1;
      loadTrack(q[nextIdx], nextIdx);
    } else if (rm === 'all' && q.length > 0) {
      loadTrack(q[0], 0);
    }
  }

  function loadTrack(track: Track, index: number) {
    setIsLoading(true);
    setCurrentTrack(track);
    setCurrentIndex(index);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }

  useEffect(() => {
    if (currentTrack && player) {
      player.play();
    }
  }, [currentTrack?.id]);

  const playTrack = useCallback((track: Track, playlist?: Track[]) => {
    const newQueue = playlist || [track];
    const idx = newQueue.findIndex(t => t.id === track.id);
    setQueue(newQueue);
    setOriginalQueue(newQueue);
    loadTrack(track, idx >= 0 ? idx : 0);
  }, []);

  const playPlaylist = useCallback((tracks: Track[], startIndex = 0) => {
    if (tracks.length === 0) return;
    setQueue(tracks);
    setOriginalQueue(tracks);
    loadTrack(tracks[startIndex], startIndex);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, isPlaying]);

  const seekTo = useCallback((pos: number) => {
    if (player) {
      player.seekTo(pos / 1000);
    }
  }, [player]);

  const playNext = useCallback(() => {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    const rm = repeatModeRef.current;
    if (q.length === 0) return;
    let nextIdx = idx + 1;
    if (nextIdx >= q.length) {
      nextIdx = rm === 'all' ? 0 : q.length - 1;
      if (rm !== 'all') return;
    }
    loadTrack(q[nextIdx], nextIdx);
  }, []);

  const playPrevious = useCallback(() => {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    const rm = repeatModeRef.current;
    if (q.length === 0) return;
    if (position > 3000) {
      seekTo(0);
      return;
    }
    let prevIdx = idx - 1;
    if (prevIdx < 0) {
      prevIdx = rm === 'all' ? q.length - 1 : 0;
    }
    loadTrack(q[prevIdx], prevIdx);
  }, [position]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled(prev => {
      const q = queueRef.current;
      const idx = currentIndexRef.current;
      if (!prev) {
        const current = q[idx];
        const rest = q.filter((_, i) => i !== idx);
        for (let i = rest.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rest[i], rest[j]] = [rest[j], rest[i]];
        }
        const shuffled = [current, ...rest];
        setQueue(shuffled);
        setCurrentIndex(0);
        return true;
      } else {
        const current = q[idx];
        const origIdx = originalQueue.findIndex(t => t.id === current.id);
        setQueue([...originalQueue]);
        setCurrentIndex(origIdx >= 0 ? origIdx : 0);
        return false;
      }
    });
  }, [originalQueue]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
    setOriginalQueue(prev => [...prev, track]);
  }, []);

  const value = useMemo(() => ({
    currentTrack,
    queue,
    isPlaying,
    position,
    duration,
    isShuffled,
    repeatMode,
    isLoading,
    playTrack,
    playPlaylist,
    togglePlayPause,
    seekTo,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    addToQueue,
  }), [currentTrack, queue, isPlaying, position, duration, isShuffled, repeatMode, isLoading]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
