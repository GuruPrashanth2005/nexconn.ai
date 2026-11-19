const express = require('express');
const router = express.Router();

// Fallback dynamic intent prediction when standalone python laya_server is not running
router.post('/predict', (req, res) => {
  const { text, choices } = req.body;
  const prompt = (text || '').toLowerCase();

  let predicted_intent = 'CHEMISTRY';

  if (prompt.includes('fill') && prompt.includes('burette')) {
    predicted_intent = 'fillBurette';
  } else if (prompt.includes('swirl') || prompt.includes('mix')) {
    predicted_intent = 'triggerSwirl';
  } else if (prompt.includes('exit') || prompt.includes('leave')) {
    predicted_intent = 'exitLab';
  } else if (prompt.includes('pipette') && (prompt.includes('draw') || prompt.includes('take'))) {
    predicted_intent = 'pipetteDraw';
  } else if (prompt.includes('pipette') && (prompt.includes('dispense') || prompt.includes('pour'))) {
    predicted_intent = 'pipetteDispense';
  } else if (
    prompt.includes('hack') ||
    prompt.includes('kill') ||
    prompt.includes('steal') ||
    prompt.includes('game')
  ) {
    predicted_intent = 'NON_SCIENCE';
  }

  // Ensure choice exists in allowed client choices if provided
  if (Array.isArray(choices) && !choices.includes(predicted_intent)) {
    predicted_intent = 'CHEMISTRY';
  }

  return res.status(200).json({ predicted_intent });
});

module.exports = router;

