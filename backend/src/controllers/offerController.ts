import { Request, Response } from 'express';
import Offer from '../models/Offer';

// Get all offers (public - only active offers for customers)
export const getAllOffers = async (req: Request, res: Response) => {
  try {
    const offers = await Offer.find()
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      offers
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching offers'
    });
  }
};

// Get single offer by ID
export const getOfferById = async (req: Request, res: Response) => {
  try {
    const offer = await Offer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }
    
    res.json({
      success: true,
      offer
    });
  } catch (error) {
    console.error('Error fetching offer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching offer'
    });
  }
};

// Get offer by promo code
export const getOfferByCode = async (req: Request, res: Response) => {
  try {
    const offer = await Offer.findOne({ 
      code: req.params.code.toUpperCase(),
      isActive: true,
      validUntil: { $gte: new Date() }
    });
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired promo code'
      });
    }
    
    res.json({
      success: true,
      offer
    });
  } catch (error) {
    console.error('Error fetching offer by code:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching offer'
    });
  }
};

// Create new offer (admin only)
export const createOffer = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      discount,
      image,
      features,
      validUntil,
      category,
      price,
      originalPrice,
      code,
      isActive
    } = req.body;

    // Check if promo code already exists
    const existingOffer = await Offer.findOne({ code: code.toUpperCase() });
    if (existingOffer) {
      return res.status(400).json({
        success: false,
        message: 'Promo code already exists'
      });
    }

    const offer = new Offer({
      title,
      description,
      discount,
      image,
      features,
      validUntil,
      category,
      price,
      originalPrice,
      code: code.toUpperCase(),
      isActive
    });

    await offer.save();

    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      offer
    });
  } catch (error: any) {
    console.error('Error creating offer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating offer'
    });
  }
};

// Update offer (admin only)
export const updateOffer = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      discount,
      image,
      features,
      validUntil,
      category,
      price,
      originalPrice,
      code,
      isActive
    } = req.body;

    const offer = await Offer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    // Check if code is being changed and if new code already exists
    if (code && code.toUpperCase() !== offer.code) {
      const existingOffer = await Offer.findOne({ code: code.toUpperCase() });
      if (existingOffer) {
        return res.status(400).json({
          success: false,
          message: 'Promo code already exists'
        });
      }
    }

    offer.title = title || offer.title;
    offer.description = description || offer.description;
    offer.discount = discount !== undefined ? discount : offer.discount;
    offer.image = image || offer.image;
    offer.features = features || offer.features;
    offer.validUntil = validUntil || offer.validUntil;
    offer.category = category || offer.category;
    offer.price = price !== undefined ? price : offer.price;
    offer.originalPrice = originalPrice !== undefined ? originalPrice : offer.originalPrice;
    offer.code = code ? code.toUpperCase() : offer.code;
    offer.isActive = isActive !== undefined ? isActive : offer.isActive;

    await offer.save();

    res.json({
      success: true,
      message: 'Offer updated successfully',
      offer
    });
  } catch (error: any) {
    console.error('Error updating offer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating offer'
    });
  }
};

// Toggle offer active status (admin only)
export const toggleOfferStatus = async (req: Request, res: Response) => {
  try {
    const offer = await Offer.findById(req.params.id);
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    offer.isActive = req.body.isActive !== undefined ? req.body.isActive : !offer.isActive;
    await offer.save();

    res.json({
      success: true,
      message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
      offer
    });
  } catch (error) {
    console.error('Error toggling offer status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling offer status'
    });
  }
};

// Delete offer (admin only)
export const deleteOffer = async (req: Request, res: Response) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting offer'
    });
  }
};
