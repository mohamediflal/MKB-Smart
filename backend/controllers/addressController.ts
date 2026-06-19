import { Request, Response } from 'express';
import { prisma } from '../configs/prisma.js';

// Add new Address
export const addAddress = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { fullName, label, phone, street, city, postalCode, isPrimary, district, lat, lng } = req.body;

    if (!fullName || !label || !street || !city) {
      return res.status(400).json({ success: false, message: 'Required fields missing: fullName, label, street, city' });
    }

    // If setting as primary, unset other primary addresses first
    if (isPrimary) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        fullName,
        label,
        phone: phone || '',
        address: street,
        city,
        district: district || city,
        zip: postalCode || '',
        isDefault: isPrimary || false,
        lat: lat !== undefined ? Number(lat) : 0.0,
        lng: lng !== undefined ? Number(lng) : 0.0,
      },
    });

    return res.status(201).json({ success: true, message: 'Address added successfully', address });
  } catch (error: any) {
    console.error('Add Address Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// List all Addresses for a user
export const listAddresses = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, addresses });
  } catch (error: any) {
    console.error('List Addresses Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Update Address Details
export const updateAddress = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Address ID is required' });
    }

    const { fullName, label, phone, street, city, postalCode, isPrimary, district, lat, lng } = req.body;

    // Check if address exists and belongs to the user
    const existingAddress = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!existingAddress) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized' });
    }

    // If updating to primary, unset other primary addresses first
    if (isPrimary) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        fullName: fullName !== undefined ? fullName : existingAddress.fullName,
        label: label !== undefined ? label : existingAddress.label,
        phone: phone !== undefined ? phone : existingAddress.phone,
        address: street !== undefined ? street : existingAddress.address,
        city: city !== undefined ? city : existingAddress.city,
        district: district !== undefined ? district : (city !== undefined ? city : existingAddress.district),
        zip: postalCode !== undefined ? postalCode : existingAddress.zip,
        isDefault: isPrimary !== undefined ? isPrimary : existingAddress.isDefault,
        lat: lat !== undefined ? Number(lat) : existingAddress.lat,
        lng: lng !== undefined ? Number(lng) : existingAddress.lng,
      },
    });

    return res.status(200).json({ success: true, message: 'Address updated successfully', address: updated });
  } catch (error: any) {
    console.error('Update Address Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

// Remove Address
export const deleteAddress = async (req: Request & { userId?: string }, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Address ID is required' });
    }

    // Check if address exists and belongs to the user
    const existingAddress = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!existingAddress) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized' });
    }

    await prisma.address.delete({
      where: { id },
    });

    return res.status(200).json({ success: true, message: 'Address deleted successfully' });
  } catch (error: any) {
    console.error('Delete Address Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};