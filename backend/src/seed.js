import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clear database tables in order
  await prisma.notification.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database entries.');

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  // 2. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@college.edu',
      password: adminPassword,
      name: 'Registrar Admin',
      role: 'ADMIN',
    },
  });

  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@college.edu',
      password: teacherPassword,
      name: 'Prof. Alan Turing',
      role: 'TEACHER',
    },
  });

  const studentUser1 = await prisma.user.create({
    data: {
      email: 'student1@college.edu',
      password: studentPassword,
      name: 'John Doe',
      role: 'STUDENT',
    },
  });

  const studentUser2 = await prisma.user.create({
    data: {
      email: 'student2@college.edu',
      password: studentPassword,
      name: 'Jane Smith',
      role: 'STUDENT',
    },
  });

  console.log('👥 Users created.');

  // 3. Create Classes
  const classCS = await prisma.class.create({
    data: {
      name: 'Computer Science - Year 3',
      department: 'Computer Science & Engineering',
    },
  });

  const classIT = await prisma.class.create({
    data: {
      name: 'Information Technology - Year 3',
      department: 'Information Technology',
    },
  });

  console.log('🏫 Classes created.');

  // 4. Create Student Profiles
  const student1 = await prisma.student.create({
    data: {
      userId: studentUser1.id,
      rollNumber: 'CS2028-001',
      classId: classCS.id,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      userId: studentUser2.id,
      rollNumber: 'CS2028-002',
      classId: classCS.id,
    },
  });

  console.log('🎓 Students registered.');

  // 5. Create Teacher Profiles
  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      employeeId: 'EMP-TURING-01',
    },
  });

  console.log('👨‍🏫 Teacher registered.');

  // 6. Create Subjects
  const subjectAlgorithms = await prisma.subject.create({
    data: {
      name: 'Analysis of Algorithms',
      code: 'CS301',
      teacherId: teacher.id,
    },
  });

  const subjectDatabases = await prisma.subject.create({
    data: {
      name: 'Database Management Systems',
      code: 'CS302',
      teacherId: teacher.id,
    },
  });

  console.log('📚 Subjects created.');

  // 7. Create Timetable Slots
  // DayOfWeek: 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday
  await prisma.timetableSlot.createMany({
    data: [
      {
        classId: classCS.id,
        subjectId: subjectAlgorithms.id,
        dayOfWeek: 1, // Mon
        startTime: '09:00',
        endTime: '10:00',
        room: 'LHC-101',
      },
      {
        classId: classCS.id,
        subjectId: subjectDatabases.id,
        dayOfWeek: 1, // Mon
        startTime: '11:00',
        endTime: '12:00',
        room: 'LHC-102',
      },
      {
        classId: classCS.id,
        subjectId: subjectAlgorithms.id,
        dayOfWeek: 3, // Wed
        startTime: '09:00',
        endTime: '10:00',
        room: 'LHC-101',
      },
      {
        classId: classCS.id,
        subjectId: subjectDatabases.id,
        dayOfWeek: 4, // Thu
        startTime: '14:00',
        endTime: '15:00',
        room: 'LHC-104',
      },
    ],
  });

  console.log('📅 Timetables generated.');

  // 8. Create Mock Attendance Records
  // We'll generate mock logs for the last 5 days
  const today = new Date();
  const statuses = ['PRESENT', 'ABSENT', 'LATE'];

  for (let i = 1; i <= 5; i++) {
    const attendanceDate = new Date();
    attendanceDate.setDate(today.getDate() - i);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Skip weekends
    if (attendanceDate.getDay() === 0 || attendanceDate.getDay() === 6) continue;

    // Student 1 attendance
    await prisma.attendance.create({
      data: {
        date: attendanceDate,
        status: i % 4 === 0 ? 'ABSENT' : i % 5 === 0 ? 'LATE' : 'PRESENT',
        studentId: student1.id,
        subjectId: subjectAlgorithms.id,
        markedById: teacher.id,
      },
    });

    await prisma.attendance.create({
      data: {
        date: attendanceDate,
        status: i % 3 === 0 ? 'LATE' : 'PRESENT',
        studentId: student1.id,
        subjectId: subjectDatabases.id,
        markedById: teacher.id,
      },
    });

    // Student 2 attendance
    await prisma.attendance.create({
      data: {
        date: attendanceDate,
        status: i % 5 === 0 ? 'ABSENT' : 'PRESENT',
        studentId: student2.id,
        subjectId: subjectAlgorithms.id,
        markedById: teacher.id,
      },
    });

    await prisma.attendance.create({
      data: {
        date: attendanceDate,
        status: i % 4 === 0 ? 'LATE' : 'PRESENT',
        studentId: student2.id,
        subjectId: subjectDatabases.id,
        markedById: teacher.id,
      },
    });
  }

  console.log('📝 Attendance mock logs created.');

  // 9. Leave requests
  const leaveStart = new Date();
  leaveStart.setDate(today.getDate() + 2);
  const leaveEnd = new Date();
  leaveEnd.setDate(today.getDate() + 4);

  await prisma.leaveRequest.create({
    data: {
      studentId: student1.id,
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: 'Attending sibling wedding ceremony.',
      status: 'PENDING',
    },
  });

  console.log('✉️ Leave request created.');

  // 10. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: studentUser1.id,
        title: 'Welcome!',
        message: 'Welcome to the College Attendance Tracker portal.',
        isRead: false,
      },
      {
        userId: studentUser1.id,
        title: 'Leave request submitted',
        message: 'Your leave request is under process by your advisor.',
        isRead: true,
      },
      {
        userId: teacherUser.id,
        title: 'New Leave Request Received',
        message: 'Student John Doe has submitted a leave request.',
        isRead: false,
      },
    ],
  });

  console.log('🔔 Notifications created.');
  console.log('✨ Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
