import { prisma } from '../configs/prisma.js';
import { sendPushNotification } from '../configs/firebase.js';

export const handleOrderStatusChange = async (orderId: string, status: string) => {
  try {
    // Fetch the order along with the user details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true
      }
    });

    if (!order) {
      console.error(`Order with ID ${orderId} not found for status change notification.`);
      return;
    }

    const shortOrderId = order.id.slice(-4).toUpperCase();
    const user = order.user;

    if (status === 'PLACED') {
      // 1. User (Buyer) Notification
      if (user) {
        const userTitle = 'Order Placed Successfully';
        const userMessage = `Your order #${shortOrderId} has been placed successfully.`;

        // Store in notifications table
        await prisma.notification.create({
          data: {
            type: 'NEW_ORDER',
            title: userTitle,
            message: userMessage,
            target: 'USER',
            userId: user.id,
            orderId: order.id
          }
        });

        // Get user device tokens
        const userTokens = await prisma.userDeviceToken.findMany({
          where: { userId: user.id }
        });
        const tokens = userTokens.map(t => t.token);
        if (tokens.length > 0) {
          await sendPushNotification(tokens, userTitle, userMessage, { orderId: order.id });
        }
      }

      // 2. Admins + Super Admins Notifications
      const admins = await prisma.admin.findMany();
      const adminTitle = 'New Order Placed';
      const adminMessage = `New order #${shortOrderId} has been placed.`;

      const adminNotificationsData = admins.map(admin => ({
        type: 'NEW_ORDER' as const,
        title: adminTitle,
        message: adminMessage,
        target: admin.role === 'SUPER_ADMIN' ? ('SUPER_ADMIN' as const) : ('ADMIN' as const),
        adminId: admin.id,
        orderId: order.id
      }));

      if (adminNotificationsData.length > 0) {
        await prisma.notification.createMany({
          data: adminNotificationsData
        });
      }

      // Fetch Admin device tokens
      const adminTokens = await prisma.adminDeviceToken.findMany();
      const tokens = adminTokens.map(t => t.token);
      if (tokens.length > 0) {
        await sendPushNotification(tokens, adminTitle, adminMessage, { orderId: order.id });
      }
    } else if (status === 'PROCESSING' || status === 'SHIPPED' || status === 'DELIVERED') {
      let userTitle = '';
      let userMessage = '';
      let type: 'ORDER_PROCESSING' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED';

      if (status === 'PROCESSING') {
        userTitle = 'Order Processing';
        userMessage = `Your order #${shortOrderId} is now being processed.`;
        type = 'ORDER_PROCESSING';
      } else if (status === 'SHIPPED') {
        userTitle = 'Order Shipped';
        userMessage = `Your order #${shortOrderId} has been shipped and is on its way.`;
        type = 'ORDER_SHIPPED';
      } else { // DELIVERED
        userTitle = 'Order Delivered';
        userMessage = `Your order #${shortOrderId} has been delivered successfully. Thank you!`;
        type = 'ORDER_DELIVERED';
      }

      if (user) {
        // Store in notifications table for the user
        await prisma.notification.create({
          data: {
            type,
            title: userTitle,
            message: userMessage,
            target: 'USER',
            userId: user.id,
            orderId: order.id
          }
        });

        // Get user device tokens and send push notification
        const userTokens = await prisma.userDeviceToken.findMany({
          where: { userId: user.id }
        });
        const tokens = userTokens.map(t => t.token);
        if (tokens.length > 0) {
          await sendPushNotification(tokens, userTitle, userMessage, { orderId: order.id });
        }
      }
    }

  } catch (error) {
    console.error('Error handling order status change notification:', error);
  }
};

export const checkAndNotifyStock = async (productId: string) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    if (!product) return;

    const stock = product.stock ?? 0;
    let type: 'OUT_OF_STOCK' | 'LOW_STOCK' | null = null;
    let title = '';
    let message = '';

    if (stock === 0) {
      type = 'OUT_OF_STOCK';
      title = 'Product Out of Stock';
      message = `Product "${product.name}" is now Out of Stock (0 remaining).`;
    } else if (stock < 15) {
      type = 'LOW_STOCK';
      title = 'Product Low Stock Warning';
      message = `Product "${product.name}" is running low on stock (${stock} remaining).`;
    }

    if (type) {
      const admins = await prisma.admin.findMany();
      
      const adminNotificationsData = admins.map(admin => ({
        type,
        title,
        message,
        target: admin.role === 'SUPER_ADMIN' ? ('SUPER_ADMIN' as const) : ('ADMIN' as const),
        adminId: admin.id,
        productId: product.id
      }));

      if (adminNotificationsData.length > 0) {
        await prisma.notification.createMany({
          data: adminNotificationsData
        });
      }

      // Fetch Admin device tokens and send push notifications
      const adminTokens = await prisma.adminDeviceToken.findMany();
      const tokens = adminTokens.map(t => t.token);
      if (tokens.length > 0) {
        await sendPushNotification(tokens, title, message, { productId: product.id });
      }
    }
  } catch (error) {
    console.error('Error handling product stock check and notification:', error);
  }
};
