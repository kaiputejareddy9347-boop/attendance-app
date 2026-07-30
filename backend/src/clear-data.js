import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting database purge (retaining admin accounts)...');
  
  try {
    // 1. Delete all transactional records
    console.log('- Clearing Attendance logs...');
    await prisma.attendance.deleteMany({});
    
    console.log('- Clearing Student Leave Requests...');
    await prisma.leaveRequest.deleteMany({});
    
    console.log('- Clearing Student Fee Dues...');
    await prisma.feeDue.deleteMany({});
    
    console.log('- Clearing Exam Schedules...');
    await prisma.exam.deleteMany({});
    
    console.log('- Clearing Timetable Slots...');
    await prisma.timetableSlot.deleteMany({});
    
    console.log('- Clearing Academic Recess/Holidays...');
    await prisma.holiday.deleteMany({});
    
    console.log('- Clearing Notifications...');
    await prisma.notification.deleteMany({});

    // 2. Delete subjects and relational profile structures
    console.log('- Clearing Subjects...');
    await prisma.subject.deleteMany({});
    
    console.log('- Clearing Student profiles...');
    await prisma.student.deleteMany({});
    
    console.log('- Clearing Teacher profiles...');
    await prisma.teacher.deleteMany({});
    
    console.log('- Clearing Class groups...');
    await prisma.class.deleteMany({});

    // 3. Delete all non-admin users
    console.log('- Purging non-admin users...');
    const result = await prisma.user.deleteMany({
      where: {
        role: {
          not: 'ADMIN',
        },
      },
    });
    console.log(`  Removed ${result.count} student/teacher user accounts.`);

    // 4. Check if at least one admin exists, if not create a default one
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    
    if (adminCount === 0) {
      console.log('- No Admin found. Creating default admin@college.edu / admin123...');
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('admin123', 10);
      await prisma.user.create({
        data: {
          email: 'admin@college.edu',
          password: hashedPassword,
          name: 'System Admin',
          role: 'ADMIN',
        }
      });
    }

    // 5. Ensure a default college config exists so frontend doesn't break
    const configCount = await prisma.collegeConfig.count();
    if (configCount === 0) {
      console.log('- Creating default CollegeConfig...');
      await prisma.collegeConfig.create({
        data: {
          name: 'City Technological University',
          code: 'CTU',
          academicYear: '2026-2027'
        }
      });
    }

    console.log('✨ Database purge completed successfully!');
  } catch (error) {
    console.error('❌ Error executing database purge:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
