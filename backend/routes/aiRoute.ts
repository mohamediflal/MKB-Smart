import express from 'express';
import {
  generateRecipeController,
  chatController,
  getRecipeHistoryController,
  createRecipeHistoryController,
  deleteRecipeHistoryController,
} from '../controllers/aiController.js';
import userAuth from '../middleware/userAuth.js';

const router = express.Router();

// POST /api/ai/generate-recipe
router.post('/generate-recipe', generateRecipeController);

// POST /api/ai/chat
router.post('/chat', chatController);

// Recipe History routes (User Isolated)
router.get('/history', userAuth, getRecipeHistoryController);
router.post('/history', userAuth, createRecipeHistoryController);
router.delete('/history/:id', userAuth, deleteRecipeHistoryController);

export default router;

