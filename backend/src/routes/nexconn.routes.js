const express = require('express');
const router = express.Router();
const nexconnService = require('../services/nexconn.service');

// POST /api/nexconn/token
// Issue or retrieve access token for the given user
router.post('/token', async (req, res) => {
  try {
    const { userId, name, avatarUrl } = req.body;
    const finalUserId = userId || `student_${Math.floor(1000 + Math.random() * 9000)}`;
    const finalName = name || `Hydrolab Learner`;

    const tokenData = await nexconnService.issueToken(finalUserId, finalName, avatarUrl);
    return res.status(200).json(tokenData);
  } catch (error) {
    console.error('Error generating Nexconn token:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to issue Nexconn token',
      error: error.message,
    });
  }
});

// GET /api/nexconn/config
// Return public AppKey for client SDK initialization
router.get('/config', (req, res) => {
  return res.status(200).json({
    appKey: process.env.NEXCONN_APP_KEY || 'z3v5yqkbzen70',
    areaCode: 'SG',
  });
});

// In-memory active room registry: roomCode -> { module, latestTelemetry, createdAt }
const activeRooms = new Map();

// POST /api/v1/nexconn/register-room
router.post('/register-room', (req, res) => {
  const { roomCode, module } = req.body;
  if (!roomCode || !module) {
    return res.status(400).json({ success: false, message: 'roomCode and module are required' });
  }
  const code = roomCode.toUpperCase();
  const existing = activeRooms.get(code) || {};
  activeRooms.set(code, { ...existing, module, createdAt: existing.createdAt || Date.now() });
  return res.status(200).json({ success: true, roomCode: code, module });
});

// GET /api/v1/nexconn/resolve-room/:roomCode
router.get('/resolve-room/:roomCode', (req, res) => {
  const code = (req.params.roomCode || '').toUpperCase();
  const room = activeRooms.get(code);
  if (room) {
    return res.status(200).json({ success: true, module: room.module });
  }
  return res.status(404).json({ success: false, message: 'Room not found' });
});

// POST /api/v1/nexconn/telemetry (Instant Real-time Relay between Cross-Browser / Cross-Network Peers)
router.post('/telemetry', (req, res) => {
  const data = req.body;
  if (!data || !data.roomId) {
    return res.status(400).json({ success: false, message: 'Missing telemetry data or roomId' });
  }
  const code = data.roomId.toUpperCase();
  const room = activeRooms.get(code) || { module: data.module || 'HARDNESS', createdAt: Date.now() };
  room.latestTelemetry = data;
  room.lastUpdated = Date.now();
  activeRooms.set(code, room);

  return res.status(200).json({ success: true });
});

// GET /api/v1/nexconn/telemetry/:roomCode (Long-polling / fast poll fallback for cross-browser peers)
router.get('/telemetry/:roomCode', (req, res) => {
  const code = (req.params.roomCode || '').toUpperCase();
  const room = activeRooms.get(code);
  if (room && room.latestTelemetry) {
    return res.status(200).json({ success: true, telemetry: room.latestTelemetry });
  }
  return res.status(200).json({ success: true, telemetry: null });
});

module.exports = router;

