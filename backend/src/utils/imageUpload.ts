import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/rooms');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'room-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Multer upload configuration
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Image compression function
export const compressImage = async (inputPath: string): Promise<string> => {
  const outputPath = inputPath.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '-compressed.webp');
  
  try {
    await sharp(inputPath)
      .resize(1920, 1080, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ 
        quality: 80,
        effort: 6
      })
      .toFile(outputPath);
    
    // Delete original file
    fs.unlinkSync(inputPath);
    
    return outputPath;
  } catch (error) {
    console.error('Image compression error:', error);
    throw error;
  }
};

// Generate thumbnail
export const generateThumbnail = async (inputPath: string): Promise<string> => {
  const thumbnailPath = inputPath.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '-thumb.webp');
  
  try {
    await sharp(inputPath)
      .resize(400, 300, { 
        fit: 'cover' 
      })
      .webp({ 
        quality: 70 
      })
      .toFile(thumbnailPath);
    
    return thumbnailPath;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw error;
  }
};

// Delete image file
export const deleteImage = (imagePath: string): void => {
  try {
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  } catch (error) {
    console.error('Image deletion error:', error);
  }
};
