import express from 'express';
import { addCategory, listCategories, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import adminAuth from '../middleware/adminAuth.js';
import superAdminAuth from '../middleware/superAdminAuth.js';
import upload from '../middleware/multer.js';

const categoryRouter = express.Router();

categoryRouter.post('/add', adminAuth, superAdminAuth, upload.single('image'), addCategory);
categoryRouter.get('/list', listCategories);
categoryRouter.put('/update/:id', adminAuth, superAdminAuth, updateCategory);
categoryRouter.delete('/delete/:id', adminAuth, superAdminAuth, deleteCategory);

export default categoryRouter;