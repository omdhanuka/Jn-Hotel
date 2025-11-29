import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/rooms');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
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
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Compress image
export const compressImage = async (
  inputPath: string, 
  quality: number = 80
): Promise<{ outputPath: string; originalSize: number; compressedSize: number }> => {
  const outputPath = inputPath.replace(path.extname(inputPath), '-compressed' + path.extname(inputPath));
  
  const originalStats = fs.statSync(inputPath);
  const originalSize = originalStats.size;

  await sharp(inputPath)
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toFile(outputPath);

  const compressedStats = fs.statSync(outputPath);
  const compressedSize = compressedStats.size;

  // Delete original if compression successful
  fs.unlinkSync(inputPath);

  return { outputPath, originalSize, compressedSize };
};

// Generate thumbnail
export const generateThumbnail = async (
  inputPath: string, 
  quality: number = 70
): Promise<string> => {
  const thumbnailPath = inputPath.replace(path.extname(inputPath), '-thumb' + path.extname(inputPath));

  await sharp(inputPath)
    .resize(400, 300, { fit: 'cover' })
    .jpeg({ quality })
    .toFile(thumbnailPath);

  return thumbnailPath;
};

// Delete image
export const deleteImage = (imagePath: string): void => {
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }
};
