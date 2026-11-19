const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const AppError = require('../utils/AppError');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { token, requestedRole } = req.body;

    if (!token || !requestedRole) {
      return next(new AppError('Please provide a valid token and role.', 400));
    }

    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name } = payload;

    if (!email) {
      return next(new AppError('Could not retrieve email from Google token.', 400));
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (requestedRole === 'FACULTY') {
      // Allow self-serve signup for faculty
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name,
            role: 'FACULTY',
          },
        });
      } else if (user.role !== 'FACULTY') {
        return next(new AppError('This email is registered as a Student.', 403));
      }
    } else if (requestedRole === 'STUDENT') {
      // Students must be whitelisted by Faculty
      if (!user) {
        return next(new AppError('Your email has not been whitelisted by a Faculty member. Access denied.', 403));
      }
      
      if (user.role !== 'STUDENT') {
        return next(new AppError('This email is registered as Faculty.', 403));
      }
      
      // Update name if it wasn't set when faculty whitelisted
      if (!user.name && name) {
        user = await prisma.user.update({
          where: { email },
          data: { name },
        });
      }
    } else {
      return next(new AppError('Invalid role requested.', 400));
    }

    // Send JWT token
    const jwtToken = signToken(user.id, user.role);

    res.status(200).json({
      status: 'success',
      token: jwtToken,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    return next(new AppError('Authentication failed. Please try again.', 401));
  }
};
