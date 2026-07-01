import { Request, Response } from 'express';
import { prisma } from '../configs/prisma.js';
import { handleOrderStatusChange, checkAndNotifyStock } from '../services/notificationService.js';

// Helper to map DB order to client format
const formatOrder = (order: any) => {
  if (!order) return null;

  const createdAtTime = new Date(order.createdAt).getTime();
  const timeDifference = Date.now() - createdAtTime;
  
  let status = order.status;
  if (order.status === 'PLACED') {
    if (timeDifference < 60000) {
      status = 'Pending';
    } else {
      status = 'Placed';
    }
  } else if (order.status === 'PROCESSING') {
    status = 'Processing';
  } else if (order.status === 'SHIPPED') {
    status = 'Shipped';
  } else if (order.status === 'DELIVERED') {
    status = 'Delivered';
  } else if (order.status === 'CANCELLED') {
    status = 'Cancelled';
  }

  let statusHistory = Array.isArray(order.statusHistory) ? [...order.statusHistory] : [];

  // If logical status transitioned to 'Placed' or beyond, but 'Placed' is missing in history, inject it dynamically
  if (order.status === 'PLACED' && timeDifference >= 60000) {
    const hasPlaced = statusHistory.some((h: any) => h.status === 'Placed');
    if (!hasPlaced) {
      statusHistory.push({
        status: 'Placed',
        timestamp: new Date(createdAtTime + 60000).toISOString(),
        message: 'Order transitioned to Placed automatically after 1 minute'
      });
    }
  } else if (order.status !== 'PLACED' && order.status !== 'CANCELLED') {
    // If it's in a state beyond PLACED (PROCESSING, SHIPPED, DELIVERED), ensure Placed is in the history
    const hasPlaced = statusHistory.some((h: any) => h.status === 'Placed');
    if (!hasPlaced) {
      const pendingIndex = statusHistory.findIndex((h: any) => h.status === 'Pending');
      const placedEvent = {
        status: 'Placed',
        timestamp: new Date(createdAtTime + 60000).toISOString(),
        message: 'Order transitioned to Placed automatically after 1 minute'
      };
      if (pendingIndex !== -1) {
        statusHistory.splice(pendingIndex + 1, 0, placedEvent);
      } else {
        statusHistory.unshift(placedEvent);
      }
    }
  }

  let paymentMethod = order.paymentMethod;
  if (order.paymentMethod === 'CASH_ON_DELIVERY') {
    paymentMethod = 'cod';
  } else if (order.paymentMethod === 'CARD') {
    paymentMethod = 'card';
  }

  return {
    ...order,
    status,
    statusHistory,
    paymentMethod
  };
};

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

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items must be a valid array' });
    }

    const order = await prisma.$transaction(async (tx) => {
      // Deduct stock for each item
      for (const item of items) {
        if (!item.id || item.quantity === undefined) {
          throw new Error('Invalid item structure in order');
        }

        const product = await tx.product.findUnique({
          where: { id: item.id }
        });

        if (!product) {
          throw new Error(`Product not found: ${item.name || item.id}`);
        }

        const currentStock = product.stock ?? 0;
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product "${product.name}". Available: ${currentStock}, Ordered: ${item.quantity}`);
        }

        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // Create order
      return await tx.order.create({
        data: {
          userId,
          items,
          shippingAddress,
          paymentMethod: 'CASH_ON_DELIVERY',
          subtotal: Number(subtotal),
          deliveryFee: Number(deliveryFee || 0),
          total: Number(total),
          status: 'PLACED',
          statusHistory: [
            { status: 'Pending', timestamp: new Date().toISOString(), message: 'Order placed using Cash on Delivery (Pending Verification)' }
          ],
          isPaid: false
        }
      });
    });

    // Run stock notifications asynchronously
    for (const item of items) {
      checkAndNotifyStock(item.id).catch((err) => {
        console.error(`Error checking/notifying stock for product ${item.id}:`, err);
      });
    }

    // Delay notifications by 1 minute (Pending status duration)
    setTimeout(async () => {
      try {
        const currentOrder = await prisma.order.findUnique({
          where: { id: order.id }
        });
        if (currentOrder && currentOrder.status === 'PLACED') {
          await handleOrderStatusChange(order.id, 'PLACED');
        }
      } catch (err) {
        console.error('Error in delayed notification trigger:', err);
      }
    }, 60000);

    return res.status(201).json({ success: true, message: 'Order placed successfully', order: formatOrder(order) });
  } catch (error: any) {
    console.error('Place Order Error:', error);
    const isValidationError = error.message?.includes('Insufficient stock') || error.message?.includes('Product not found') || error.message?.includes('Invalid item structure');
    const statusCode = isValidationError ? 400 : 500;
    return res.status(statusCode).json({ success: false, message: error.message || 'Internal server error' });
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

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items must be a valid array' });
    }

    const order = await prisma.$transaction(async (tx) => {
      // Deduct stock for each item
      for (const item of items) {
        if (!item.id || item.quantity === undefined) {
          throw new Error('Invalid item structure in order');
        }

        const product = await tx.product.findUnique({
          where: { id: item.id }
        });

        if (!product) {
          throw new Error(`Product not found: ${item.name || item.id}`);
        }

        const currentStock = product.stock ?? 0;
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product "${product.name}". Available: ${currentStock}, Ordered: ${item.quantity}`);
        }

        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // Create order
      return await tx.order.create({
        data: {
          userId,
          items,
          shippingAddress,
          paymentMethod: 'CARD',
          subtotal: Number(subtotal),
          deliveryFee: Number(deliveryFee || 0),
          total: Number(total),
          status: 'PLACED',
          statusHistory: [
            { status: 'Pending', timestamp: new Date().toISOString(), message: 'Order placed and paid using Card (Pending Verification)' }
          ],
          isPaid: true
        }
      });
    });

    // Run stock notifications asynchronously
    for (const item of items) {
      checkAndNotifyStock(item.id).catch((err) => {
        console.error(`Error checking/notifying stock for product ${item.id}:`, err);
      });
    }

    // Delay notifications by 1 minute (Pending status duration)
    setTimeout(async () => {
      try {
        const currentOrder = await prisma.order.findUnique({
          where: { id: order.id }
        });
        if (currentOrder && currentOrder.status === 'PLACED') {
          await handleOrderStatusChange(order.id, 'PLACED');
        }
      } catch (err) {
        console.error('Error in delayed notification trigger:', err);
      }
    }, 60000);

    return res.status(201).json({ success: true, message: 'Order placed successfully', order: formatOrder(order) });
  } catch (error: any) {
    console.error('Place Card Order Error:', error);
    const isValidationError = error.message?.includes('Insufficient stock') || error.message?.includes('Product not found') || error.message?.includes('Invalid item structure');
    const statusCode = isValidationError ? 400 : 500;
    return res.status(statusCode).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// get all orders for a user
export const getUserOrders = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const formattedOrders = orders.map(order => formatOrder(order));
    return res.status(200).json({ success: true, orders: formattedOrders });
  } catch (error: any) {
    console.error('Get User Orders Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Show all orders data for admin panel
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    const formattedOrders = orders.map(order => formatOrder(order));
    return res.status(200).json({ success: true, orders: formattedOrders });
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

    if (status === 'Cancelled' || status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Admin or Super Admin cannot change order status to Cancelled.' });
    }

    if (status === 'Pending' || status === 'PENDING') {
      return res.status(400).json({ success: false, message: 'Admin or Super Admin cannot change order status to Pending.' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Determine current logical status
    const createdAtTime = new Date(order.createdAt).getTime();
    const timeDifference = Date.now() - createdAtTime;
    
    if (order.status === 'PLACED' && timeDifference < 60000) {
      return res.status(400).json({ success: false, message: 'Cannot update status of a Pending order. Please wait for it to transition to Placed.' });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Cannot update status of a Cancelled order.' });
    }

    if (order.status === 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Cannot update status of a Delivered order.' });
    }

    // Map input status to DB enum
    let dbStatus: 'PLACED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    let displayStatus: string;
    
    const statusLower = status.toLowerCase();
    if (statusLower === 'placed') {
      dbStatus = 'PLACED';
      displayStatus = 'Placed';
    } else if (statusLower === 'processing') {
      dbStatus = 'PROCESSING';
      displayStatus = 'Processing';
    } else if (statusLower === 'shipped') {
      dbStatus = 'SHIPPED';
      displayStatus = 'Shipped';
    } else if (statusLower === 'delivered') {
      dbStatus = 'DELIVERED';
      displayStatus = 'Delivered';
    } else {
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    }

    let existingHistory = Array.isArray(order.statusHistory) ? [...order.statusHistory] : [];
    
    // Ensure the 'Placed' transition event is recorded in the history if it has logically passed but is not in DB yet
    const hasPlaced = existingHistory.some((h: any) => h.status === 'Placed');
    if (!hasPlaced) {
      existingHistory.push({
        status: 'Placed',
        timestamp: new Date(createdAtTime + 60000).toISOString(),
        message: 'Order transitioned to Placed automatically after 1 minute'
      });
    }

    const updatedHistory = [
      ...existingHistory,
      { status: displayStatus, timestamp: new Date().toISOString(), message: message || `Status updated to ${displayStatus}` }
    ];

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: dbStatus,
        statusHistory: updatedHistory
      }
    });

    await handleOrderStatusChange(orderId, dbStatus);

    return res.status(200).json({ success: true, message: 'Order status updated successfully', order: formatOrder(updated) });
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

    // Determine current logical status
    const createdAtTime = new Date(order.createdAt).getTime();
    const timeDifference = Date.now() - createdAtTime;
    const isPending = order.status === 'PLACED' && timeDifference < 60000;

    if (!isPending) {
      return res.status(400).json({ success: false, message: 'Order can only be cancelled while status is Pending (first 1 minute).' });
    }

    const existingHistory = Array.isArray(order.statusHistory) ? [...order.statusHistory] : [];
    const updatedHistory = [
      ...existingHistory,
      { status: 'Cancelled', timestamp: new Date().toISOString(), message: 'Order cancelled by customer' }
    ];

    const updated = await prisma.$transaction(async (tx) => {
      // Replenish stock for each item in the order
      const orderItems = order.items as any;
      if (Array.isArray(orderItems)) {
        for (const item of orderItems) {
          if (item.id && item.quantity) {
            await tx.product.update({
              where: { id: item.id },
              data: {
                stock: {
                  increment: item.quantity
                }
              }
            });
          }
        }
      }

      return await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          statusHistory: updatedHistory
        }
      });
    });

    // Run stock notifications asynchronously for replenishment checks
    const orderItems = order.items as any;
    if (Array.isArray(orderItems)) {
      for (const item of orderItems) {
        if (item.id) {
          checkAndNotifyStock(item.id).catch((err) => {
            console.error(`Error checking/notifying stock replenishment for product ${item.id}:`, err);
          });
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Order cancelled successfully', order: formatOrder(updated) });
  } catch (error: any) {
    console.error('Cancel Order Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};