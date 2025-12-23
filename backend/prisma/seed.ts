import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['info', 'warn', 'error'],
});

async function main() {
  console.log('🌱 Starting seed...');

  // Timeline 데이터 생성 (1920s ~ 2010s)
  console.log('📅 Creating timelines...');
  
  const timelines = [
    { name: '1920s' },
    { name: '1930s' },
    { name: '1940s' },
    { name: '1950s' },
    { name: '1960s' },
    { name: '1970s' },
    { name: '1980s' },
    { name: '1990s' },
    { name: '2000s' },
    { name: '2010s' },
  ];

  for (const timeline of timelines) {
    const existing = await prisma.timeline.findFirst({
      where: { name: timeline.name },
    });

    if (!existing) {
      await prisma.timeline.create({
        data: timeline,
      });
      console.log(`  ✅ Created timeline: ${timeline.name}`);
    } else {
      console.log(`  ⏭️  Timeline already exists: ${timeline.name}`);
    }
  }

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

