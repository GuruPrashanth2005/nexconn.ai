const express = require('express');
const router = express.Router();
const axios = require('axios');

// Proxy requests to the Python Microservice
const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8001';

router.get('/molecule/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const response = await axios.get(`${PYTHON_ENGINE_URL}/api/molecule/${name}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching from Python Engine:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ detail: 'Internal Server Error (Python Engine Unreachable)' });
    }
  }
});

module.exports = router;
