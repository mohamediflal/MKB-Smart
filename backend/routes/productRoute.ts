import express from 'express';
import { addProduct, listProducts, updateProduct, deleteProduct, sigleProduct } from '../controllers/productController.js';
import adminAuth from '../middleware/adminAuth.js';
import upload from '../middleware/multer.ts';


const productRouter = express.Router();

productRouter.post('/add', adminAuth, upload.single('image'), addProduct);
productRouter.get('/list', listProducts);
productRouter.put('/update/:id', adminAuth, upload.single('image'), updateProduct);
productRouter.delete('/delete/:id', adminAuth, deleteProduct);
productRouter.get('/single/:id', sigleProduct);

export default productRouter;