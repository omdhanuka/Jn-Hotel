import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

interface CompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export const compressImage = async (
  inputPath: string,
  options: CompressionOptions = {}
): Promise<{ path: string; originalSize: number; compressedSize: number; compressionRatio: number }> => {
  try {
    const {
      quality = 80,
      maxWidth = 1920,
      maxHeight = 1080
    } = options;

    // Get original file size
    const originalStats = fs.statSync(inputPath);
    const originalSize = originalStats.size;

    // Generate compressed filename
    const parsedPath = path.parse(inputPath);
    const compressedFilename = `${parsedPath.name}-compressed${parsedPath.ext}`;
    const outputPath = path.join(parsedPath.dir, compressedFilename);

    // Compress and resize image
    await sharp(inputPath)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality, mozjpeg: true })
      .toFile(outputPath);

    // Get compressed file size
    const compressedStats = fs.statSync(outputPath);
    const compressedSize = compressedStats.size;

    // Calculate compression ratio
    const compressionRatio = Math.round(((originalSize - compressedSize) / originalSize) * 100);

    // Delete original file
    fs.unlinkSync(inputPath);

    return {
      path: outputPath,
      originalSize,
      compressedSize,
      compressionRatio
    };
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error('Failed to compress image');
  }
};

export const compressMultipleImages = async (
  filePaths: string[],
  options: CompressionOptions = {}
): Promise<Array<{ path: string; originalSize: number; compressedSize: number; compressionRatio: number }>> => {
  const compressedResults: Array<{ path: string; originalSize: number; compressedSize: number; compressionRatio: number }> = [];

  for (const filePath of filePaths) {
    try {
      const result = await compressImage(filePath, options);
      compressedResults.push(result);
    } catch (error) {
      console.error(`Failed to compress ${filePath}:`, error);
      // Keep original if compression fails
      const stats = fs.statSync(filePath);
      compressedResults.push({
        path: filePath,
        originalSize: stats.size,
        compressedSize: stats.size,
        compressionRatio: 0
      });
    }
  }

  return compressedResults;
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
