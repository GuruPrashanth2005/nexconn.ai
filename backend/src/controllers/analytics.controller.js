const prisma = require('../config/db');
// Log one or more student activities
exports.logActivity = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const isBatch = Array.isArray(req.body.activities);
    
    if (isBatch) {
      // Batch insert
      const activities = req.body.activities.map(act => ({
        studentId,
        activityType: act.activityType,
        moduleId: act.moduleId || null,
        durationMs: act.durationMs || null,
        details: act.details || {},
        createdAt: new Date()
      }));
      await prisma.studentActivityLog.createMany({ data: activities });
      return res.status(201).json({ success: true, count: activities.length });
    } else {
      // Single insert (legacy support)
      const { activityType, moduleId, durationMs, details } = req.body;
      const log = await prisma.studentActivityLog.create({
        data: {
          studentId,
          activityType,
          moduleId: moduleId || null,
          durationMs: durationMs || null,
          details: details || {}
        }
      });
      return res.status(201).json({ success: true, log });
    }
  } catch (error) {
    console.error('LOG ACTIVITY ERROR:', error);
    next(error);
  }
};

// Get aggregated analytics for the faculty dashboard (All Time)
exports.getFacultyOverview = async (req, res, next) => {
  try {
    // Top 5 synthesized molecules
    const synthesisLogs = await prisma.studentActivityLog.findMany({
      where: { activityType: 'MOLECULE_SYNTHESIS' }
    });
    
    const moleculeCounts = {};
    synthesisLogs.forEach(log => {
      if (log.details && log.details.molecule) {
        const mol = log.details.molecule;
        moleculeCounts[mol] = (moleculeCounts[mol] || 0) + 1;
      }
    });
    const topMolecules = Object.entries(moleculeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Activity over time (Grouped by Date for all time)
    const allLogs = await prisma.studentActivityLog.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    const timelineCounts = {};
    allLogs.forEach(log => {
      const dateStr = log.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      timelineCounts[dateStr] = (timelineCounts[dateStr] || 0) + 1;
    });
    const timeline = Object.entries(timelineCounts).map(([date, count]) => ({ date, count }));

    // AI Analytics Aggregation
    const tokenLogs = await prisma.tokenUsageLog.findMany();
    
    let totalTokens = 0;
    const moduleUsageMap = {};
    const timelineTokenMap = {};
    const timelineTokenHourlyMap = {};
    const providerMap = { 'Ollama (Local)': 0, 'Groq (Cloud)': 0 }; // Mock provider spend based on tokens

    tokenLogs.forEach(log => {
      const tokens = log.inputTokens + log.outputTokens;
      totalTokens += tokens;
      
      // Module Usage
      moduleUsageMap[log.module] = (moduleUsageMap[log.module] || 0) + 1;
      
      // Token & API Timeline (Daily)
      const dateStr = log.createdAt.toISOString().split('T')[0];
      if (!timelineTokenMap[dateStr]) timelineTokenMap[dateStr] = { input: 0, output: 0, requests: 0 };
      timelineTokenMap[dateStr].input += log.inputTokens;
      timelineTokenMap[dateStr].output += log.outputTokens;
      timelineTokenMap[dateStr].requests += 1;

      // Token Timeline (Hourly)
      const dateObj = new Date(log.createdAt);
      const hourStr = `${dateStr} ${dateObj.getHours().toString().padStart(2, '0')}:00`;
      if (!timelineTokenHourlyMap[hourStr]) timelineTokenHourlyMap[hourStr] = { input: 0, output: 0, requests: 0 };
      timelineTokenHourlyMap[hourStr].input += log.inputTokens;
      timelineTokenHourlyMap[hourStr].output += log.outputTokens;
      timelineTokenHourlyMap[hourStr].requests += 1;

      // Mock Spend Calculation (Assuming Groq is $0.05/1M tokens, just for visual representation)
      // We will assign all tokens to Groq for now to show some spend
      providerMap['Groq (Cloud)'] += (tokens / 1000000) * 0.05;
    });

    const aiMetrics = {
      totalRequests: tokenLogs.length,
      totalTokens,
      moduleUsage: Object.entries(moduleUsageMap).map(([name, count]) => ({ name, count })),
      apiUsage: Object.entries(timelineTokenMap).map(([date, data]) => ({
        date,
        count: data.requests
      })).sort((a, b) => new Date(a.date) - new Date(b.date)),
      tokenOverTime: Object.entries(timelineTokenMap).map(([date, tokens]) => ({
        date,
        input: tokens.input,
        output: tokens.output,
        total: tokens.input + tokens.output
      })).sort((a, b) => new Date(a.date) - new Date(b.date)),
      tokenOverTimeHourly: Object.entries(timelineTokenHourlyMap).map(([date, tokens]) => ({
        date,
        input: tokens.input,
        output: tokens.output,
        total: tokens.input + tokens.output
      })).sort((a, b) => new Date(a.date) - new Date(b.date)),
      totalSpend: providerMap['Groq (Cloud)'],
      spendByProvider: Object.entries(providerMap).map(([name, value]) => ({ name, value }))
    };

    res.status(200).json({
      success: true,
      topMolecules,
      timeline,
      aiMetrics
    });
  } catch (error) {
    console.error('FACULTY OVERVIEW ERROR:', error);
    next(error);
  }
};

// Get global live feed of all students for the faculty dashboard
exports.getGlobalFeed = async (req, res, next) => {
  try {
    const logs = await prisma.studentActivityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        student: {
          select: { name: true, email: true }
        }
      }
    });

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('GLOBAL FEED ERROR:', error);
    next(error);
  }
};

