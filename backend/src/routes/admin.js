import express from 'express';
import prisma from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes here require ADMIN role
router.use(authenticate, authorize('ADMIN'));

// Get admin stats dashboard summary
router.get('/stats', async (req, res) => {
  try {
    const totalStudents = await prisma.student.count();
    const totalTeachers = await prisma.teacher.count();
    const totalClasses = await prisma.class.count();
    const totalSubjects = await prisma.subject.count();

    const recentAttendance = await prisma.attendance.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { include: { user: { select: { name: true } } } },
        subject: { select: { name: true, code: true } },
      },
    });

    res.json({
      counts: {
        students: totalStudents,
        teachers: totalTeachers,
        classes: totalClasses,
        subjects: totalSubjects,
      },
      recentAttendance,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats.', error: error.message });
  }
});

// GET all classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        _count: {
          select: { students: true },
        },
      },
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching classes.' });
  }
});

// POST create class
router.post('/classes', async (req, res) => {
  const { name, department } = req.body;
  if (!name || !department) {
    return res.status(400).json({ message: 'Name and department are required.' });
  }

  try {
    const newClass = await prisma.class.create({
      data: { name, department },
    });
    res.status(201).json(newClass);
  } catch (error) {
    res.status(400).json({ message: 'Class already exists or invalid data.' });
  }
});

// GET all subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        teacher: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects.' });
  }
});

// POST create subject
router.post('/subjects', async (req, res) => {
  const { name, code, teacherId } = req.body;
  if (!name || !code || !teacherId) {
    return res.status(400).json({ message: 'Name, code, and teacherId are required.' });
  }

  try {
    const newSubject = await prisma.subject.create({
      data: { name, code, teacherId },
    });
    res.status(201).json(newSubject);
  } catch (error) {
    res.status(400).json({ message: 'Subject code already exists or invalid teacher ID.' });
  }
});

// GET all students
router.get('/students', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { name: true, email: true } },
        class: { select: { name: true } },
      },
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students.' });
  }
});

// GET all teachers
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: { select: { name: true, email: true } },
        subjects: { select: { name: true, code: true } },
      },
    });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teachers.' });
  }
});

// POST configure timetable slot
router.post('/timetable', async (req, res) => {
  const { classId, subjectId, dayOfWeek, startTime, endTime, room } = req.body;
  if (!classId || !subjectId || !dayOfWeek || !startTime || !endTime || !room) {
    return res.status(400).json({ message: 'All timetable slot details are required.' });
  }

  try {
    const newSlot = await prisma.timetableSlot.create({
      data: {
        classId,
        subjectId,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        room,
      },
    });
    res.status(201).json(newSlot);
  } catch (error) {
    res.status(500).json({ message: 'Error creating timetable slot.', error: error.message });
  }
});

export default router;
