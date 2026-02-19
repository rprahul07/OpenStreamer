import React, { createContext, useContext, useState, useRef, useMemo, useCallback, ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Audio } from 'expo-av';
import { Track } from '@/lib/data';
import { useAudioSession } from '@/hooks/useAudioSession';

const isExpoGo = Constants.appOwnership === 'expo';
const NOW_PLAYING_CHANNEL_ID = 'now-playing';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const soundRef = useRef<Audio.Sound | null>(null);
  const positionRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const notificationsSetupDone = useRef(false);

  // Configure audio session for background playback
  useAudioSession();

  // Update position every second when playing
  useEffect(() => {
    if (isPlaying && soundRef.current) {
      intervalRef.current = setInterval(async () => {
        if (soundRef.current) {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded && status.positionMillis) {
            positionRef.current = status.positionMillis;
            setPosition(status.positionMillis);
          }
        }
      }, 1000) as unknown as NodeJS.Timeout;
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

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

  async function handleTrackEnd() {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    const rm = repeatModeRef.current;

    if (rm === 'one') {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
      return;
    }
    if (idx < q.length - 1) {
      const nextIdx = idx + 1;
      loadTrack(q[nextIdx], nextIdx);
    } else if (rm === 'all' && q.length > 0) {
      loadTrack(q[0], 0);
    } else {
      setIsPlaying(false);
    }
  }

  async function loadTrack(track: Track, index: number) {
    setIsLoading(true);
    
    // Unload previous sound
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    setCurrentTrack(track);
    setCurrentIndex(index);

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri || '' },
        {
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
        },
        (status) => {
          if (status.isLoaded) {
            setDuration(status.durationMillis || 0);
            if (status.didJustFinish) {
              handleTrackEnd();
            }
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);
      
      // Show notification when track starts playing
      await showPlayingNotification(track);
      
      // Set up media session for notification controls
      await sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis || 0);
          setDuration(status.durationMillis || 0);
          setIsPlaying(status.isPlaying || false);
          
          if (status.didJustFinish) {
            handleTrackEnd();
          }
        }
      });

      // Update media session metadata for notification controls
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.log('Error updating audio mode for media session:', error);
      }

    } catch (error) {
      console.error('Error loading track:', error);
      setIsLoading(false);
    }

    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }

  async function ensureNotificationSetup(Notifications: Awaited<typeof import('expo-notifications')>) {
    if (notificationsSetupDone.current) return true;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(NOW_PLAYING_CHANNEL_ID, {
        name: 'Now Playing',
        importance: Notifications.AndroidImportance.HIGH,
        sound: null,
      });
    }
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    notificationsSetupDone.current = finalStatus === 'granted';
    return finalStatus === 'granted';
  }

  async function showPlayingNotification(track: Track) {
    if (isExpoGo) return;
    try {
      const Notifications = await import('expo-notifications');
      const canShow = await ensureNotificationSetup(Notifications);
      if (!canShow) return;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Now Playing',
          body: `${track.title} - ${track.artist}`,
          data: { trackId: track.id },
          ...(Platform.OS === 'android' && { channelId: NOW_PLAYING_CHANNEL_ID }),
        },
        trigger: null,
        identifier: `playing-${track.id}`,
      });
    } catch (error) {
      // Notifications not available (e.g. dev build without setup)
    }
  }

  async function clearPlayingNotification() {
    if (isExpoGo) return;
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      // Notifications not available
    }
  }

  const playTrack = useCallback(async (track: Track, playlist?: Track[]) => {
    const newQueue = playlist || [track];
    const idx = newQueue.findIndex(t => t.id === track.id);
    setQueue(newQueue);
    setOriginalQueue(newQueue);
    await loadTrack(track, idx >= 0 ? idx : 0);
  }, []);

  const playPlaylist = useCallback(async (tracks: Track[], startIndex = 0) => {
    if (tracks.length === 0) return;
    setQueue(tracks);
    setOriginalQueue(tracks);
    await loadTrack(tracks[startIndex], startIndex);
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!soundRef.current) return;
    
    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
          
          // Clear playing notification when paused
          await clearPlayingNotification();
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
          
          // Show notification when resumed
          if (currentTrack) {
            await showPlayingNotification(currentTrack);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  }, [currentTrack]);

  const seekTo = useCallback(async (pos: number) => {
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(pos);
        setPosition(pos);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  }, []);

  const playNext = useCallback(async () => {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    const rm = repeatModeRef.current;
    if (q.length === 0) return;
    let nextIdx = idx + 1;
    if (nextIdx >= q.length) {
      nextIdx = rm === 'all' ? 0 : q.length - 1;
      if (rm !== 'all') return;
    }
    await loadTrack(q[nextIdx], nextIdx);
  }, []);

  const playPrevious = useCallback(async () => {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    const rm = repeatModeRef.current;
    if (q.length === 0) return;
    if (positionRef.current > 3000) {
      await seekTo(0);
      return;
    }
    let prevIdx = idx - 1;
    if (prevIdx < 0) {
      prevIdx = rm === 'all' ? q.length - 1 : 0;
    }
    await loadTrack(q[prevIdx], prevIdx);
  }, [seekTo]);

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
