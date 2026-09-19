import express from 'express';
import { placeOrder, placeCardOrder, createPaymentIntent, getUserOrders, updateOrderStatus, getAllOrders, cancelUserOrder } from '../controllers/orderController';
import userAuth from '../middleware/userAuth.js';
import adminAuth from '../middleware/adminAuth.js';
import superAdminAuth from '../middleware/superAdminAuth.js';

const orderRouter = express.Router();

orderRouter.post('/place', userAuth, placeOrder);
orderRouter.post('/place-card', userAuth, placeCardOrder);
orderRouter.post('/create-payment-intent', userAuth, createPaymentIntent);

orderRouter.get('/user-orders', userAuth, getUserOrders);
orderRouter.post('/cancel', userAuth, cancelUserOrder);

orderRouter.get('/all-orders', adminAuth, getAllOrders);
orderRouter.put('/update-status', adminAuth, updateOrderStatus);

export default orderRouter;