export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  uri?: string;
  file_url?: string;
  coverUrl: string;
  genre: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
  creatorId: string;
  creatorName: string;
  isPublic: boolean;
  createdAt: number;
  subject?: string;
  department?: string;
  academicYear?: number;
  classSection?: string;
  visibility?: 'PUBLIC' | 'CLASS';
  status?: 'DRAFT' | 'PUBLISHED';
}

export const DEFAULT_TRACKS: Track[] = [
  {
    id: 'track_1',
    title: 'Ethereal Dreams',
    artist: 'Ambient Waves',
    album: 'Celestial Journey',
    duration: 185,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop',
    genre: 'Ambient',
  },
  {
    id: 'track_2',
    title: 'Neon Lights',
    artist: 'Synthwave Collective',
    album: 'Retro Future',
    duration: 210,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    genre: 'Synthwave',
  },
  {
    id: 'track_3',
    title: 'Golden Hour',
    artist: 'Chill Masters',
    album: 'Sunset Sessions',
    duration: 195,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop',
    genre: 'Lo-Fi',
  },
  {
    id: 'track_4',
    title: 'Midnight Drive',
    artist: 'Night Riders',
    album: 'After Dark',
    duration: 240,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
    genre: 'Electronic',
  },
  {
    id: 'track_5',
    title: 'Ocean Breeze',
    artist: 'Nature Sounds',
    album: 'Calm Waters',
    duration: 170,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=400&h=400&fit=crop',
    genre: 'Nature',
  },
  {
    id: 'track_6',
    title: 'Electric Pulse',
    artist: 'Bass Factory',
    album: 'High Voltage',
    duration: 225,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop',
    genre: 'EDM',
  },
  {
    id: 'track_7',
    title: 'Starlight Serenade',
    artist: 'Piano Dreams',
    album: 'Moonlit Melodies',
    duration: 200,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=400&fit=crop',
    genre: 'Classical',
  },
  {
    id: 'track_8',
    title: 'Urban Flow',
    artist: 'Street Beats',
    album: 'City Vibes',
    duration: 215,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=400&fit=crop',
    genre: 'Hip Hop',
  },
  {
    id: 'track_9',
    title: 'Tropical Paradise',
    artist: 'Island Grooves',
    album: 'Beach Party',
    duration: 190,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop',
    genre: 'Tropical',
  },
  {
    id: 'track_10',
    title: 'Crystal Clear',
    artist: 'Acoustic Sessions',
    album: 'Pure Sound',
    duration: 180,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=400&fit=crop',
    genre: 'Acoustic',
  },
  {
    id: 'track_11',
    title: 'Velvet Night',
    artist: 'Jazz Ensemble',
    album: 'Late Night Jazz',
    duration: 260,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=400&fit=crop',
    genre: 'Jazz',
  },
  {
    id: 'track_12',
    title: 'Thunder Road',
    artist: 'Rock Legends',
    album: 'Highway Anthems',
    duration: 235,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop',
    genre: 'Rock',
  },
  {
    id: 'track_13',
    title: 'Cosmic Drift',
    artist: 'Space Voyagers',
    album: 'Into the Void',
    duration: 222,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=400&fit=crop',
    genre: 'Ambient',
  },
  {
    id: 'track_14',
    title: 'Rainy Afternoon',
    artist: 'Lo-Fi Collective',
    album: 'Coffee & Rain',
    duration: 196,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1428592953211-077101b2021b?w=400&h=400&fit=crop',
    genre: 'Lo-Fi',
  },
  {
    id: 'track_15',
    title: 'Fire Dance',
    artist: 'Tribal Beats',
    album: 'Ancient Rhythms',
    duration: 218,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1504151932400-72d4384f04b3?w=400&h=400&fit=crop',
    genre: 'World',
  },
];

export const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'playlist_featured',
    name: '🎵 Featured Mix',
    description: 'Hand-picked tracks curated for the best listening experience',
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    tracks: [DEFAULT_TRACKS[0], DEFAULT_TRACKS[1], DEFAULT_TRACKS[2], DEFAULT_TRACKS[3]],
    creatorId: 'system',
    creatorName: 'StreamCurator',
    isPublic: true,
    createdAt: Date.now(),
  },
  {
    id: 'playlist_chill',
    name: '☁️ Chill Vibes',
    description: 'Relax and unwind with these soothing, mellow tracks',
    coverUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop',
    tracks: [DEFAULT_TRACKS[2], DEFAULT_TRACKS[4], DEFAULT_TRACKS[6], DEFAULT_TRACKS[9], DEFAULT_TRACKS[13]],
    creatorId: 'system',
    creatorName: 'StreamCurator',
    isPublic: true,
    createdAt: Date.now(),
  },
  {
    id: 'playlist_energy',
    name: '⚡ High Energy',
    description: 'Get pumped up and power through your day',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    tracks: [DEFAULT_TRACKS[1], DEFAULT_TRACKS[3], DEFAULT_TRACKS[5], DEFAULT_TRACKS[7], DEFAULT_TRACKS[14]],
    creatorId: 'system',
    creatorName: 'StreamCurator',
    isPublic: true,
    createdAt: Date.now(),
  },
  {
    id: 'playlist_night',
    name: '🌙 Late Night',
    description: 'Perfect soundtrack for the quiet late-night hours',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
    tracks: [DEFAULT_TRACKS[3], DEFAULT_TRACKS[6], DEFAULT_TRACKS[10], DEFAULT_TRACKS[1]],
    creatorId: 'system',
    creatorName: 'StreamCurator',
    isPublic: true,
    createdAt: Date.now(),
  },
  {
    id: 'playlist_rock',
    name: '🎸 Rock Classics',
    description: 'Timeless rock anthems to fuel your spirit',
    coverUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop',
    tracks: [DEFAULT_TRACKS[11], DEFAULT_TRACKS[5], DEFAULT_TRACKS[7], DEFAULT_TRACKS[14]],
    creatorId: 'system',
    creatorName: 'StreamCurator',
    isPublic: true,
    createdAt: Date.now(),
  },
  {
    id: 'playlist_piano',
    name: '🎹 Piano & Acoustic',
    description: 'Beautiful acoustic and classical compositions',
    coverUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=400&fit=crop',
    tracks: [DEFAULT_TRACKS[6], DEFAULT_TRACKS[9], DEFAULT_TRACKS[13]],
    creatorId: 'system',
    creatorName: 'StreamCurator',
    isPublic: true,
    createdAt: Date.now(),
  },
  {
    id: 'playlist_nature',
    name: '🌊 Nature & Calm',
    description: 'Sounds of nature to bring peace and focus',
    coverUrl: 'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=400&h=400&fit=crop',
    tracks: [DEFAULT_TRACKS[4], DEFAULT_TRACKS[8], DEFAULT_TRACKS[9], DEFAULT_TRACKS[13]],
    creatorId: 'system',
    creatorName: 'StreamCurator',
    isPublic: true,
    createdAt: Date.now(),
  },
  {
    id: 'playlist_city',
    name: '🌃 City Nights',
    description: 'Urban beats and electronic vibes for the city soul',
    coverUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=400&fit=crop',
    tracks: [DEFAULT_TRACKS[1], DEFAULT_TRACKS[3], DEFAULT_TRACKS[7], DEFAULT_TRACKS[12]],
    creatorId: 'system',
    creatorName: 'StreamCurator',
    isPublic: true,
    createdAt: Date.now(),
  },
];

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
