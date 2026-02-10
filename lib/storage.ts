import AsyncStorage from '@react-native-async-storage/async-storage';
import { Playlist, Track, DEFAULT_PLAYLISTS } from './data';

const PLAYLISTS_KEY = '@openstream_playlists';
const FAVORITES_KEY = '@openstream_favorites';
const RECENT_KEY = '@openstream_recent';

export async function getPlaylists(): Promise<Playlist[]> {
  try {
    const data = await AsyncStorage.getItem(PLAYLISTS_KEY);
    const userPlaylists: Playlist[] = data ? JSON.parse(data) : [];
    return [...DEFAULT_PLAYLISTS, ...userPlaylists];
  } catch {
    return DEFAULT_PLAYLISTS;
  }
}

export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
  try {
    const data = await AsyncStorage.getItem(PLAYLISTS_KEY);
    const all: Playlist[] = data ? JSON.parse(data) : [];
    return all.filter(p => p.creatorId === userId);
  } catch {
    return [];
  }
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const data = await AsyncStorage.getItem(PLAYLISTS_KEY);
  const playlists: Playlist[] = data ? JSON.parse(data) : [];
  const idx = playlists.findIndex(p => p.id === playlist.id);
  if (idx >= 0) {
    playlists[idx] = playlist;
  } else {
    playlists.push(playlist);
  }
  await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}

export async function deletePlaylist(id: string): Promise<void> {
  const data = await AsyncStorage.getItem(PLAYLISTS_KEY);
  const playlists: Playlist[] = data ? JSON.parse(data) : [];
  await AsyncStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists.filter(p => p.id !== id)));
}

export async function getFavorites(userId: string): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(`${FAVORITES_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function toggleFavorite(userId: string, trackId: string): Promise<boolean> {
  const favs = await getFavorites(userId);
  const isFav = favs.includes(trackId);
  const updated = isFav ? favs.filter(id => id !== trackId) : [...favs, trackId];
  await AsyncStorage.setItem(`${FAVORITES_KEY}_${userId}`, JSON.stringify(updated));
  return !isFav;
}

export async function getRecentlyPlayed(userId: string): Promise<Track[]> {
  try {
    const data = await AsyncStorage.getItem(`${RECENT_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function addToRecentlyPlayed(userId: string, track: Track): Promise<void> {
  const recent = await getRecentlyPlayed(userId);
  const filtered = recent.filter(t => t.id !== track.id);
  const updated = [track, ...filtered].slice(0, 20);
  await AsyncStorage.setItem(`${RECENT_KEY}_${userId}`, JSON.stringify(updated));
}

export async function searchPlaylists(query: string): Promise<Playlist[]> {
  const all = await getPlaylists();
  const q = query.toLowerCase();
  return all.filter(p =>
    p.isPublic &&
    (p.name.toLowerCase().includes(q) ||
     p.description.toLowerCase().includes(q) ||
     p.creatorName.toLowerCase().includes(q))
  );
}
