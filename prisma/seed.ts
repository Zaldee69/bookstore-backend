import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');
  
  // Clear existing data
  await prisma.errorLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();
  
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@bookstore.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.email);
  
  // Create customer users
  const customerPassword = await bcrypt.hash('customer123', 10);
  const customer1 = await prisma.user.create({
    data: {
      email: 'customer1@example.com',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
    },
  });
  console.log('✅ Customer user created:', customer1.email);
  
  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@example.com',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
    },
  });
  console.log('✅ Customer user created:', customer2.email);
  
  // Create books
  const books = [
    {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      price: 450000, // dalam sen (450000 = Rp 4500)
      stock: 50,
    },
    {
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt, David Thomas',
      price: 500000,
      stock: 30,
    },
    {
      title: 'Design Patterns',
      author: 'Gang of Four',
      price: 550000,
      stock: 20,
    },
    {
      title: 'Refactoring',
      author: 'Martin Fowler',
      price: 480000,
      stock: 25,
    },
    {
      title: 'Domain-Driven Design',
      author: 'Eric Evans',
      price: 600000,
      stock: 15,
    },
    {
      title: 'JavaScript: The Good Parts',
      author: 'Douglas Crockford',
      price: 350000,
      stock: 40,
    },
    {
      title: 'Eloquent JavaScript',
      author: 'Marijn Haverbeke',
      price: 400000,
      stock: 35,
    },
    {
      title: 'You Don\'t Know JS',
      author: 'Kyle Simpson',
      price: 420000,
      stock: 45,
    },
  ];
  
  for (const book of books) {
    const created = await prisma.book.create({ data: book });
    console.log('✅ Book created:', created.title);
  }
  
  console.log('🎉 Seed completed!');
  console.log('\n📝 Test Credentials:');
  console.log('Admin: admin@bookstore.com / admin123');
  console.log('Customer 1: customer1@example.com / customer123');
  console.log('Customer 2: customer2@example.com / customer123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
