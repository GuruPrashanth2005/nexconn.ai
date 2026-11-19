const express = require('express');
const router = express.Router();
const aiService = require('../services/ai.service');
const prisma = require('../config/db');

router.post('/chat', async (req, res, next) => {
  try {
    const { history, context } = req.body;
    if (!history) {
      return res.status(400).json({ status: 'fail', message: 'Chat history is required' });
    }
    
    const reply = await aiService.chatWithAssistant(history, context || {});
    
    res.status(200).json({
      status: 'success',
      data: { reply }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/generate-quiz', async (req, res, next) => {
  try {
    const { module, mistakes } = req.body;
    if (!module) {
      return res.status(400).json({ status: 'fail', message: 'Module is required' });
    }

    const quiz = await aiService.generateQuiz(module, mistakes || []);
    
    res.status(200).json({
      status: 'success',
      data: { quiz }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/explain-theory', async (req, res, next) => {
  try {
    const { text, context, promptType } = req.body;
    if (!text || !context) {
      return res.status(400).json({ status: 'fail', message: 'Text and context are required' });
    }

    const explanation = await aiService.explainTheory(text, context, promptType || 'explain');
    
    res.status(200).json({
      status: 'success',
      data: { explanation }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/faculty-insights', async (req, res, next) => {
  try {
    const { analytics } = req.body;
    if (!analytics || !Array.isArray(analytics)) {
      return res.status(400).json({ status: 'fail', message: 'Analytics data is required' });
    }

    const insights = await aiService.generateFacultyInsights(analytics);
    
    res.status(200).json({
      status: 'success',
      data: insights
    });
  } catch (error) {
    next(error);
  }
});

router.post('/generate-lab', async (req, res, next) => {
  try {
    const { topic, curriculumLevel, documentType, engine } = req.body;
    if (!topic || !curriculumLevel || !documentType) {
      return res.status(400).json({ status: 'fail', message: 'Topic, curriculumLevel, and documentType are required' });
    }

    const labData = await aiService.generateLabManual(topic, curriculumLevel, documentType, engine || 'ollama');
    
    res.status(200).json({
      status: 'success',
      data: labData
    });
  } catch (error) {
    next(error);
  }
});

router.post('/trends', async (req, res, next) => {
  try {
    const { topic, engine } = req.body;
    if (!topic) {
      return res.status(400).json({ status: 'fail', message: 'Topic is required' });
    }

    const trendsData = await aiService.generateLiteratureTrends(topic, engine || 'groq');
    
    res.status(200).json({
      status: 'success',
      data: trendsData
    });
  } catch (error) {
    next(error);
  }
});

router.post('/retrosynthesis', async (req, res, next) => {
  try {
    const { targetMolecule, engine } = req.body;
    if (!targetMolecule) {
      return res.status(400).json({ status: 'fail', message: 'Target molecule is required' });
    }

    const retroData = await aiService.generateRetrosynthesis(targetMolecule, engine || 'groq');
    
    res.status(200).json({
      status: 'success',
      data: retroData
    });
  } catch (error) {
    next(error);
  }
});

router.post('/leaderboard', async (req, res, next) => {
  try {
    const { currentUser, engine } = req.body;
    
    // Fetch all students and their sessions to compute real scores
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: { experimentSessions: true }
    });

    let realStudents = students.map(student => {
      const sessions = student.experimentSessions || [];
      const totalScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0);
      const avgScore = sessions.length > 0 ? (totalScore / sessions.length) : 0;
      return {
        name: student.name || 'Anonymous Student',
        avgScore: Math.round(avgScore),
        totalSessions: sessions.length,
        isCurrentUser: currentUser && currentUser.name === student.name
      };
    });

    // LOGIC: Sort by score descending
    realStudents.sort((a, b) => b.avgScore - a.avgScore);

    // LOGIC: Assign ranks
    realStudents = realStudents.map((student, index) => ({
      ...student,
      rank: index + 1
    }));

    // Pass the pre-ranked array to the AI service strictly for adding commentary
    const leaderboardData = await aiService.generateAILeaderboard(realStudents, engine || 'groq');
    
    res.status(200).json({
      status: 'success',
      data: leaderboardData
    });
  } catch (error) {
    next(error);
  }
});

router.post('/compound-info', async (req, res, next) => {
  try {
    const { query } = req.body;
    const data = await aiService.generateCompoundInfo(query);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
});

router.post('/compound-chat', async (req, res, next) => {
  try {
    const { query, message, history } = req.body;
    const data = await aiService.chatAboutCompound(query, message, history);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
});

router.post('/simulate-reaction', async (req, res, next) => {
  try {
    const { elements, conditions, engine, analysisMode } = req.body;
    if (!elements) {
      return res.status(400).json({ status: 'fail', message: 'Elements/Target is required' });
    }
    const data = await aiService.simulateReaction(elements, conditions || {}, engine, analysisMode || 'synthesis');
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
});
router.post('/beaker-chat', async (req, res, next) => {
  try {
    const { message, history, context } = req.body;
    const data = await aiService.chatAboutBeaker(message, history, context);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
