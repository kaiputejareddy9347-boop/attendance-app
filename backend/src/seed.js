import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clear database tables in order
  await prisma.feeDue.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.collegeConfig.deleteMany();
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

  // 3. Create College Configuration
  await prisma.collegeConfig.create({
    data: {
      name: 'City Technological University',
      code: 'CTU',
      logoUrl: '',
      academicYear: '2026-2027',
    },
  });

  console.log('🏛️ College config created.');

  // 4. Create Classes with Semesters (e.g. Semester 5)
  const classCS = await prisma.class.create({
    data: {
      name: 'Computer Science - Year 3',
      department: 'Computer Science & Engineering',
      semester: 5,
    },
  });

  const classIT = await prisma.class.create({
    data: {
      name: 'Information Technology - Year 3',
      department: 'Information Technology',
      semester: 5,
    },
  });

  console.log('🏫 Semester classes created.');

  // 5. Create Student Profiles
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

  // 6. Create Teacher Profiles
  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      employeeId: 'EMP-TURING-01',
    },
  });

  console.log('👨‍🏫 Teacher registered.');

  // 7. Create Subjects with Semesters (e.g. Semester 5)
  const subjectAlgorithms = await prisma.subject.create({
    data: {
      name: 'Analysis of Algorithms',
      code: 'CS301',
      semester: 5,
      teacherId: teacher.id,
    },
  });

  const subjectDatabases = await prisma.subject.create({
    data: {
      name: 'Database Management Systems',
      code: 'CS302',
      semester: 5,
      teacherId: teacher.id,
    },
  });

  console.log('📚 Subjects created.');

  // 8. Create Timetable Slots
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

  // 9. Create Mock Attendance Records
  const today = new Date();

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

  // 10. Leave requests
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

  // 11. Create Exams Schedule
  const exam1Date = new Date();
  exam1Date.setDate(today.getDate() + 7);
  const exam2Date = new Date();
  exam2Date.setDate(today.getDate() + 9);

  await prisma.exam.create({
    data: {
      name: 'Mid-Term Examination 1',
      date: exam1Date,
      startTime: '10:00',
      endTime: '12:00',
      subjectId: subjectAlgorithms.id,
      room: 'Exam Block A',
    },
  });

  await prisma.exam.create({
    data: {
      name: 'DBMS Lab Assessment',
      date: exam2Date,
      startTime: '14:00',
      endTime: '16:00',
      subjectId: subjectDatabases.id,
      room: 'DBMS Systems Lab',
    },
  });

  console.log('✍️ Exams scheduled.');

  // 12. Create Academic Holidays
  const hol1Start = new Date();
  hol1Start.setDate(today.getDate() + 15);
  const hol1End = new Date();
  hol1End.setDate(today.getDate() + 16);

  await prisma.holiday.create({
    data: {
      name: 'National Independence Day Holiday',
      startDate: hol1Start,
      endDate: hol1End,
      description: 'National holiday honoring independence celebrations.',
    },
  });

  console.log('⛱️ Holidays created.');

  // 13. Create Student Fee Dues
  const feeDue1Date = new Date();
  feeDue1Date.setDate(today.getDate() + 12);
  const feeDue2Date = new Date();
  feeDue2Date.setDate(today.getDate() - 15);

  await prisma.feeDue.create({
    data: {
      studentId: student1.id,
      amount: 1450.00,
      dueDate: feeDue1Date,
      status: 'PENDING',
      description: 'Semester 5 Tuition Fee Due',
    },
  });

  await prisma.feeDue.create({
    data: {
      studentId: student1.id,
      amount: 120.00,
      dueDate: feeDue2Date,
      status: 'PAID',
      description: 'Central Library Admission & Library Card Fee',
    },
  });

  await prisma.feeDue.create({
    data: {
      studentId: student2.id,
      amount: 1450.00,
      dueDate: feeDue1Date,
      status: 'PENDING',
      description: 'Semester 5 Tuition Fee Due',
    },
  });

  console.log('💵 Fees dues logged.');

  // 14. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: studentUser1.id,
        title: 'Welcome!',
        message: 'Welcome to the City Technological University dashboard.',
        isRead: false,
      },
      {
        userId: studentUser1.id,
        title: 'Mid-Term Exam Posted',
        message: 'Mid-Term Examination 1 schedule has been published.',
        isRead: false,
      },
      {
        userId: studentUser1.id,
        title: 'New Dues Allocated',
        message: 'Semester 5 Tuition invoice has been posted on your Fees panel.',
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
