import express from 'express';
import { register, login, adminRegister, adminLogin, superAdminLogin, deleteUser, updateUser, updateAdmin, deleteAdmin, listUsers, listAdmins } from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';
import superAdminAuth from '../middleware/superAdminAuth.js';
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/list-users', superAdminAuth, listUsers);
authRouter.post('/update-user', userAuth, upload.single('avatar'), updateUser);
authRouter.delete('/delete-user', userAuth, superAdminAuth, deleteUser);

authRouter.post('/admin/register', adminRegister);
authRouter.post('/admin/login', adminLogin);
authRouter.get('/admin/list', superAdminAuth, listAdmins);
authRouter.post('/admin/update', adminAuth, superAdminAuth, updateAdmin);
authRouter.delete('/admin/delete', superAdminAuth, deleteAdmin);
authRouter.post('/superadmin/login', superAdminLogin);

export default authRouter;