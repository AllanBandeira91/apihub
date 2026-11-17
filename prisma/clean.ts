import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
  console.log('Cleaning database: removing all test and demo data...');
  await prisma.emailVerification.deleteMany({});
  await prisma.webhookCapture.deleteMany({});
  await prisma.statusIncident.deleteMany({});
  await prisma.uptimeCheck.deleteMany({});
  await prisma.uptimeMonitor.deleteMany({});
  await prisma.testCase.deleteMany({});
  await prisma.environment.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.requestLog.deleteMany({});
  await prisma.apiKey.deleteMany({});
  await prisma.responseExample.deleteMany({});
  await prisma.parameter.deleteMany({});
  await prisma.endpoint.deleteMany({});
  await prisma.apiDefinition.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.workspaceMember.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database successfully cleaned! Ready for real users.');
  const userCount = await prisma.user.count();
  console.log('Total users remaining:', userCount);
}

clean()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
