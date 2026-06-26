import { Request, Response } from 'express';
import { prisma } from '../configs/prisma.js';
import cloudinary from '../configs/cloudinary.js';
import { checkAndNotifyStock } from '../services/notificationService.js';

// Helper to upload file buffer to Cloudinary via data URI
const uploadToCloudinary = async (file: { buffer: Buffer; mimetype: string }): Promise<string> => {
  const b64 = Buffer.from(file.buffer).toString('base64');
  const dataURI = `data:${file.mimetype};base64,${b64}`;
  const result = await cloudinary.uploader.upload(dataURI, {
    folder: 'products',
    resource_type: 'image',
  });
  return result.secure_url;
};

// Add New Product
export const addProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, originalPrice, category, unit, stock, isOrganic, status } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }

    // Find category
    const categoryRecord = await prisma.category.findUnique({
      where: { name: category.trim() }
    });
    if (!categoryRecord) {
      return res.status(400).json({ message: `Category '${category}' not found` });
    }

    let imageUrl = '';
    const file = (req as any).file;
    if (file) {
      imageUrl = await uploadToCloudinary(file);
    } else {
      return res.status(400).json({ message: 'Product image is required' });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : '',
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : 0,
        image: imageUrl,
        categoryId: categoryRecord.id,
        unit: unit || 'piece',
        stock: stock ? parseInt(stock, 10) : 0,
        isOrganic: isOrganic === 'true' || isOrganic === true,
        status: status ? (status.trim().toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') : 'ACTIVE',
      },
      include: {
        category: true
      }
    });

    await checkAndNotifyStock(product.id);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error: any) {
    console.error('Add Product Error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// List All Products
export const listProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return res.status(200).json(products);
  } catch (error: any) {
    console.error('List Products Error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Update Product Details
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, description, price, originalPrice, category, unit, stock, isOrganic, status } = req.body;

    const existing = await prisma.product.findUnique({
      where: { id }
    });
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const data: any = {};
    if (name) data.name = name.trim();
    if (description !== undefined) data.description = description ? description.trim() : '';
    if (price !== undefined) data.price = parseFloat(price);
    if (originalPrice !== undefined) data.originalPrice = parseFloat(originalPrice);
    if (unit !== undefined) data.unit = unit;
    if (stock !== undefined) data.stock = parseInt(stock, 10);
    if (isOrganic !== undefined) data.isOrganic = isOrganic === 'true' || isOrganic === true;
    if (status !== undefined) data.status = status.trim().toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    if (category) {
      const categoryRecord = await prisma.category.findUnique({
        where: { name: category.trim() }
      });
      if (!categoryRecord) {
        return res.status(400).json({ message: `Category '${category}' not found` });
      }
      data.categoryId = categoryRecord.id;
    }

    const file = (req as any).file;
    if (file) {
      data.image = await uploadToCloudinary(file);
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: true
      }
    });

    await checkAndNotifyStock(updated.id);

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (error: any) {
    console.error('Update Product Error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Remove Product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.product.findUnique({
      where: { id }
    });
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await prisma.product.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete Product Error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Get Single Product Details
export const sigleProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json(product);
  } catch (error: any) {
    console.error('Get Single Product Error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};
