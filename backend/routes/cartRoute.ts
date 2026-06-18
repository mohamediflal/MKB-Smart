import express from 'express';
import { addToCart, updateCartData, getCartData} from '../controllers/cartController.js';
import userAuth from '../middleware/userAuth.js';

const cartRouter = express.Router();

cartRouter.post('/add', userAuth, addToCart);
cartRouter.put('/update', userAuth, updateCartData);
cartRouter.get('/get', userAuth, getCartData);

export default cartRouter;