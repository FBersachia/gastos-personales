import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create a demo user
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: hashedPassword,
    },
  });

  console.log('✅ Created demo user:', user.email);

  // Create payment methods
  const paymentMethods = await Promise.all([
    prisma.paymentMethod.upsert({
      where: { userId_name: { userId: user.id, name: 'Efectivo' } },
      update: {},
      create: { userId: user.id, name: 'Efectivo' },
    }),
    prisma.paymentMethod.upsert({
      where: { userId_name: { userId: user.id, name: 'Visa Santander' } },
      update: {},
      create: { userId: user.id, name: 'Visa Santander' },
    }),
    prisma.paymentMethod.upsert({
      where: { userId_name: { userId: user.id, name: 'Amex Gold' } },
      update: {},
      create: { userId: user.id, name: 'Amex Gold' },
    }),
  ]);

  console.log(`✅ Created ${paymentMethods.length} payment methods`);

  // Create macro categories
  const macroCategories = await Promise.all([
    prisma.macroCategory.upsert({
      where: { userId_name: { userId: user.id, name: 'Alimentación' } },
      update: {},
      create: { userId: user.id, name: 'Alimentación' },
    }),
    prisma.macroCategory.upsert({
      where: { userId_name: { userId: user.id, name: 'Hogar' } },
      update: {},
      create: { userId: user.id, name: 'Hogar' },
    }),
    prisma.macroCategory.upsert({
      where: { userId_name: { userId: user.id, name: 'Transporte' } },
      update: {},
      create: { userId: user.id, name: 'Transporte' },
    }),
  ]);

  console.log(`✅ Created ${macroCategories.length} macro categories`);

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: 'Supermercado' } },
      update: {},
      create: {
        userId: user.id,
        name: 'Supermercado',
        macroId: macroCategories[0].id,
      },
    }),
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: 'Almuerzo' } },
      update: {},
      create: {
        userId: user.id,
        name: 'Almuerzo',
        macroId: macroCategories[0].id,
      },
    }),
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: 'Casa' } },
      update: {},
      create: {
        userId: user.id,
        name: 'Casa',
        macroId: macroCategories[1].id,
      },
    }),
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: 'Combustible' } },
      update: {},
      create: {
        userId: user.id,
        name: 'Combustible',
        macroId: macroCategories[2].id,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create a recurring series
  const series = await prisma.recurringSeries.upsert({
    where: { userId_name: { userId: user.id, name: 'Alquiler' } },
    update: {},
    create: {
      userId: user.id,
      name: 'Alquiler',
      frequency: 'MONTHLY',
    },
  });

  console.log('✅ Created recurring series: Alquiler');

  // Create sample transactions
  const today = new Date();
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        userId: user.id,
        date: today,
        type: 'EXPENSE',
        description: 'Supermercado del mes',
        amount: 45000,
        categoryId: categories[0].id,
        paymentId: paymentMethods[1].id,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        date: new Date(today.getTime() - 86400000), // Yesterday
        type: 'EXPENSE',
        description: 'Almuerzo oficina',
        amount: 6500,
        categoryId: categories[1].id,
        paymentId: paymentMethods[0].id,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        date: today,
        type: 'EXPENSE',
        description: 'Alquiler Octubre',
        amount: 350000,
        categoryId: categories[2].id,
        paymentId: paymentMethods[0].id,
        seriesId: series.id,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        date: today,
        type: 'EXPENSE',
        description: 'Notebook Dell cuota 1/12',
        amount: 150000,
        installments: '1/12',
        categoryId: categories[2].id,
        paymentId: paymentMethods[2].id,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user.id,
        date: today,
        type: 'INCOME',
        description: 'Salario Octubre',
        amount: 2800000,
        categoryId: categories[2].id,
        paymentId: paymentMethods[0].id,
      },
    }),
  ]);

  console.log(`✅ Created ${transactions.length} sample transactions`);

  console.log('🎉 Database seed completed!');
  console.log('\n📝 Demo credentials:');
  console.log('   Email: demo@example.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
