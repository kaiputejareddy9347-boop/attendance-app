import express from 'express';
import prisma from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes here require STUDENT role
router.use(authenticate, authorize('STUDENT'));

// Get student overall and subject-wise attendance statistics
router.get('/attendance', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId },
      include: { class: true },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    // Find all attendance records for this student
    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId: student.id },
      include: {
        subject: true,
      },
    });

    // Find all subjects associated with the class to compute metrics (even for subjects with no attendance marked yet)
    // To do this, we lookup all subjects taught by looking at timetables or all subjects in system.
    // Let's get all subjects first.
    const subjects = await prisma.subject.findMany({
      include: {
        teacher: { include: { user: { select: { name: true } } } },
      },
    });

    // Calculate overall stats
    const totalCount = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
    const lateCount = attendanceRecords.filter((r) => r.status === 'LATE').length;
    const absentCount = attendanceRecords.filter((r) => r.status === 'ABSENT').length;

    // A student is considered present on LATE as well, or counts as 0.5/1. Let's count PRESENT and LATE as active presence
    const activePresence = presentCount + lateCount;
    const overallPercentage = totalCount > 0 ? Math.round((activePresence / totalCount) * 100) : 100;

    // Calculate subject-wise breakdown
    const subjectBreakdown = subjects.map((subj) => {
      const subjRecords = attendanceRecords.filter((r) => r.subjectId === subj.id);
      const sTotal = subjRecords.length;
      const sPresent = subjRecords.filter((r) => r.status === 'PRESENT').length;
      const sLate = subjRecords.filter((r) => r.status === 'LATE').length;
      const sAbsent = subjRecords.filter((r) => r.status === 'ABSENT').length;

      const sPercentage = sTotal > 0 ? Math.round(((sPresent + sLate) / sTotal) * 100) : 100;

      return {
        subjectId: subj.id,
        subjectName: subj.name,
        subjectCode: subj.code,
        teacherName: subj.teacher?.user?.name || 'TBA',
        total: sTotal,
        present: sPresent,
        late: sLate,
        absent: sAbsent,
        percentage: sPercentage,
      };
    });

    res.json({
      summary: {
        total: totalCount,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        percentage: overallPercentage,
      },
      breakdown: subjectBreakdown,
      studentClass: student.class,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance stats.', error: error.message });
  }
});

// Get student's class timetable
router.get('/timetable', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    const slots = await prisma.timetableSlot.findMany({
      where: { classId: student.classId },
      include: {
        subject: {
          include: {
            teacher: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching timetable.', error: error.message });
  }
});

// POST leave request
router.post('/leaves', async (req, res) => {
  const { startDate, endDate, reason } = req.body;

  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ message: 'startDate, endDate, and reason are required.' });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    const newRequest = await prisma.leaveRequest.create({
      data: {
        studentId: student.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: 'PENDING',
      },
    });

    res.status(201).json({ message: 'Leave request submitted.', leave: newRequest });
  } catch (error) {
    res.status(500).json({ message: 'Error creating leave request.', error: error.message });
  }
});

// GET list of student's leave requests
router.get('/leaves', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leave requests.', error: error.message });
  }
});

export default router;
