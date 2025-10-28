const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const jobListings = await prisma.jobListing.findMany();
    console.log('Job listings in database:');
    console.log(JSON.stringify(jobListings, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
