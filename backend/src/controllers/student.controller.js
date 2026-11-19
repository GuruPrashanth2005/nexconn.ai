const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const aiService = require('../services/ai.service');

// Record a completed experiment session
exports.recordSession = async (req, res, next) => {
  try {
    const { module, mode, score, timeSpentSeconds, status, mistakes, improvementAreas } = req.body;

    if (!module || !mode || score === undefined || timeSpentSeconds === undefined || !status) {
      return next(new AppError('Missing required session data.', 400));
    }

    const session = await prisma.experimentSession.create({
      data: {
        studentId: req.user.id,
        module,
        mode,
        score,
        timeSpentSeconds,
        status,
        mistakes: mistakes || [],
        improvementAreas: improvementAreas || []
      }
    });

    res.status(201).json({
      status: 'success',
      data: { session }
    });
  } catch (error) {
    next(error);
  }
};

// Update a session with the AI Post-Lab quiz score
exports.updateQuizScore = async (req, res, next) => {
  try {
    const { module, score, quizData } = req.body;
    if (!module || score === undefined) {
      return next(new AppError('Missing module or quiz score.', 400));
    }

    // Find the most recent session for this student and module
    const latestSession = await prisma.experimentSession.findFirst({
      where: {
        studentId: req.user.id,
        module: module
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestSession) {
      return next(new AppError('No recent session found for this module.', 404));
    }

    const updatedSession = await prisma.experimentSession.update({
      where: { id: latestSession.id },
      data: { 
        quizScore: score,
        quizData: quizData || null
      }
    });

    res.status(200).json({
      status: 'success',
      data: { session: updatedSession }
    });
  } catch (error) {
    console.error('Quiz Update Error:', error);
    next(error);
  }
};

// Get Dashboard Data for the Student
exports.getStudentDashboard = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Aggregate sessions
    const sessions = await prisma.experimentSession.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' }
    });

    const totalSessions = sessions.length;
    let totalScore = 0;
    let totalTime = 0;
    const moduleCounts = {
      HARDNESS: { count: 0, score: 0 },
      ALKALINITY: { count: 0, score: 0 },
      COD: { count: 0, score: 0 },
      PH: { count: 0, score: 0 }
    };

    sessions.forEach(s => {
      totalScore += s.score;
      totalTime += s.timeSpentSeconds;
      if (moduleCounts[s.module]) {
        moduleCounts[s.module].count += 1;
        moduleCounts[s.module].score += s.score;
      }
    });

    const avgScore = totalSessions > 0 ? Math.round(totalScore / totalSessions) : 0;
    
    // Prepare radar data
    const radarData = Object.keys(moduleCounts).map(mod => ({
      module: mod,
      proficiency: moduleCounts[mod].count > 0 
        ? Math.round(moduleCounts[mod].score / moduleCounts[mod].count) 
        : 0,
      sessions: moduleCounts[mod].count
    }));

    res.status(200).json({
      status: 'success',
      data: {
        totalSessions,
        avgScore,
        totalTimeSpent: totalTime,
        radarData,
        recentSessions: sessions, // Send all sessions for frontend pagination
        aiInsights: [] // Insights are now fetched asynchronously
      }
    });
  } catch (error) {
    next(error);
  }
};

// Asynchronously fetch AI Insights for the dashboard
exports.getStudentInsights = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const sessions = await prisma.experimentSession.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    const aiInsights = await aiService.generateInsights(sessions);
    
    res.status(200).json({
      status: 'success',
      data: { aiInsights }
    });
  } catch (error) {
    next(error);
  }
};
