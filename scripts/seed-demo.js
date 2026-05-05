/**
 * Seed script — cleans junk test data and inserts clean demo playlists + tracks
 * Run once: node scripts/seed-demo.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ─── Demo data ─────────────────────────────────────────────────────────────
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

const TRACKS = [
  { title: 'Ethereal Dreams',       artist: 'Ambient Waves',        album: 'Celestial Journey',   file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',  duration: '185' },
  { title: 'Neon Lights',           artist: 'Synthwave Collective',  album: 'Retro Future',        file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',  duration: '210' },
  { title: 'Golden Hour',           artist: 'Chill Masters',         album: 'Sunset Sessions',     file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',  duration: '195' },
  { title: 'Midnight Drive',        artist: 'Night Riders',          album: 'After Dark',          file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',  duration: '240' },
  { title: 'Ocean Breeze',          artist: 'Nature Sounds',         album: 'Calm Waters',         file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',  duration: '170' },
  { title: 'Electric Pulse',        artist: 'Bass Factory',          album: 'High Voltage',        file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',  duration: '225' },
  { title: 'Starlight Serenade',    artist: 'Piano Dreams',          album: 'Moonlit Melodies',    file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',  duration: '200' },
  { title: 'Urban Flow',            artist: 'Street Beats',          album: 'City Vibes',          file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',  duration: '215' },
  { title: 'Tropical Paradise',     artist: 'Island Grooves',        album: 'Beach Party',         file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',  duration: '190' },
  { title: 'Crystal Clear',         artist: 'Acoustic Sessions',     album: 'Pure Sound',          file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', duration: '180' },
  { title: 'Velvet Night',          artist: 'Jazz Ensemble',         album: 'Late Night Jazz',     file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', duration: '260' },
  { title: 'Thunder Road',          artist: 'Rock Legends',          album: 'Highway Anthems',     file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', duration: '235' },
  { title: 'Cosmic Drift',          artist: 'Space Voyagers',        album: 'Into the Void',       file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', duration: '222' },
  { title: 'Desert Wind',           artist: 'Nomad Sounds',          album: 'Endless Horizon',     file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', duration: '208' },
  { title: 'Rainy Afternoon',       artist: 'Lo-Fi Collective',      album: 'Coffee & Rain',       file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', duration: '196' },
  { title: 'Fire Dance',            artist: 'Tribal Beats',          album: 'Ancient Rhythms',     file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', duration: '218' },
  { title: 'Whispering Pines',      artist: 'Forest Music',          album: 'Into the Woods',      file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',  duration: '183' },
  { title: 'Deep Blue',             artist: 'Ocean Collective',      album: 'Underwater Dreams',   file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',  duration: '228' },
];

const PLAYLISTS = [
  {
    name: '🎵 Featured Mix',
    description: 'Hand-picked tracks curated for the best listening experience',
    cover_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
    track_indices: [0, 1, 2, 3],
  },
  {
    name: '☁️ Chill Vibes',
    description: 'Relax and unwind with these soothing, mellow tracks',
    cover_url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop',
    track_indices: [2, 4, 6, 9, 14],
  },
  {
    name: '⚡ High Energy',
    description: 'Get pumped up and power through your day',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    track_indices: [1, 3, 5, 7, 15],
  },
  {
    name: '🌙 Late Night',
    description: 'Perfect soundtrack for the quiet late-night hours',
    cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
    track_indices: [3, 6, 10, 1, 17],
  },
  {
    name: '🎸 Rock Classics',
    description: 'Timeless rock anthems to fuel your spirit',
    cover_url: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop',
    track_indices: [11, 5, 7, 15],
  },
  {
    name: '🎹 Piano & Acoustic',
    description: 'Beautiful acoustic and classical compositions',
    cover_url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=400&fit=crop',
    track_indices: [6, 9, 16, 14],
  },
  {
    name: '🌊 Nature & Calm',
    description: 'Sounds of nature to bring peace and focus',
    cover_url: 'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=400&h=400&fit=crop',
    track_indices: [4, 8, 16, 9, 14],
  },
  {
    name: '🌃 City Nights',
    description: 'Urban beats and electronic vibes for the city soul',
    cover_url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=400&fit=crop',
    track_indices: [1, 3, 7, 12, 17],
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🧹 Cleaning up test data...');

  // Remove test/junk playlists (anything with test names or no proper data)
  const { data: allPlaylists } = await supabase.from('playlists').select('id, name');
  const junkKeywords = ['test', 'dfae', 'sfsvsfv', 'new', 'dafef', 'temp', 'Public', 'New'];
  const junkIds = (allPlaylists || [])
    .filter(p => junkKeywords.some(k => p.name?.toLowerCase().includes(k.toLowerCase())))
    .map(p => p.id);

  if (junkIds.length > 0) {
    await supabase.from('playlist_tracks').delete().in('playlist_id', junkIds);
    await supabase.from('playlists').delete().in('id', junkIds);
    console.log(`  Deleted ${junkIds.length} junk playlist(s)`);
  }

  // Remove tracks uploaded by demo/test uploads with junk titles
  const { data: allTracks } = await supabase.from('tracks').select('id, title');
  const junkTracks = (allTracks || [])
    .filter(t => junkKeywords.some(k => t.title?.toLowerCase().includes(k.toLowerCase())))
    .map(t => t.id);

  if (junkTracks.length > 0) {
    await supabase.from('playlist_tracks').delete().in('track_id', junkTracks);
    await supabase.from('tracks').delete().in('id', junkTracks);
    console.log(`  Deleted ${junkTracks.length} junk track(s)`);
  }

  console.log('\n🎵 Seeding demo tracks...');

  // Check which demo tracks already exist
  const { data: existingTracks } = await supabase.from('tracks').select('title');
  const existingTitles = new Set((existingTracks || []).map(t => t.title));

  const trackRecords = TRACKS
    .filter(t => !existingTitles.has(t.title))
    .map(t => ({
      ...t,
      uploaded_by: DEMO_USER_ID,
      is_public: 'true',
      play_count: String(Math.floor(Math.random() * 5000) + 100),
      cover_url: null,
    }));

  let insertedTracks = [];
  if (trackRecords.length > 0) {
    const { data, error } = await supabase.from('tracks').insert(trackRecords).select();
    if (error) { console.error('Track insert error:', error); return; }
    insertedTracks = data;
    console.log(`  Inserted ${insertedTracks.length} tracks`);
  } else {
    console.log('  All demo tracks already exist, skipping');
  }

  // Re-fetch all tracks to get their IDs
  const { data: allTracksNow } = await supabase.from('tracks').select('id, title');
  const trackMap = {};
  (allTracksNow || []).forEach(t => { trackMap[t.title] = t.id; });

  console.log('\n📋 Seeding demo playlists...');

  for (const pl of PLAYLISTS) {
    // Skip if already exists
    const { data: existing } = await supabase.from('playlists').select('id').eq('name', pl.name).maybeSingle();
    if (existing) {
      console.log(`  Skipping "${pl.name}" — already exists`);
      continue;
    }

    const { data: newPl, error: plErr } = await supabase.from('playlists').insert({
      name: pl.name,
      description: pl.description,
      cover_url: pl.cover_url,
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      moderation_status: 'APPROVED',
      is_public: 'true',
      user_id: DEMO_USER_ID,
    }).select().single();

    if (plErr) { console.error(`  Error creating "${pl.name}":`, plErr); continue; }

    // Link tracks
    const trackLinks = pl.track_indices
      .map((idx, pos) => {
        const trackTitle = TRACKS[idx]?.title;
        const trackId = trackMap[trackTitle];
        if (!trackId) return null;
        return { playlist_id: newPl.id, track_id: trackId, position: String(pos) };
      })
      .filter(Boolean);

    if (trackLinks.length > 0) {
      const { error: linkErr } = await supabase.from('playlist_tracks').insert(trackLinks);
      if (linkErr) console.error(`  Error linking tracks for "${pl.name}":`, linkErr);
    }

    console.log(`  ✅ Created "${pl.name}" with ${trackLinks.length} tracks`);
  }

  console.log('\n✨ Done! Database is clean and seeded.');
}

main().catch(console.error);
