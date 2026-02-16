
/**
 * Production-grade image processing utility for mobile devices.
 * Handles resizing, JPEG compression, and EXIF metadata removal.
 */

interface ProcessImageOptions {
    maxWidth: number;
    quality: number;
    maxFileSizeKB: number;
}

export const processImage = async (
    base64String: string,
    options: ProcessImageOptions = { maxWidth: 1024, quality: 0.7, maxFileSizeKB: 500 }
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Handle Resizing
            if (width > options.maxWidth) {
                height = Math.round((height * options.maxWidth) / width);
                width = options.maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            // Drawing to canvas automatically strips EXIF metadata
            ctx.drawImage(img, 0, 0, width, height);

            // Iterative compression to ensure < 500KB
            let currentQuality = options.quality;
            let resultBase64 = canvas.toDataURL('image/jpeg', currentQuality);

            // Rough check for base64 size (approx 1.33x larger than binary)
            const getBinarySize = (b64: string) => Math.round((b64.split(',')[1].length * 3) / 4);

            let currentSizeKB = getBinarySize(resultBase64) / 1024;

            while (currentSizeKB > options.maxFileSizeKB && currentQuality > 0.1) {
                currentQuality -= 0.1;
                resultBase64 = canvas.toDataURL('image/jpeg', currentQuality);
                currentSizeKB = getBinarySize(resultBase64) / 1024;
            }

            console.log(`Image processed: ${width}x${height}, Quality: ${currentQuality.toFixed(2)}, Final Size: ${currentSizeKB.toFixed(2)}KB`);
            resolve(resultBase64);
        };
        img.onerror = reject;
        img.src = base64String;
    });
};
