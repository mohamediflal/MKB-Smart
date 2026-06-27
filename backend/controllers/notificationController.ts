import { Request, Response } from 'express';
import { prisma } from '../configs/prisma.js';

// Helper to create notifications for all admins on new order placement
export const createOrderNotification = async (order: any, userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true }
    });
    const userName = user?.name || 'A customer';

    // Find all Admin/Super Admin users
    const admins = await prisma.admin.findMany();

    const notificationsData = admins.map((admin) => ({
      type: 'NEW_ORDER' as const,
      title: 'New Order Placed',
      message: `${userName} placed a new order of $${order.total.toFixed(2)}.`,
      target: admin.role === 'SUPER_ADMIN' ? ('SUPER_ADMIN' as const) : ('ADMIN' as const),
      adminId: admin.id,
      orderId: order.id,
      isRead: false,
      isDeleted: false
    }));

    if (notificationsData.length > 0) {
      await prisma.notification.createMany({
        data: notificationsData
      });
    }
  } catch (error) {
    console.error('Failed to create order notification:', error);
  }
};

// Fetch notifications for current logged in admin
export const getNotifications = async (req: Request & { admin?: any }, res: Response) => {
  try {
    const adminId = req.admin?.id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        adminId,
        isDeleted: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({ success: true, notifications });
  } catch (error: any) {
    console.error('Get Notifications Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Mark a single notification as read
export const markAsRead = async (req: Request & { admin?: any }, res: Response) => {
  try {
    const adminId = req.admin?.id;
    const { id } = req.params;

    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notification = await prisma.notification.findFirst({
      where: { id, adminId }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const readAt = new Date();
    await prisma.notification.updateMany({
      where: {
        target: { in: ['ADMIN', 'SUPER_ADMIN'] },
        type: notification.type,
        title: notification.title,
        message: notification.message,
        orderId: notification.orderId,
        productId: notification.productId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt
      }
    });

    const updated = await prisma.notification.findUnique({
      where: { id }
    });

    return res.status(200).json({ success: true, notification: updated });
  } catch (error: any) {
    console.error('Mark As Read Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Mark all notifications as read for current admin
export const markAllAsRead = async (req: Request & { admin?: any }, res: Response) => {
  try {
    const adminId = req.admin?.id;

    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const unreadNotifications = await prisma.notification.findMany({
      where: {
        adminId,
        isRead: false,
        isDeleted: false
      }
    });

    if (unreadNotifications.length > 0) {
      const readAt = new Date();
      const orConditions = unreadNotifications.map(n => ({
        type: n.type,
        title: n.title,
        message: n.message,
        orderId: n.orderId,
        productId: n.productId
      }));

      await prisma.notification.updateMany({
        where: {
          target: { in: ['ADMIN', 'SUPER_ADMIN'] },
          isRead: false,
          OR: orConditions
        },
        data: {
          isRead: true,
          readAt
        }
      });
    }

    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Mark All As Read Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Soft-delete a notification (mark isDeleted = true)
export const deleteNotification = async (req: Request & { admin?: any }, res: Response) => {
  try {
    const adminId = req.admin?.id;
    const { id } = req.params;

    if (!adminId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notification = await prisma.notification.findFirst({
      where: { id, adminId }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id },
      data: {
        isDeleted: true
      }
    });

    return res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    console.error('Delete Notification Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Save User Device Token
export const saveUserToken = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const { token } = req.body;
    const userId = req.userId;

    if (!userId || !token) {
      return res.status(400).json({ success: false, message: 'Missing token or user identity' });
    }

    await prisma.userDeviceToken.upsert({
      where: { token },
      update: { userId, role: 'USER' },
      create: { token, userId, role: 'USER' }
    });

    return res.status(200).json({ success: true, message: 'User device token saved successfully' });
  } catch (error: any) {
    console.error('Save User Token Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Save Admin Device Token
export const saveAdminToken = async (req: Request & { admin?: any }, res: Response) => {
  try {
    const { token } = req.body;
    const adminId = req.admin?.id;
    const role = req.admin?.role || 'ADMIN'; // ADMIN or SUPER_ADMIN

    if (!adminId || !token) {
      return res.status(400).json({ success: false, message: 'Missing token or admin identity' });
    }

    await prisma.adminDeviceToken.upsert({
      where: { token },
      update: { adminId, role },
      create: { token, adminId, role }
    });

    return res.status(200).json({ success: true, message: 'Admin device token saved successfully' });
  } catch (error: any) {
    console.error('Save Admin Token Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Fetch user notifications (for Mobile Client)
export const getUserNotifications = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        isDeleted: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({ success: true, notifications });
  } catch (error: any) {
    console.error('Get User Notifications Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Mark all User notifications as read
export const markAllUserNotificationsAsRead = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return res.status(200).json({ success: true, message: 'All user notifications marked as read' });
  } catch (error: any) {
    console.error('Mark All User Notifications As Read Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Mark individual user notification as read
export const markUserNotificationAsRead = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return res.status(200).json({ success: true, notification: updated });
  } catch (error: any) {
    console.error('Mark User Notification As Read Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Delete user notification (soft-delete)
export const deleteUserNotification = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notification = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    await prisma.notification.update({
      where: { id },
      data: {
        isDeleted: true
      }
    });

    return res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    console.error('Delete User Notification Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};
