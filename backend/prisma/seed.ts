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

  // Archive 데모 데이터 생성
  console.log('📦 Creating demo archive...');
  
  try {
    // authorId가 존재하는지 확인
    const author = await prisma.member.findUnique({
      where: { id: '13591192-9db8-448a-b744-bf4413539886' },
    });

    if (!author) {
      console.log('  ⚠️  Author not found. Skipping archive creation.');
    } else {
      // brandId=2, timelineId=8, categoryId=4가 존재하는지 확인
      const brand = await prisma.brand.findUnique({ where: { id: 2 } });
      const timeline = await prisma.timeline.findUnique({ where: { id: 8 } });
      const category = await prisma.category.findUnique({ where: { id: 4 } });

      if (!brand || !timeline || !category) {
        console.log('  ⚠️  Brand, Timeline, or Category not found.');
        console.log(`    Brand (id=2): ${brand ? '✓' : '✗'}`);
        console.log(`    Timeline (id=8): ${timeline ? '✓' : '✗'}`);
        console.log(`    Category (id=4): ${category ? '✓' : '✗'}`);
      } else {
        // 이미 존재하는지 확인
        const existingArchive = await prisma.archive.findFirst({
          where: {
            authorId: '13591192-9db8-448a-b744-bf4413539886',
            brandId: 2,
            story: '빈티지라고 해서 모두가 가치있는 것일까요? 꼭 그렇지는 않을 것 입니다.',
          },
        });

        if (existingArchive) {
          console.log('  ⏭️  Demo archive already exists');
        } else {
          const archive = await prisma.archive.create({
            data: {
              brandId: 2,
              timelineId: 8,
              categoryId: 4,
              averageJudgementPrice: 1200000,
              story: '빈티지라고 해서 모두가 가치있는 것일까요? 꼭 그렇지는 않을 것 입니다.',
              authorId: '13591192-9db8-448a-b744-bf4413539886',
              imageUrls: [
                'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
                'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
              ],
              isJudgementAllow: true,
              isPriceJudgementAllow: true,
            },
          });
          console.log(`  ✅ Created demo archive: ${archive.id}`);
        }
      }
    }
  } catch (error) {
    console.error('  ❌ Failed to create demo archive:', error);
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

