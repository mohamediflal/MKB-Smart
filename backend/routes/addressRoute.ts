import express from 'express';
import { addAddress, listAddresses, updateAddress, deleteAddress } from '../controllers/addressController.js';
import userAuth from '../middleware/userAuth.js';

const addressRouter = express.Router();

addressRouter.post('/add', userAuth, addAddress);
addressRouter.get('/list', userAuth, listAddresses);
addressRouter.put('/update/:id', userAuth, updateAddress);
addressRouter.delete('/delete/:id', userAuth, deleteAddress);

export default addressRouter;