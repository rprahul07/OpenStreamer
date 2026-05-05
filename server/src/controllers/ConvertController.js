const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const s3Service = require('../config/s3');
const TrackModel = require('../models/Track');
const Playlist = require('../models/Playlist');
const PlaylistTrack = require('../models/PlaylistTrack');

// Point fluent-ffmpeg to the bundled binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Accept any file — no MIME filter (browsers sometimes send application/octet-stream)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

class ConvertController {
  /** POST /api/convert  — multipart: videoFile + playlistName */
  static async convert(req, res) {
    const originalName = req.file ? req.file.originalname : 'video.mp4';
    const ext = path.extname(originalName).toLowerCase() || '.mp4';
    const ts = Date.now();
    const tmpVideo = path.join(os.tmpdir(), `vc_in_${ts}${ext}`);
    const tmpAudio = path.join(os.tmpdir(), `vc_out_${ts}.mp3`);

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Video file required' });
      }

      console.log('=== CONVERT DEBUG ===');
      console.log('Original filename:', originalName);
      console.log('Detected ext:', ext);
      console.log('MIME type received:', req.file.mimetype);
      console.log('Buffer size (bytes):', req.file.buffer.length);

      const { playlistName } = req.body;
      if (!playlistName || !playlistName.trim()) {
        return res.status(400).json({ error: 'Playlist name is required' });
      }

      const userId = req.user.id;
      const username = req.user.username || 'User';
      const trackTitle = playlistName.trim();

      // 1. Write video buffer to temp file WITH correct extension
      fs.writeFileSync(tmpVideo, req.file.buffer);
      console.log('Wrote temp video:', tmpVideo);

      // 2. Convert → MP3, explicitly mapping first audio stream
      await new Promise((resolve, reject) => {
        const stderrLines = [];

        ffmpeg(tmpVideo)
          .outputOptions([
            '-map', '0:a:0',       // explicitly select first audio stream
            '-vn',                  // drop video
            '-acodec', 'libmp3lame',
            '-b:a', '192k',
            '-y',                   // overwrite output if exists
          ])
          .format('mp3')
          .on('stderr', (line) => {
            stderrLines.push(line);
            // Show all ffmpeg output so we can diagnose
            console.log('[ffmpeg]', line);
          })
          .on('end', () => {
            console.log('ffmpeg conversion complete');
            resolve();
          })
          .on('error', (err) => {
            console.error('ffmpeg failed:', err.message);
            // Surface the last 10 lines of ffmpeg output in the error
            const detail = stderrLines.slice(-10).join('\n');
            reject(new Error('ffmpeg error — ' + err.message + '\n' + detail));
          })
          .save(tmpAudio);
      });

      // 3. Read MP3 buffer
      const audioBuffer = fs.readFileSync(tmpAudio);
      console.log('MP3 buffer size:', audioBuffer.length, 'bytes');

      // 4. Upload to S3
      const s3Key = `audio/converted/${userId}/${Date.now()}-${trackTitle.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
      const audioUrl = await s3Service.uploadFile(audioBuffer, s3Key, 'audio/mpeg');

      // 5. Create public Track
      const track = await TrackModel.create({
        title: trackTitle,
        artist: username,
        album: trackTitle,
        duration: '180',
        file_url: audioUrl,
        uploaded_by: userId,
        is_public: 'true',
      });

      // 6. Create public Playlist + link track
      const playlist = await Playlist.create({
        name: trackTitle,
        description: `Converted from video by ${username}`,
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
        moderation_status: 'APPROVED',
        is_public: 'true',
        cover_url: `https://picsum.photos/seed/${Date.now()}/400/400`,
        user_id: userId,
      });

      await PlaylistTrack.create({
        playlist_id: playlist.id,
        track_id: track.id,
        position: '0',
      });

      return res.status(201).json({
        track,
        playlist,
        message: 'Video converted and published successfully!',
      });
    } catch (err) {
      console.error('Convert error:', err.message);
      return res.status(500).json({ error: 'Conversion failed: ' + err.message });
    } finally {
      try { fs.unlinkSync(tmpVideo); } catch (_) {}
      try { fs.unlinkSync(tmpAudio); } catch (_) {}
    }
  }

  static getUploadMiddleware() {
    return upload.single('videoFile');
  }
}

module.exports = ConvertController;
