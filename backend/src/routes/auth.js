import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register a new user with automatic profile creation
router.post('/register', async (req, res) => {
  const { email, password, name, role, rollNumber, classId, employeeId } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ message: 'Missing required fields: email, password, name, role.' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
        },
      });

      let profile = null;

      if (role === 'STUDENT') {
        if (!rollNumber || !classId) {
          throw new Error('rollNumber and classId are required for STUDENT registration.');
        }
        profile = await tx.student.create({
          data: {
            userId: user.id,
            rollNumber,
            classId,
          },
        });
      } else if (role === 'TEACHER') {
        if (!employeeId) {
          throw new Error('employeeId is required for TEACHER registration.');
        }
        profile = await tx.teacher.create({
          data: {
            userId: user.id,
            employeeId,
          },
        });
      }

      return { user, profile };
    });

    res.status(201).json({
      message: `${role} registered successfully.`,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error registering user.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        teacher: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Embed profile IDs into JWT
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      studentId: user.student?.id || null,
      teacherId: user.teacher?.id || null,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'super-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        studentId: user.student?.id || null,
        teacherId: user.teacher?.id || null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Get current logged-in user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        student: {
          include: {
            class: true,
          },
        },
        teacher: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching user details.' });
  }
});

// Get all classes (public for registration selection)
router.get('/classes', async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      select: { id: true, name: true }
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching classes.' });
  }
});

export default router;
