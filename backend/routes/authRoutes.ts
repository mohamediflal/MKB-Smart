import express from 'express';
import { register, login, adminRegister, adminLogin, superAdminLogin, deleteUser, updateUser, updateAdmin, deleteAdmin, listUsers, listAdmins, getAdminProfile, updateUserStatus, sendOtp, forgotPassword, verifyOtp, resetPassword } from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';
import superAdminAuth from '../middleware/superAdminAuth.js';
import upload from '../middleware/multer.ts';
import adminAuth from '../middleware/adminAuth.js';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/send-otp', sendOtp);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/verify-otp', verifyOtp);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/login', login);
authRouter.get('/list-users', superAdminAuth, listUsers);
authRouter.post('/update-user', userAuth, updateUser);
authRouter.post('/update-user', userAuth, upload.single('avatar'), updateUser);
authRouter.delete('/delete-user', userAuth, deleteUser);
authRouter.delete('/admin/delete-user', superAdminAuth, deleteUser);
authRouter.post('/admin/update-user-status', superAdminAuth, updateUserStatus);

authRouter.post('/admin/register', adminRegister);
authRouter.post('/admin/login', adminLogin);
authRouter.get('/admin/me', adminAuth, getAdminProfile);
authRouter.get('/admin/list', superAdminAuth, listAdmins);
authRouter.post('/admin/update', adminAuth, superAdminAuth, updateAdmin);
authRouter.delete('/admin/delete', superAdminAuth, deleteAdmin);
authRouter.post('/superadmin/login', superAdminLogin);

export default authRouter;