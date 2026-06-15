import express from 'express';
import { toggleFavorite, listFavorites, checkFavorites } from '../controllers/favoriteController.js';
import userAuth from '../middleware/userAuth.js';

const favoriteRouter = express.Router();

favoriteRouter.post('/toggle', userAuth, toggleFavorite);
favoriteRouter.get('/list', userAuth, listFavorites);
favoriteRouter.get('/check', userAuth, checkFavorites);

export default favoriteRouter;
