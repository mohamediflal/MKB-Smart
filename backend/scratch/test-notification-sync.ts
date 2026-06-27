import { prisma } from '../configs/prisma.js';

async function main() {
  console.log("Starting notification sync test...");

  // 1. Fetch or create at least two admins to associate notifications with
  let admins = await prisma.admin.findMany({ take: 2 });
  if (admins.length < 2) {
    console.log("Less than 2 admins found. Creating temporary admins for test...");
    const admin1 = await prisma.admin.upsert({
      where: { email: 'test_admin1@example.com' },
      update: {},
      create: {
        name: 'Test Admin 1',
        email: 'test_admin1@example.com',
        password: 'hashedpassword',
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });
    const admin2 = await prisma.admin.upsert({
      where: { email: 'test_admin2@example.com' },
      update: {},
      create: {
        name: 'Test Admin 2',
        email: 'test_admin2@example.com',
        password: 'hashedpassword',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      }
    });
    admins = [admin1, admin2];
  }

  const [adminA, adminB] = admins;
  console.log(`Using Admin A: ${adminA.email} (${adminA.role}) and Admin B: ${adminB.email} (${adminB.role})`);

  // Cleanup old test notifications first if any
  await prisma.notification.deleteMany({
    where: {
      message: 'TEST_SYNC_MESSAGE'
    }
  });

  // 2. Create identical unread notifications for both admins
  const notificationA = await prisma.notification.create({
    data: {
      type: 'NEW_ORDER',
      title: 'TEST_SYNC_TITLE',
      message: 'TEST_SYNC_MESSAGE',
      target: adminA.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
      adminId: adminA.id,
      isRead: false
    }
  });

  const notificationB = await prisma.notification.create({
    data: {
      type: 'NEW_ORDER',
      title: 'TEST_SYNC_TITLE',
      message: 'TEST_SYNC_MESSAGE',
      target: adminB.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
      adminId: adminB.id,
      isRead: false
    }
  });

  console.log(`Created Notification A (ID: ${notificationA.id}, isRead: ${notificationA.isRead})`);
  console.log(`Created Notification B (ID: ${notificationB.id}, isRead: ${notificationB.isRead})`);

  // 3. Simulate marking Notification A as read using our sync query
  console.log("Simulating markAsRead for Notification A...");
  const readAt = new Date();
  await prisma.notification.updateMany({
    where: {
      target: { in: ['ADMIN', 'SUPER_ADMIN'] },
      type: notificationA.type,
      title: notificationA.title,
      message: notificationA.message,
      orderId: notificationA.orderId,
      productId: notificationA.productId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt
    }
  });

  // 4. Verify results
  const updatedA = await prisma.notification.findUnique({ where: { id: notificationA.id } });
  const updatedB = await prisma.notification.findUnique({ where: { id: notificationB.id } });

  console.log(`After sync, Notification A isRead: ${updatedA?.isRead}`);
  console.log(`After sync, Notification B isRead: ${updatedB?.isRead}`);

  if (updatedA?.isRead && updatedB?.isRead) {
    console.log("SUCCESS: Both notifications were marked as read!");
  } else {
    console.log("FAILURE: Notifications were not synced correctly.");
  }

  // Cleanup
  await prisma.notification.deleteMany({
    where: {
      id: { in: [notificationA.id, notificationB.id] }
    }
  });
}

main().catch(err => {
  console.error("Test failed with error:", err);
});
