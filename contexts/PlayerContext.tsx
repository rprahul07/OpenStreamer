import React, { createContext, useContext, useState, useRef, useMemo, useCallback, ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Audio } from 'expo-av';
import { Track } from '@/lib/data';
import { useAudioSession } from '@/hooks/useAudioSession';

// ─── Expo Go detection ────────────────────────────────────────────────────────
// expo-notifications push/remote features were removed from Expo Go in SDK 53.
// We guard every notification call behind this flag so the module is never
// imported (and its push-token auto-registration never fires) in Expo Go.
const isExpoGo = Constants.appOwnership === 'expo';

// ─── Notification constants ───────────────────────────────────────────────────
const ACTION_PLAY_PAUSE = 'PLAYER_PLAY_PAUSE';
const ACTION_NEXT = 'PLAYER_NEXT';
const ACTION_PREV = 'PLAYER_PREV';
const ACTION_STOP = 'PLAYER_STOP';
const MEDIA_CATEGORY_ID = 'MEDIA_CONTROLS';
const NOW_PLAYING_ID = 'now-playing-persistent';
const NOW_PLAYING_CH = 'now-playing';

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Notification helpers (only called when !isExpoGo) ───────────────────────

async function getNotifications() {
  // Dynamic import so the module (and its push-token side-effects) only loads
  // in environments where it is supported (dev builds, production APK).
  return import('expo-notifications');
}

async function setupNotifications(): Promise<boolean> {
  if (isExpoGo) return false;
  try {
    const N = await getNotifications();

    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldShowBanner: false,
        shouldShowList: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync(NOW_PLAYING_CH, {
        name: 'Now Playing',
        description: 'Music playback controls',
        importance: N.AndroidImportance.LOW,
        sound: null,
        enableVibrate: false,
        showBadge: false,
        lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
      });
    }

    // Register interactive category with media control action buttons
    await N.setNotificationCategoryAsync(MEDIA_CATEGORY_ID, [
      {
        identifier: ACTION_PREV,
        buttonTitle: '⏮',
        options: { opensAppToForeground: false },
      },
      {
        identifier: ACTION_PLAY_PAUSE,
        buttonTitle: '⏯',
        options: { opensAppToForeground: false },
      },
      {
        identifier: ACTION_NEXT,
        buttonTitle: '⏭',
        options: { opensAppToForeground: false },
      },
      {
        identifier: ACTION_STOP,
        buttonTitle: '✕',
        options: { opensAppToForeground: false, isDestructive: true },
      },
    ]);

    const { status: existing } = await N.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await N.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (err) {
    console.log('[MediaNotification] setup error:', err);
    return false;
  }
}

async function showOrUpdateMediaNotification(track: Track, isPlaying: boolean) {
  if (isExpoGo) return;
  try {
    const N = await getNotifications();
    const statusText = isPlaying ? '▶ Playing' : '⏸ Paused';

    await N.scheduleNotificationAsync({
      identifier: NOW_PLAYING_ID,
      content: {
        title: track.title,
        body: `${track.artist}${track.album ? ' · ' + track.album : ''}`,
        subtitle: statusText,
        data: { type: 'media_player', trackId: track.id },
        categoryIdentifier: MEDIA_CATEGORY_ID,
        sticky: true,
        autoDismiss: false,
        sound: false,
        ...(Platform.OS === 'android' && {
          vibrate: [],
          priority: 'low',
          color: '#8B5CF6',
        }),
      },
      trigger: Platform.OS === 'android' ? { channelId: NOW_PLAYING_CH } : null,
    });
  } catch (err) {
    console.log('[MediaNotification] show/update error:', err);
  }
}

