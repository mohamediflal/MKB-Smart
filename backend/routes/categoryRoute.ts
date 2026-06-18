import express from 'express';
import { addCategory, listCategories, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import adminAuth from '../middleware/adminAuth.js';
import upload from '../middleware/multer.ts';


const categoryRouter = express.Router();

categoryRouter.post('/add', adminAuth, upload.single('image'), addCategory);
categoryRouter.get('/list', listCategories);
categoryRouter.put('/update/:id', adminAuth, upload.single('image'), updateCategory);
categoryRouter.delete('/delete/:id', adminAuth, deleteCategory);

export default categoryRouter;