const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const publishedListings = await prisma.jobListing.findMany({
      where: { expiresAt: { gt: new Date() } }
    });
    console.log('Published listings (not expired):', publishedListings.length);
    console.log(JSON.stringify(publishedListings, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
