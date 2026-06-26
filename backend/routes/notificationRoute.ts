import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  saveUserToken,
  saveAdminToken,
  getUserNotifications,
  markAllUserNotificationsAsRead,
  markUserNotificationAsRead,
  deleteUserNotification
} from '../controllers/notificationController.js';
import adminAuth from '../middleware/adminAuth.js';
import userAuth from '../middleware/userAuth.js';

const notificationRouter = express.Router();

// Admin routes
notificationRouter.get('/', adminAuth, getNotifications);
notificationRouter.put('/:id/read', adminAuth, markAsRead);
notificationRouter.put('/read-all', adminAuth, markAllAsRead);
notificationRouter.delete('/:id', adminAuth, deleteNotification);
notificationRouter.post('/save-admin-token', adminAuth, saveAdminToken);

// User routes
notificationRouter.get('/user', userAuth, getUserNotifications);
notificationRouter.put('/user/read-all', userAuth, markAllUserNotificationsAsRead);
notificationRouter.put('/user/:id/read', userAuth, markUserNotificationAsRead);
notificationRouter.delete('/user/:id', userAuth, deleteUserNotification);
notificationRouter.post('/save-user-token', userAuth, saveUserToken);

export default notificationRouter;
