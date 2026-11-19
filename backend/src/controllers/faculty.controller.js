const prisma = require('../config/db');
const AppError = require('../utils/AppError');

// Add (whitelist) a student
exports.addStudent = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next(new AppError('Please provide a student email address.', 400));
    }

    // Check if user already exists
    let existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      if (existingUser.role === 'FACULTY') {
        return next(new AppError('This email is already registered as a Faculty member.', 400));
      }
      
      // If student exists but assigned to someone else, we could update or reject.
      // Let's just update the assignment to the current faculty
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { assignedByFacultyId: req.user.id }
      });

      return res.status(200).json({
        status: 'success',
        data: { user: existingUser }
      });
    }

    // Create the student placeholder
    const newStudent = await prisma.user.create({
      data: {
        email,
        role: 'STUDENT',
        assignedByFacultyId: req.user.id
      }
    });

    res.status(201).json({
      status: 'success',
      data: { user: newStudent }
    });
  } catch (error) {
    next(error);
  }
};

// Get list of assigned students
exports.getStudents = async (req, res, next) => {
  try {
    console.log('Fetching students for faculty ID:', req.user.id);
    const students = await prisma.user.findMany({
      where: {
        assignedByFacultyId: req.user.id,
        role: 'STUDENT'
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    console.log('Found students:', students.length);
    res.status(200).json({
      status: 'success',
      results: students.length,
      data: { students }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    next(error);
  }
};

// Get student analytics
exports.getStudentAnalytics = async (req, res, next) => {
  try {
    console.log('Fetching analytics for faculty ID:', req.user.id);
    // Find all students assigned to this faculty
    const students = await prisma.user.findMany({
      where: {
        assignedByFacultyId: req.user.id,
        role: 'STUDENT'
      },
      include: {
        experimentSessions: true
      }
    });

    // Aggregate data
    const analytics = students.map(student => {
      const sessions = student.experimentSessions;
      
      const totalSessions = sessions.length;
      const passedSessions = sessions.filter(s => s.status === 'PASSED').length;
      
      const practiceSessions = sessions.filter(s => s.mode === 'PRACTICE').length;
      const assessmentSessions = sessions.filter(s => s.mode === 'ASSESSMENT').length;

      const avgScore = totalSessions > 0 
        ? sessions.reduce((acc, curr) => acc + curr.score, 0) / totalSessions 
        : 0;
      
      const sessionsWithQuiz = sessions.filter(s => s.quizScore !== null && s.quizScore !== undefined);
      const avgQuizScore = sessionsWithQuiz.length > 0
        ? sessionsWithQuiz.reduce((acc, curr) => acc + curr.quizScore, 0) / sessionsWithQuiz.length
        : 0;

      const totalTimeSpent = sessions.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0);

      // Extract all mistakes
      const allMistakes = sessions
        .filter(s => s.mistakes)
        .flatMap(s => (typeof s.mistakes === 'string' ? JSON.parse(s.mistakes) : s.mistakes));

      const mistakeFrequency = {};
      allMistakes.forEach(m => {
        mistakeFrequency[m] = (mistakeFrequency[m] || 0) + 1;
      });

      // Calculate Average Accuracy
      let totalAccuracy = 0;
      sessions.forEach(s => {
        const mistakesCount = s.mistakes ? (typeof s.mistakes === 'string' ? JSON.parse(s.mistakes).length : s.mistakes.length) : 0;
        const accuracy = Math.max(0, 100 - (mistakesCount * 15));
        totalAccuracy += accuracy;
      });
      const avgAccuracy = totalSessions > 0 ? totalAccuracy / totalSessions : 0;

      return {
        studentId: student.id,
        name: student.name || 'Pending Onboarding',
        email: student.email,
        totalSessions,
        practiceSessions,
        assessmentSessions,
        passedSessions,
        avgScore: Math.round(avgScore * 100) / 100,
        avgQuizScore: Math.round(avgQuizScore * 100) / 100,
        avgAccuracy: Math.round(avgAccuracy * 100) / 100,
        totalTimeSpent, // in seconds
        topMistakes: Object.entries(mistakeFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([mistake, count]) => ({ mistake, count }))
      };
    });

    // Extract all timestamps across all students for the Activity Heatmap
    const classActivityTimestamps = students
      .flatMap(student => student.experimentSessions)
      .map(session => session.createdAt);

    res.status(200).json({
      status: 'success',
      data: { analytics, classActivityTimestamps }
    });
  } catch (error) {
    next(error);
  }
};

// Remove (unwhitelist) a student
exports.removeStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify the student belongs to this faculty
    const student = await prisma.user.findFirst({
      where: {
        id,
        assignedByFacultyId: req.user.id,
        role: 'STUDENT'
      }
    });

    if (!student) {
      return next(new AppError('Student not found or not assigned to you.', 404));
    }

    // Delete the student (which will cascade delete their sessions if schema is set up, or we can just delete)
    // Note: Since Prisma's default referential action for a relation without cascade might throw an error,
    // let's explicitly delete sessions first or use cascade in schema. We'll delete sessions here to be safe.
    await prisma.experimentSession.deleteMany({
      where: { studentId: id }
    });

    await prisma.user.delete({
      where: { id }
    });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// Get detailed sessions for a single student
exports.getStudentSessions = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify the student belongs to this faculty
    const student = await prisma.user.findFirst({
      where: {
        id,
        assignedByFacultyId: req.user.id,
        role: 'STUDENT'
      }
    });

    if (!student) {
      return next(new AppError('Student not found or not assigned to you.', 404));
    }

    const sessions = await prisma.experimentSession.findMany({
      where: { studentId: id },
      orderBy: { createdAt: 'asc' }
    });

    res.status(200).json({
      status: 'success',
      data: {
        student,
        sessions
      }
    });
  } catch (error) {
    next(error);
  }
};
