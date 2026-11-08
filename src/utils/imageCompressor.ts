/**
 * Client-Side Smart Image Compressor
 * Reduces raw mobile photos (often 4MB - 12MB from modern smartphone cameras)
 * into lightweight, crystal-clear 65% quality JPEG/WebP files (~40KB - 80KB).
 * Crucial for smooth loading and zero quota crashes on Nigerian 3G networks.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default: 0.65)
  format?: 'image/jpeg' | 'image/webp';
}

export async function compressImage(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.65,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image element'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Preserve aspect ratio while capping longest side
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original if canvas 2D fails
          resolve(event.target?.result as string);
          return;
        }

        // Fill background white for transparent PNGs converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // High quality bicubic image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const compressedDataUrl = canvas.toDataURL(format, quality);
          resolve(compressedDataUrl);
        } catch {
          // Fallback to standard jpeg
          const fallbackDataUrl = canvas.toDataURL('image/jpeg', 0.65);
          resolve(fallbackDataUrl);
        }
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
