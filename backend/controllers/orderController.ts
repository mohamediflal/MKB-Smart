import { Request, Response } from 'express';
import { prisma } from '../configs/prisma.js';

// Auto-transition orders from 'Pending' to 'Placed' after 1 minute
const autoUpdatePendingOrders = async () => {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  try {
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'Pending',
        createdAt: {
          lt: oneMinuteAgo
        }
      }
    });

    for (const order of pendingOrders) {
      const existingHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
      const updatedHistory = [
        ...existingHistory,
        { status: 'Placed', timestamp: new Date().toISOString(), message: 'Order transitioned to Placed automatically after 1 minute' }
      ];

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'Placed',
          statusHistory: updatedHistory
        }
      });
    }
  } catch (err) {
    console.error('Auto Update Pending Orders Error:', err);
  }
};

// Start background periodic check every 15 seconds
setInterval(autoUpdatePendingOrders, 15000);


// placing orders using COD
export const placeOrder = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { items, shippingAddress, subtotal, deliveryFee, total } = req.body;

    if (!items || !shippingAddress || subtotal === undefined || total === undefined) {
      return res.status(400).json({ success: false, message: 'Required fields missing: items, shippingAddress, subtotal, total' });
    }

    const order = await prisma.order.create({
      data: {
        userId,
        items,
        shippingAddress,
        paymentMethod: 'cod',
        subtotal: Number(subtotal),
        deliveryFee: Number(deliveryFee || 0),
        total: Number(total),
        status: 'Pending',
        statusHistory: [
          { status: 'Pending', timestamp: new Date().toISOString(), message: 'Order placed using Cash on Delivery (Pending Verification)' }
        ],
        isPaid: false
      }
    });

    return res.status(201).json({ success: true, message: 'Order placed successfully', order });
  } catch (error: any) {
    console.error('Place Order Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// placing orders using card payment
export const placeCardOrder = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { items, shippingAddress, subtotal, deliveryFee, total } = req.body;

    if (!items || !shippingAddress || subtotal === undefined || total === undefined) {
      return res.status(400).json({ success: false, message: 'Required fields missing: items, shippingAddress, subtotal, total' });
    }

    const order = await prisma.order.create({
      data: {
        userId,
        items,
        shippingAddress,
        paymentMethod: 'card',
        subtotal: Number(subtotal),
        deliveryFee: Number(deliveryFee || 0),
        total: Number(total),
        status: 'Pending',
        statusHistory: [
          { status: 'Pending', timestamp: new Date().toISOString(), message: 'Order placed and paid using Card (Pending Verification)' }
        ],
        isPaid: true
      }
    });

    return res.status(201).json({ success: true, message: 'Order placed successfully', order });
  } catch (error: any) {
    console.error('Place Card Order Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// get all orders for a user
export const getUserOrders = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await autoUpdatePendingOrders();

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, orders });
  } catch (error: any) {
    console.error('Get User Orders Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Show all orders data for admin panel
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    await autoUpdatePendingOrders();

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, orders });
  } catch (error: any) {
    console.error('Get All Orders Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// get all orders for admin to update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { orderId, status, message } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ success: false, message: 'Required fields missing: orderId, status' });
    }

    if (status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Admin or Super Admin cannot change order status to Cancelled.' });
    }

    if (status === 'Pending') {
      return res.status(400).json({ success: false, message: 'Admin or Super Admin cannot change order status to Pending.' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'Pending') {
      return res.status(400).json({ success: false, message: 'Cannot update status of a Pending order. Please wait for it to transition to Placed.' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot update status of a Cancelled order.' });
    }

    const existingHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    const updatedHistory = [
      ...existingHistory,
      { status, timestamp: new Date().toISOString(), message: message || `Status updated to ${status}` }
    ];

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        statusHistory: updatedHistory
      }
    });

    return res.status(200).json({ success: true, message: 'Order status updated successfully', order: updated });
  } catch (error: any) {
    console.error('Update Order Status Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Cancel an order (by user)
export const cancelUserOrder = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;
    const { orderId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this order' });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Order can only be cancelled while status is Pending (first 1 minute).' });
    }

    const existingHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    const updatedHistory = [
      ...existingHistory,
      { status: 'Cancelled', timestamp: new Date().toISOString(), message: 'Order cancelled by customer' }
    ];

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'Cancelled',
        statusHistory: updatedHistory
      }
    });

    return res.status(200).json({ success: true, message: 'Order cancelled successfully', order: updated });
  } catch (error: any) {
    console.error('Cancel Order Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};