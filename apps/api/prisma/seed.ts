import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ClrVault database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clrtech.co.za' },
    update: {},
    create: {
      email: 'admin@clrtech.co.za',
      passwordHash: adminPassword,
      name: 'ClrVault Admin',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log(`  Admin user: ${admin.email} (${admin.id})`);

  // Create demo user
  const userPassword = await bcrypt.hash('user123!', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@clrtech.co.za' },
    update: {},
    create: {
      email: 'demo@clrtech.co.za',
      passwordHash: userPassword,
      name: 'Demo User',
      role: UserRole.USER,
      isActive: true,
    },
  });
  console.log(`  Demo user: ${demoUser.email} (${demoUser.id})`);

  // Create default collections
  const collections = [
    { name: 'Brand Assets', slug: 'brand-assets', path: '/brand-assets' },
    { name: 'Product Images', slug: 'product-images', path: '/product-images' },
    { name: 'Documents', slug: 'documents', path: '/documents' },
    { name: 'Marketing', slug: 'marketing', path: '/marketing' },
    { name: 'Icons', slug: 'icons', path: '/icons' },
  ];

  for (const col of collections) {
    const created = await prisma.collection.upsert({
      where: { slug: col.slug },
      update: {},
      create: col,
    });
    console.log(`  Collection: ${created.name} (${created.id})`);
  }

  // Create sub-collections
  const brandAssets = await prisma.collection.findUnique({ where: { slug: 'brand-assets' } });
  if (brandAssets) {
    const subCollections = [
      { name: 'Logos', slug: 'brand-logos', parentId: brandAssets.id, path: '/brand-assets/brand-logos' },
      { name: 'Fonts', slug: 'brand-fonts', parentId: brandAssets.id, path: '/brand-assets/brand-fonts' },
      { name: 'Colors', slug: 'brand-colors', parentId: brandAssets.id, path: '/brand-assets/brand-colors' },
    ];

    for (const sub of subCollections) {
      const created = await prisma.collection.upsert({
        where: { slug: sub.slug },
        update: {},
        create: sub,
      });
      console.log(`  Sub-collection: ${created.name} (${created.id})`);
    }
  }

  // Create default tags
  const tags = [
    { name: 'Logo', slug: 'logo', color: '#6366f1' },
    { name: 'Banner', slug: 'banner', color: '#f59e0b' },
    { name: 'Icon', slug: 'icon', color: '#10b981' },
    { name: 'Photo', slug: 'photo', color: '#3b82f6' },
    { name: 'Video', slug: 'video', color: '#ef4444' },
    { name: 'Document', slug: 'document', color: '#8b5cf6' },
    { name: 'Template', slug: 'template', color: '#f97316' },
    { name: 'Social Media', slug: 'social-media', color: '#ec4899' },
    { name: 'Print', slug: 'print', color: '#14b8a6' },
    { name: 'Web', slug: 'web', color: '#06b6d4' },
  ];

  for (const tag of tags) {
    const created = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
    console.log(`  Tag: ${created.name} (${created.id})`);
  }

  console.log('Seeding complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