// Get detailed timeline for a specific student
exports.getStudentTimeline = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const logs = await prisma.studentActivityLog.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Last 50 activities
    });

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('STUDENT TIMELINE ERROR:', error);
    next(error);
  }
};

// Get advanced aggregated analytics for a specific student
exports.getStudentAdvancedAnalytics = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // 1. Fetch token usage summary grouped by module and context
    const tokenLogs = await prisma.tokenUsageLog.findMany({
      where: { studentId }
    });

    const tokenBreakdown = {};
    let totalTokens = 0;
    
    tokenLogs.forEach(log => {
      const tokens = log.inputTokens + log.outputTokens;
      totalTokens += tokens;
      const key = `${log.module}_${log.context}`;
      tokenBreakdown[key] = (tokenBreakdown[key] || 0) + tokens;
    });

    const tokenChartData = Object.entries(tokenBreakdown).map(([name, value]) => ({
      name,
      value
    }));

    // 2. Fetch Activity Timeline and group time spent by module
    const activityLogs = await prisma.studentActivityLog.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 200 // take a larger sample for timeline
    });

    const moduleTimeSpent = {}; // Track time spent per module (in ms)
    activityLogs.forEach(log => {
      if (log.moduleId && log.durationMs) {
        moduleTimeSpent[log.moduleId] = (moduleTimeSpent[log.moduleId] || 0) + log.durationMs;
      }
    });

    // 3. Performance over time (Active hours/tasks completed)
    const performanceTimelineCounts = {};
    activityLogs.forEach(log => {
      const dateStr = log.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      performanceTimelineCounts[dateStr] = (performanceTimelineCounts[dateStr] || 0) + 1;
    });
    
    const performanceTimeline = Object.entries(performanceTimelineCounts).map(([date, count]) => ({ date, count })).reverse();

    // 4. Raw Token Logs for detailed per-response graphing
    const rawTokenLogs = tokenLogs.map(log => ({
      time: log.createdAt,
      inputTokens: log.inputTokens,
      outputTokens: log.outputTokens,
      module: log.module
    })).sort((a, b) => a.time - b.time);

    res.status(200).json({
      success: true,
      data: {
        totalTokens,
        tokenChartData,
        moduleTimeSpent,
        performanceTimeline,
        rawTokenLogs,
        recentActivities: activityLogs.slice(0, 50) // Top 50 recent detailed activities
      }
    });
  } catch (error) {
    console.error('ADVANCED ANALYTICS ERROR:', error);
    next(error);
  }
};