async function dismissMediaNotification() {
  if (isExpoGo) return;
  try {
    const N = await getNotifications();
    await N.dismissNotificationAsync(NOW_PLAYING_ID);
  } catch (_) { }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

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
  const notificationReady = useRef(false);
  const currentTrackRef = useRef<Track | null>(null);
  const isPlayingRef = useRef(false);
  const queueRef = useRef(queue);
  const currentIndexRef = useRef(currentIndex);
  const repeatModeRef = useRef(repeatMode);

  // Keep refs in sync with state
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);

  // Configure audio session for background playback
  useAudioSession();

  // ── Notification setup (skipped in Expo Go) ──────────────────────────────
  useEffect(() => {
    if (isExpoGo) return; // Skip entirely in Expo Go
    setupNotifications().then((granted) => {
      notificationReady.current = granted;
    });
    return () => { dismissMediaNotification(); };
  }, []);

  // ── Notification action listener (skipped in Expo Go) ───────────────────
  useEffect(() => {
    if (isExpoGo) return;

    let subscription: { remove: () => void } | null = null;

    getNotifications().then((N) => {
      subscription = N.addNotificationResponseReceivedListener(async (response) => {
        const actionId = response.actionIdentifier;
        const data = response.notification.request.content.data as any;
        if (data?.type !== 'media_player') return;

        switch (actionId) {
          case ACTION_PLAY_PAUSE: await handleTogglePlayPause(); break;
          case ACTION_NEXT: await handlePlayNext(); break;
          case ACTION_PREV: await handlePlayPrevious(); break;
          case ACTION_STOP: await handleStop(); break;
        }
      });
    });

    return () => { subscription?.remove(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Position polling ──────────────────────────────────────────────────────
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
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  // ── Internal control functions ────────────────────────────────────────────

  async function handleStop() {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
    dismissMediaNotification();
  }

  async function handleTogglePlayPause() {
    if (!soundRef.current) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        isPlayingRef.current = false;
        if (currentTrackRef.current && notificationReady.current)
          await showOrUpdateMediaNotification(currentTrackRef.current, false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        isPlayingRef.current = true;
        if (currentTrackRef.current && notificationReady.current)
          await showOrUpdateMediaNotification(currentTrackRef.current, true);
      }
    } catch (err) {
      console.error('[Player] togglePlayPause error:', err);
    }
  }

  async function handleTrackEnd() {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    const rm = repeatModeRef.current;

    if (rm === 'one') {
      if (soundRef.current) await soundRef.current.replayAsync();
      return;
    }
    if (idx < q.length - 1) {
      loadTrack(q[idx + 1], idx + 1);
    } else if (rm === 'all' && q.length > 0) {
      loadTrack(q[0], 0);
    } else {
      setIsPlaying(false);
      dismissMediaNotification();
    }
  }

  async function handlePlayNext() {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    const rm = repeatModeRef.current;
    if (!q.length) return;
    let nextIdx = idx + 1;
    if (nextIdx >= q.length) {
      if (rm !== 'all') return;
      nextIdx = 0;
    }
    await loadTrack(q[nextIdx], nextIdx);
  }

  async function handlePlayPrevious() {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    const rm = repeatModeRef.current;
    if (!q.length) return;
    if (positionRef.current > 3000) {
      if (soundRef.current) { await soundRef.current.setPositionAsync(0); setPosition(0); }
      return;
    }
    let prevIdx = idx - 1;
    if (prevIdx < 0) prevIdx = rm === 'all' ? q.length - 1 : 0;
    await loadTrack(q[prevIdx], prevIdx);
  }

  // ── Core track loader ─────────────────────────────────────────────────────

  async function loadTrack(track: Track, index: number) {
    setIsLoading(true);

    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    setCurrentTrack(track);
    currentTrackRef.current = track;
    setCurrentIndex(index);
    setPosition(0);
    positionRef.current = 0;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri || '' },
        { shouldPlay: true, isLooping: false, volume: 1.0 },
        (status) => {
          if (status.isLoaded) {
            setDuration(status.durationMillis || 0);
            if (status.didJustFinish) handleTrackEnd();
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);
      isPlayingRef.current = true;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis || 0);
          setDuration(status.durationMillis || 0);
          setIsPlaying(status.isPlaying || false);
          isPlayingRef.current = status.isPlaying || false;
          if (status.didJustFinish) handleTrackEnd();
        }
      });

      // Show media notification (only in dev build / production)
      if (notificationReady.current) {
        await showOrUpdateMediaNotification(track, true);
      }
    } catch (err) {
      console.error('[Player] loadTrack error:', err);
    }

    setTimeout(() => setIsLoading(false), 500);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  const playTrack = useCallback(async (track: Track, playlist?: Track[]) => {
    const newQueue = playlist || [track];
    const idx = newQueue.findIndex(t => t.id === track.id);
    setQueue(newQueue);
    setOriginalQueue(newQueue);
    await loadTrack(track, idx >= 0 ? idx : 0);
  }, []);

  const playPlaylist = useCallback(async (tracks: Track[], startIndex = 0) => {
    if (!tracks.length) return;
    setQueue(tracks);
    setOriginalQueue(tracks);
    await loadTrack(tracks[startIndex], startIndex);
  }, []);

  const togglePlayPause = useCallback(async () => {
    await handleTogglePlayPause();
  }, []);

  const seekTo = useCallback(async (pos: number) => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(pos);
      setPosition(pos);
      positionRef.current = pos;
    } catch (err) {
      console.error('[Player] seekTo error:', err);
    }
  }, []);

  const playNext = useCallback(async () => { await handlePlayNext(); }, []);
  const playPrevious = useCallback(async () => { await handlePlayPrevious(); }, []);

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
        setQueue([current, ...rest]);
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
    setRepeatMode(prev => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off');
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueue(prev => [...prev, track]);
    setOriginalQueue(prev => [...prev, track]);
  }, []);

  const value = useMemo(() => ({
    currentTrack, queue, isPlaying, position, duration,
    isShuffled, repeatMode, isLoading,
    playTrack, playPlaylist, togglePlayPause, seekTo,
    playNext, playPrevious, toggleShuffle, toggleRepeat, addToQueue,
  }), [currentTrack, queue, isPlaying, position, duration, isShuffled, repeatMode, isLoading]);

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
