import express from 'express';
import prisma from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes here require TEACHER role
router.use(authenticate, authorize('TEACHER'));

// GET teacher's attendance logs on a specific date
router.get('/attendance-by-date', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'Date parameter is required.' });

  try {
    const parsedDate = new Date(date);
    parsedDate.setUTCHours(0, 0, 0, 0);

    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.userId }
    });
    if (!teacher) return res.status(404).json({ message: 'Teacher profile not found.' });

    // Fetch attendance sheets marked by this teacher on this date
    const records = await prisma.attendance.findMany({
      where: {
        markedById: teacher.id,
        date: parsedDate,
      },
      select: {
        id: true,
        status: true,
        studentId: true,
        subjectId: true,
      }
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching date attendance logs.', error: error.message });
  }
});

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
  const { date, subjectId } = req.query;

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

    let attendanceMarked = false;
    let markedAt = null;
    let studentStatusMap = {};

    if (date && subjectId) {
      const dateObj = new Date(date);
      dateObj.setUTCHours(0, 0, 0, 0);

      const existingRecords = await prisma.attendance.findMany({
        where: {
          date: dateObj,
          subjectId,
          student: { classId }
        }
      });

      if (existingRecords.length > 0) {
        attendanceMarked = true;
        markedAt = existingRecords[0].createdAt;
        existingRecords.forEach(rec => {
          studentStatusMap[rec.studentId] = rec.status;
        });
      }
    }

    res.json({
      students,
      attendanceMarked,
      markedAt,
      studentStatusMap
    });
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

    const today = new Date();
    today.setUTCHours(23, 59, 59, 999);
    if (parsedDate > today) {
      return res.status(400).json({ message: 'Attendance cannot be marked for future dates.' });
    }

    // Fetch active semester configuration
    const config = await prisma.collegeConfig.findFirst();
    if (config) {
      const semesterStart = new Date(config.semesterStart);
      const semesterEnd = new Date(config.semesterEnd);
      semesterStart.setUTCHours(0, 0, 0, 0);
      semesterEnd.setUTCHours(23, 59, 59, 999);

      if (parsedDate < semesterStart || parsedDate > semesterEnd) {
        return res.status(400).json({ 
          message: `Attendance can only be marked within the active semester timeline (${semesterStart.toISOString().split('T')[0]} to ${semesterEnd.toISOString().split('T')[0]}).` 
        });
      }
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.userId },
    });

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found.' });
    }

    // Check if attendance was already marked previously for this subject on this date
    const firstExistingRecord = await prisma.attendance.findFirst({
      where: {
        date: parsedDate,
        subjectId,
      },
    });

    if (firstExistingRecord) {
      const hoursElapsed = (new Date() - new Date(firstExistingRecord.createdAt)) / (1000 * 60 * 60);
      if (hoursElapsed > 24) {
        return res.status(403).json({ 
          message: 'Attendance modification closed. You can only edit attendance within 24 hours of marking it.' 
        });
      }
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
