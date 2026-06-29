import { Request, Response } from 'express';
import { prisma } from '../configs/prisma.js';
import cloudinary from '../configs/cloudinary.js';

// Helper to generate a URL-friendly slug
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// Helper to upload file buffer to Cloudinary via data URI
const uploadToCloudinary = async (file: { buffer: Buffer; mimetype: string }): Promise<string> => {
  const b64 = Buffer.from(file.buffer).toString('base64');
  const dataURI = `data:${file.mimetype};base64,${b64}`;
  const result = await cloudinary.uploader.upload(dataURI, {
    folder: 'categories',
    resource_type: 'image',
  });
  return result.secure_url;
};

// Add New Category
export const addCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category already exists
    const existing = await prisma.category.findUnique({
      where: { name: name.trim() }
    });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    let imageUrl = '';
    const file = (req as any).file;
    if (file) {
      imageUrl = await uploadToCloudinary(file);
    }

    const slug = generateSlug(name);

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        image: imageUrl || null,
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error: any) {
    console.error('Add Category Error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// List All Categories
export const listCategories = async (req: Request, res: Response) => {
  try {
    const categoriesList = await prisma.category.findMany({
      include: {
        products: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatted = categoriesList.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      emoji: c.image || '📦',
      productCount: c.products.length,
      revenue: 0,
    }));

    return res.status(200).json(formatted);
  } catch (error: any) {
    console.error('List Categories Error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Update Category Details
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name } = req.body;

    const existing = await prisma.category.findUnique({
      where: { id }
    });
    if (!existing) {
      return res.status(404).json({ message: 'Category not found' });
    }

    let imageUrl = existing.image;
    const file = (req as any).file;
    if (file) {
      imageUrl = await uploadToCloudinary(file);
    }

    const data: any = {};
    if (name) {
      data.name = name.trim();
      data.slug = generateSlug(name);
    }
    if (file) {
      data.image = imageUrl;
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data,
    });

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        slug: updatedCategory.slug,
        emoji: updatedCategory.image || '📦',
        productCount: 0,
        revenue: 0,
      },
    });
  } catch (error: any) {
    console.error('Update Category Error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Remove Category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.category.findUnique({
      where: { id }
    });
    if (!existing) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category is associated with any products
    const productCount = await prisma.product.count({
      where: { categoryId: id }
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'This category cannot be deleted because it is currently associated with one or more products. Please remove or reassign those products before deleting the category.'
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete Category Error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};