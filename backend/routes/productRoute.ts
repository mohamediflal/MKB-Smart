import express from 'express';
import { addProduct, listProducts, updateProduct, deleteProduct, sigleProduct } from '../controllers/productController.js';
import adminAuth from '../middleware/adminAuth.js';
import upload from '../middleware/multer.js';
import superAdminAuth from '../middleware/superAdminAuth.js';

const productRouter = express.Router();

productRouter.post('/add', adminAuth, superAdminAuth, upload.single('image'), addProduct);
productRouter.get('/list', listProducts);
productRouter.put('/update/:id', adminAuth, superAdminAuth, updateProduct);
productRouter.delete('/delete/:id', adminAuth, superAdminAuth, deleteProduct);
productRouter.get('/single/:id', sigleProduct);

export default productRouter;