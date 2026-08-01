import express from 'express';
import prisma from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes here require STUDENT role
router.use(authenticate, authorize('STUDENT'));

// GET student's attendance records on a specific date
router.get('/attendance-by-date', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'Date parameter is required.' });

  try {
    const parsedDate = new Date(date);
    parsedDate.setUTCHours(0, 0, 0, 0);

    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId }
    });
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });

    const records = await prisma.attendance.findMany({
      where: {
        studentId: student.id,
        date: parsedDate,
      },
      include: { subject: { select: { name: true, code: true } } }
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching date attendance.', error: error.message });
  }
});

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

    // Find timetable slots to determine session weights (double hour, etc.)
    const timetableSlots = await prisma.timetableSlot.findMany({
      where: { classId: student.classId },
    });

    // Find all subjects associated with the system to compute metrics
    const subjects = await prisma.subject.findMany({
      include: {
        teacher: { include: { user: { select: { name: true } } } },
      },
    });

    const getWeight = (subj, sl) => {
      if (subj.type === 'LAB') return 3;
      if (sl) {
        const parseTime = (t) => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
        };
        const diff = parseTime(sl.endTime) - parseTime(sl.startTime);
        if (diff >= 120) return 3;
        if (diff >= 80) return 2;
      }
      return 1;
    };

    // Calculate weighted overall stats
    let totalCount = 0;
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;

    attendanceRecords.forEach((r) => {
      const dayVal = new Date(r.date).getDay();
      const slot = timetableSlots.find((s) => s.subjectId === r.subjectId && s.dayOfWeek === dayVal);
      const weight = getWeight(r.subject, slot);

      totalCount += weight;
      if (r.status === 'PRESENT') presentCount += weight;
      if (r.status === 'LATE') lateCount += weight;
      if (r.status === 'ABSENT') absentCount += weight;
    });

    const activePresence = presentCount + lateCount;
    const overallPercentage = totalCount > 0 ? Math.round((activePresence / totalCount) * 100) : 100;

    // Calculate subject-wise breakdown
    const subjectBreakdown = subjects.map((subj) => {
      const subjRecords = attendanceRecords.filter((r) => r.subjectId === subj.id);
      
      let sTotal = 0;
      let sPresent = 0;
      let sLate = 0;
      let sAbsent = 0;

      subjRecords.forEach((r) => {
        const dayVal = new Date(r.date).getDay();
        const slot = timetableSlots.find((s) => s.subjectId === r.subjectId && s.dayOfWeek === dayVal);
        const weight = getWeight(subj, slot);

        sTotal += weight;
        if (r.status === 'PRESENT') sPresent += weight;
        if (r.status === 'LATE') sLate += weight;
        if (r.status === 'ABSENT') sAbsent += weight;
      });

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
    res.status(500).json({ message: 'Error calculating attendance statistics.', error: error.message });
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

// GET exams for the student's class semester level
router.get('/exams', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId },
      include: { class: true },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    // Find exams for subjects that are in the student's class semester level
    const exams = await prisma.exam.findMany({
      where: {
        subject: {
          semester: student.class.semester,
        },
      },
      include: {
        subject: { select: { name: true, code: true } },
      },
      orderBy: { date: 'asc' },
    });

    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student exams.', error: error.message });
  }
});

// GET upcoming academic holidays
router.get('/holidays', async (req, res) => {
  try {
    const holidays = await prisma.holiday.findMany({
      where: {
        endDate: {
          gte: new Date(),
        },
      },
      orderBy: { startDate: 'asc' },
    });
    res.json(holidays);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching holidays.', error: error.message });
  }
});

// GET fee dues for the student
router.get('/fees', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    const fees = await prisma.feeDue.findMany({
      where: { studentId: student.id },
      orderBy: { dueDate: 'asc' },
    });

    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student fees.', error: error.message });
  }
});

// GET classmates list
router.get('/classmates', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId },
      include: { class: true }
    });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }
    const classmates = await prisma.student.findMany({
      where: { classId: student.classId },
      include: { user: { select: { name: true, email: true } } }
    });
    res.json({ class: student.class, classmates });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching classmates.', error: error.message });
  }
});

// GET exam marks for the logged-in student
router.get('/exams/marks', async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId },
    });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    const exams = await prisma.exam.findMany({
      include: {
        subject: true,
      },
      orderBy: { date: 'asc' },
    });

    const marks = await prisma.examMark.findMany({
      where: { studentId: student.id },
    });

    const examsWithMarks = exams.map(ex => {
      const markRec = marks.find(m => m.examId === ex.id);
      return {
        examId: ex.id,
        examName: ex.name,
        date: ex.date,
        startTime: ex.startTime,
        endTime: ex.endTime,
        room: ex.room,
        subjectName: ex.subject.name,
        subjectCode: ex.subject.code,
        marks: markRec ? markRec.marks : null,
        maxMarks: markRec ? markRec.maxMarks : 100,
        remarks: markRec ? markRec.remarks : null,
        isPublished: !!markRec,
      };
    });

    res.json(examsWithMarks);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving student exam marks.', error: error.message });
  }
});

export default router;
