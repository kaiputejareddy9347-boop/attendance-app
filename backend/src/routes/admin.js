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
  const { name, code, semester, type, teacherId } = req.body;
  if (!name || !code || !teacherId) {
    return res.status(400).json({ message: 'Name, code, and teacherId are required.' });
  }

  try {
    const newSubject = await prisma.subject.create({
      data: {
        name,
        code,
        semester: semester ? parseInt(semester) : 1,
        type: type || 'THEORY',
        teacherId,
      },
    });
    res.status(201).json(newSubject);
  } catch (error) {
    res.status(400).json({ message: 'Subject code already exists or invalid teacher ID.' });
  }
});

// PUT update subject
router.put('/subjects/:id', async (req, res) => {
  const { id } = req.params;
  const { name, code, semester, type, teacherId } = req.body;
  if (!name || !code || !teacherId) {
    return res.status(400).json({ message: 'Name, code, and teacherId are required.' });
  }

  try {
    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: {
        name,
        code,
        semester: semester ? parseInt(semester) : 1,
        type: type || 'THEORY',
        teacherId,
      },
    });
    res.json(updatedSubject);
  } catch (error) {
    res.status(500).json({ message: 'Error updating subject.', error: error.message });
  }
});

// DELETE subject
router.delete('/subjects/:id', async (req, res) => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id } });
    res.json({ message: 'Subject deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting subject.', error: error.message });
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

// PUT update timetable slot
router.put('/timetable/:id', async (req, res) => {
  const { id } = req.params;
  const { classId, subjectId, dayOfWeek, startTime, endTime, room } = req.body;
  if (!classId || !subjectId || !dayOfWeek || !startTime || !endTime || !room) {
    return res.status(400).json({ message: 'All timetable slot details are required.' });
  }

  try {
    const updatedSlot = await prisma.timetableSlot.update({
      where: { id },
      data: {
        classId,
        subjectId,
        dayOfWeek: parseInt(dayOfWeek),
        startTime,
        endTime,
        room,
      },
    });
    res.json(updatedSlot);
  } catch (error) {
    res.status(500).json({ message: 'Error updating timetable slot.', error: error.message });
  }
});

// GET all timetable slots (admin list)
router.get('/timetable', async (req, res) => {
  try {
    const slots = await prisma.timetableSlot.findMany({
      include: {
        class: { select: { name: true } },
        subject: {
          select: {
            name: true,
            code: true,
            teacher: { include: { user: { select: { name: true } } } }
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching timetable slots.', error: error.message });
  }
});

// DELETE timetable slot
router.delete('/timetable/:id', async (req, res) => {
  try {
    await prisma.timetableSlot.delete({ where: { id: req.params.id } });
    res.json({ message: 'Timetable slot deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting timetable slot.', error: error.message });
  }
});

// PUT update college configuration
router.put('/college-config', async (req, res) => {
  const { name, code, logoUrl, academicYear } = req.body;
  try {
    const config = await prisma.collegeConfig.findFirst();
    let updated;
    if (config) {
      updated = await prisma.collegeConfig.update({
        where: { id: config.id },
        data: { name, code, logoUrl, academicYear },
      });
    } else {
      updated = await prisma.collegeConfig.create({
        data: { name, code, logoUrl, academicYear },
      });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating college config.', error: error.message });
  }
});

// GET all exams (admin list)
router.get('/exams', async (req, res) => {
  try {
    const exams = await prisma.exam.findMany({
      include: {
        subject: { select: { name: true, code: true } },
      },
      orderBy: { date: 'asc' },
    });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exams.', error: error.message });
  }
});

// POST schedule exam
router.post('/exams', async (req, res) => {
  const { name, date, startTime, endTime, subjectId, room } = req.body;
  if (!name || !date || !startTime || !endTime || !subjectId || !room) {
    return res.status(400).json({ message: 'All exam details are required.' });
  }
  try {
    const exam = await prisma.exam.create({
      data: {
        name,
        date: new Date(date),
        startTime,
        endTime,
        subjectId,
        room,
      },
    });
    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Error scheduling exam.', error: error.message });
  }
});

// DELETE exam
router.delete('/exams/:id', async (req, res) => {
  try {
    await prisma.exam.delete({ where: { id: req.params.id } });
    res.json({ message: 'Exam deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting exam.', error: error.message });
  }
});

// GET all holidays (admin list)
router.get('/holidays', async (req, res) => {
  try {
    const holidays = await prisma.holiday.findMany({
      orderBy: { startDate: 'asc' },
    });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching holidays.', error: error.message });
  }
});

// POST declare holiday
router.post('/holidays', async (req, res) => {
  const { name, startDate, endDate, description } = req.body;
  if (!name || !startDate || !endDate) {
    return res.status(400).json({ message: 'Name, startDate, and endDate are required.' });
  }
  try {
    const holiday = await prisma.holiday.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
      },
    });
    res.status(201).json(holiday);
  } catch (error) {
    res.status(500).json({ message: 'Error declaring holiday.', error: error.message });
  }
});

// DELETE holiday
router.delete('/holidays/:id', async (req, res) => {
  try {
    await prisma.holiday.delete({ where: { id: req.params.id } });
    res.json({ message: 'Holiday deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting holiday.', error: error.message });
  }
});

// GET all fees dues (admin list)
router.get('/fees', async (req, res) => {
  try {
    const fees = await prisma.feeDue.findMany({
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fees records.', error: error.message });
  }
});

// POST create fee due log
router.post('/fees', async (req, res) => {
  const { studentId, amount, dueDate, description } = req.body;
  if (!studentId || !amount || !dueDate || !description) {
    return res.status(400).json({ message: 'studentId, amount, dueDate, and description are required.' });
  }
  try {
    const fee = await prisma.feeDue.create({
      data: {
        studentId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        status: 'PENDING',
        description,
      },
    });

    // Notify student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });
    if (student) {
      await prisma.notification.create({
        data: {
          userId: student.userId,
          title: 'New Fee Dues Allocated',
          message: `An amount of $${amount} for "${description}" has been invoiced, due on ${new Date(dueDate).toLocaleDateString()}.`,
        },
      });
    }

    res.status(201).json(fee);
  } catch (error) {
    res.status(500).json({ message: 'Error logging fee dues.', error: error.message });
  }
});

// PUT update fee payment status (toggle paid/pending)
router.put('/fees/:id/status', async (req, res) => {
  const { status } = req.body; // 'PAID' or 'PENDING'
  if (!status || !['PAID', 'PENDING'].includes(status)) {
    return res.status(400).json({ message: 'Valid status required: PAID or PENDING.' });
  }
  try {
    const fee = await prisma.feeDue.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        student: { select: { userId: true } },
      },
    });

    // Notify student
    await prisma.notification.create({
      data: {
        userId: fee.student.userId,
        title: 'Fee Payment Received',
        message: `Your payment status for "${fee.description}" was marked as ${status.toLowerCase()}.`,
      },
    });

    res.json(fee);
  } catch (error) {
    res.status(500).json({ message: 'Error updating payment status.', error: error.message });
  }
});

export default router;
