import express from 'express';
import prisma from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes here require TEACHER role
router.use(authenticate, authorize('TEACHER'));

// Get subjects taught by the teacher
router.get('/subjects', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.userId },
      include: {
        subjects: {
          include: {
            timetable: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    res.json(teacher.subjects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects.', error: error.message });
  }
});

// Get list of students belonging to a class
router.get('/students-by-class/:classId', async (req, res) => {
  const { classId } = req.params;

  try {
    const students = await prisma.student.findMany({
      where: { classId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching class students.', error: error.message });
  }
});

// Mark or update attendance for multiple students
// Body format: { date: "YYYY-MM-DD", subjectId: "...", records: [ { studentId: "...", status: "PRESENT"|"ABSENT"|"LATE" } ] }
router.post('/attendance', async (req, res) => {
  const { date, subjectId, records } = req.body;

  if (!date || !subjectId || !records || !Array.isArray(records)) {
    return res.status(400).json({ message: 'Invalid payload. Required: date, subjectId, records array.' });
  }

  try {
    // Parse date and normalize to midnight UTC
    const parsedDate = new Date(date);
    parsedDate.setUTCHours(0, 0, 0, 0);

    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.userId },
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    // Save attendance records in a transaction using upsert
    const savedRecords = await prisma.$transaction(
      records.map((rec) =>
        prisma.attendance.upsert({
          where: {
            date_studentId_subjectId: {
              date: parsedDate,
              studentId: rec.studentId,
              subjectId,
            },
          },
          update: {
            status: rec.status,
            markedById: teacher.id,
          },
          create: {
            date: parsedDate,
            status: rec.status,
            studentId: rec.studentId,
            subjectId,
            markedById: teacher.id,
          },
        })
      )
    );

    // Create notifications for students who were absent or late
    const absentOrLateRecords = records.filter(r => r.status === 'ABSENT' || r.status === 'LATE');
    if (absentOrLateRecords.length > 0) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      const subjectName = subject ? subject.name : 'Class';

      for (const rec of absentOrLateRecords) {
        const student = await prisma.student.findUnique({
          where: { id: rec.studentId },
          select: { userId: true },
        });

        if (student) {
          await prisma.notification.create({
            data: {
              userId: student.userId,
              title: `Attendance Alert: ${rec.status}`,
              message: `You were marked ${rec.status.toLowerCase()} in ${subjectName} on ${date}.`,
            },
          });
        }
      }
    }

    res.json({ message: 'Attendance processed successfully.', count: savedRecords.length });
  } catch (error) {
    res.status(500).json({ message: 'Error marking attendance.', error: error.message });
  }
});

// Get attendance history marked by this teacher
router.get('/attendance-history', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.userId },
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    const logs = await prisma.attendance.findMany({
      where: { markedById: teacher.id },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
          },
        },
        subject: { select: { name: true, code: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history.', error: error.message });
  }
});

// GET all leave requests
router.get('/leaves', async (req, res) => {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaves.', error: error.message });
  }
});

// Update leave request status (Approve/Reject)
router.put('/leaves/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'APPROVED' or 'REJECTED'

  if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Valid status APPROVED or REJECTED required.' });
  }

  try {
    const leave = await prisma.leaveRequest.update({
      where: { id },
      data: { status },
      include: {
        student: { select: { userId: true } },
      },
    });

    // Notify the student
    await prisma.notification.create({
      data: {
        userId: leave.student.userId,
        title: `Leave Request Update`,
        message: `Your leave request starting ${leave.startDate.toISOString().split('T')[0]} has been ${status.toLowerCase()}.`,
      },
    });

    res.json({ message: `Leave request ${status.toLowerCase()} successfully.`, leave });
  } catch (error) {
    res.status(500).json({ message: 'Error updating leave request.', error: error.message });
  }
});

// GET exams for subjects taught by this teacher
router.get('/exams', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.userId },
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    const exams = await prisma.exam.findMany({
      where: {
        subject: {
          teacherId: teacher.id,
        },
      },
      include: {
        subject: { select: { name: true, code: true } },
      },
      orderBy: { date: 'asc' },
    });

    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher exams.', error: error.message });
  }
});

// GET holidays for teachers
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

// GET teacher's own teaching schedule
router.get('/timetable', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.userId },
    });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }
    const slots = await prisma.timetableSlot.findMany({
      where: {
        subject: {
          teacherId: teacher.id
        }
      },
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true, code: true, type: true } }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teacher timetable.', error: error.message });
  }
});

// GET classes taught by this teacher
router.get('/classes', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.userId },
      include: {
        subjects: {
          include: {
            timetable: {
              include: {
                class: {
                  include: {
                    _count: { select: { students: true } }
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    const classesMap = {};
    teacher.subjects.forEach(sub => {
      sub.timetable.forEach(slot => {
        if (slot.class) {
          classesMap[slot.class.id] = slot.class;
        }
      });
    });
    res.json(Object.values(classesMap));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching classes.', error: error.message });
  }
});

// GET student fee dues for classes taught by this teacher
router.get('/fees', async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.userId },
      include: {
        subjects: {
          include: {
            timetable: {
              select: { classId: true }
            }
          }
        }
      }
    });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    const classIds = [];
    teacher.subjects.forEach(sub => {
      sub.timetable.forEach(slot => {
        if (slot.classId && !classIds.includes(slot.classId)) {
          classIds.push(slot.classId);
        }
      });
    });

    const fees = await prisma.feeDue.findMany({
      where: {
        student: {
          classId: { in: classIds }
        }
      },
      include: {
        student: {
          include: {
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student fees.', error: error.message });
  }
});

export default router;
