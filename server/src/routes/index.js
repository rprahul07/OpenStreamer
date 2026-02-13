const express = require('express');
const authRoutes = require('./auth');
const trackRoutes = require('./tracks');
const playlistRoutes = require('./playlists');
const moderationRoutes = require('./moderation');
const interactionRoutes = require('./interactions');
const settingsRoutes = require('./settings');

function setupRoutes(app) {
  console.log('=== SETTING UP ROUTES ===');
  
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/tracks', trackRoutes);
  console.log('Registering /api/playlists routes...');
  app.use('/api/playlists', playlistRoutes);
  app.use('/api/moderation', moderationRoutes);
  app.use('/api/interactions', interactionRoutes);
  app.use('/api/settings', settingsRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });
  
  console.log('=== ROUTES SETUP COMPLETE ===');
}

module.exports = setupRoutes;
