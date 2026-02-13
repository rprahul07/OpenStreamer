export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  uri: string;
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
  // New academic fields
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
    coverUrl: 'https://picsum.photos/seed/track1/400/400',
    genre: 'Ambient',
  },
  {
    id: 'track_2',
    title: 'Neon Lights',
    artist: 'Synthwave Collective',
    album: 'Retro Future',
    duration: 210,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverUrl: 'https://picsum.photos/seed/track2/400/400',
    genre: 'Synthwave',
  },
  {
    id: 'track_3',
    title: 'Golden Hour',
    artist: 'Chill Masters',
    album: 'Sunset Sessions',
    duration: 195,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverUrl: 'https://picsum.photos/seed/track3/400/400',
    genre: 'Lo-Fi',
  },
  {
    id: 'track_4',
    title: 'Midnight Drive',
    artist: 'Night Riders',
    album: 'After Dark',
    duration: 240,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    coverUrl: 'https://picsum.photos/seed/track4/400/400',
    genre: 'Electronic',
  },
  {
    id: 'track_5',
    title: 'Ocean Breeze',
    artist: 'Nature Sounds',
    album: 'Calm Waters',
    duration: 170,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    coverUrl: 'https://picsum.photos/seed/track5/400/400',
    genre: 'Nature',
  },
  {
    id: 'track_6',
    title: 'Electric Pulse',
    artist: 'Bass Factory',
    album: 'High Voltage',
    duration: 225,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    coverUrl: 'https://picsum.photos/seed/track6/400/400',
    genre: 'EDM',
  },
  {
    id: 'track_7',
    title: 'Starlight Serenade',
    artist: 'Piano Dreams',
    album: 'Moonlit Melodies',
    duration: 200,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    coverUrl: 'https://picsum.photos/seed/track7/400/400',
    genre: 'Classical',
  },
  {
    id: 'track_8',
    title: 'Urban Flow',
    artist: 'Street Beats',
    album: 'City Vibes',
    duration: 215,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    coverUrl: 'https://picsum.photos/seed/track8/400/400',
    genre: 'Hip Hop',
  },
  {
    id: 'track_9',
    title: 'Tropical Paradise',
    artist: 'Island Grooves',
    album: 'Beach Party',
    duration: 190,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    coverUrl: 'https://picsum.photos/seed/track9/400/400',
    genre: 'Tropical',
  },
  {
    id: 'track_10',
    title: 'Crystal Clear',
    artist: 'Acoustic Sessions',
    album: 'Pure Sound',
    duration: 180,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    coverUrl: 'https://picsum.photos/seed/track10/400/400',
    genre: 'Acoustic',
  },
  {
    id: 'track_11',
    title: 'Velvet Night',
    artist: 'Jazz Ensemble',
    album: 'Late Night Jazz',
    duration: 260,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    coverUrl: 'https://picsum.photos/seed/track11/400/400',
    genre: 'Jazz',
  },
  {
    id: 'track_12',
    title: 'Thunder Road',
    artist: 'Rock Legends',
    album: 'Highway Anthems',
    duration: 235,
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    coverUrl: 'https://picsum.photos/seed/track12/400/400',
    genre: 'Rock',
  },
];

export const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'playlist_featured',
    name: 'Featured Mix',
    description: 'The best tracks hand-picked for you',
    coverUrl: 'https://picsum.photos/seed/featured/400/400',
    tracks: [DEFAULT_TRACKS[0], DEFAULT_TRACKS[1], DEFAULT_TRACKS[2], DEFAULT_TRACKS[3]],
    creatorId: 'system',
    creatorName: 'OpenStream',
    isPublic: true,
    createdAt: Date.now(),
  },
  {
    id: 'playlist_chill',
    name: 'Chill Vibes',
    description: 'Relax and unwind with these soothing tracks',
    coverUrl: 'https://picsum.photos/seed/chill/400/400',
    tracks: [DEFAULT_TRACKS[2], DEFAULT_TRACKS[4], DEFAULT_TRACKS[6], DEFAULT_TRACKS[9]],
    creatorId: 'system',
    creatorName: 'OpenStream',
    isPublic: true,
    createdAt: Date.now(),
  },
  {
    id: 'playlist_energy',
    name: 'High Energy',
    description: 'Get pumped with these energetic beats',
    coverUrl: 'https://picsum.photos/seed/energy/400/400',
    tracks: [DEFAULT_TRACKS[1], DEFAULT_TRACKS[3], DEFAULT_TRACKS[5], DEFAULT_TRACKS[7]],
    creatorId: 'system',
    creatorName: 'OpenStream',
    isPublic: true,
    createdAt: Date.now(),
  },
  {
    id: 'playlist_film',
    name: 'Film Soundtracks',
    description: 'Cinematic scores and movie music',
    coverUrl: 'https://picsum.photos/seed/film/400/400',
    tracks: [DEFAULT_TRACKS[6], DEFAULT_TRACKS[10], DEFAULT_TRACKS[0], DEFAULT_TRACKS[8]],
    creatorId: 'system',
    creatorName: 'OpenStream',
    isPublic: true,
    createdAt: Date.now(),
  },
  {
    id: 'playlist_night',
    name: 'Late Night',
    description: 'Perfect soundtrack for the late hours',
    coverUrl: 'https://picsum.photos/seed/night/400/400',
    tracks: [DEFAULT_TRACKS[3], DEFAULT_TRACKS[10], DEFAULT_TRACKS[6], DEFAULT_TRACKS[2]],
    creatorId: 'system',
    creatorName: 'OpenStream',
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
