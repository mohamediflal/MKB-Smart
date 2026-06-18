import { Request, Response } from 'express';
import { prisma } from '../configs/prisma.js';

// Toggle favorite status
export const toggleFavorite = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      // Unfavorite
      await prisma.favorite.delete({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });
      return res.status(200).json({
        success: true,
        message: 'Product removed from favorites',
        isFavorite: false,
      });
    } else {
      // Favorite
      await prisma.favorite.create({
        data: {
          userId,
          productId,
        },
      });
      return res.status(200).json({
        success: true,
        message: 'Product added to favorites',
        isFavorite: true,
      });
    }
  } catch (error: any) {
    console.error('Toggle Favorite Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Get all favorites for user
export const listFavorites = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Extract product records
    const products = favorites.map(fav => fav.product);

    return res.status(200).json(products);
  } catch (error: any) {
    console.error('List Favorites Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Check which product IDs are favorited
export const checkFavorites = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(200).json([]);
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: {
        productId: true,
      },
    });

    const favoriteIds = favorites.map(f => f.productId);
    return res.status(200).json(favoriteIds);
  } catch (error: any) {
    console.error('Check Favorites Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};
