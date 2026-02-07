/**
 * Social Image Generator Service
 * Generates optimized images for Instagram Stories (1080x1920)
 */

import logoImage from '@/assets/logo.png';

interface ImageGeneratorParams {
    artistName: string;
    artistImageUrl: string;
    concertDate: string;
    venueName: string;
    gradientColors: string[];
}

export class SocialImageGenerator {
    private static readonly CANVAS_WIDTH = 1080;
    private static readonly CANVAS_HEIGHT = 1920;

    /**
     * Generate an Instagram Story image
     */
    static async generateStoryImage(params: ImageGeneratorParams): Promise<Blob> {
        const canvas = document.createElement('canvas');
        canvas.width = this.CANVAS_WIDTH;
        canvas.height = this.CANVAS_HEIGHT;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        // Draw gradient background
        this.drawGradientBackground(ctx, params.gradientColors);

        // Draw Conciertos LATAM logo at the top
        await this.drawConciertosLogo(ctx);

        // Load and draw artist image
        await this.drawArtistImage(ctx, params.artistImageUrl);

        // Draw text content
        this.drawTextContent(ctx, params);

        // Convert to blob
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to generate image blob'));
                    }
                },
                'image/png',
                1.0
            );
        });
    }

    /**
     * Draw gradient background
     */
    private static drawGradientBackground(
        ctx: CanvasRenderingContext2D,
        colors: string[]
    ): void {
        const gradient = ctx.createLinearGradient(0, 0, 0, this.CANVAS_HEIGHT);

        // Use provided colors or default gradient
        const gradientColors = colors.length >= 2
            ? colors
            : ['#1a1a2e', '#16213e', '#0f3460'];

        gradientColors.forEach((color, index) => {
            gradient.addColorStop(index / (gradientColors.length - 1), color);
        });

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    }

    /**
     * Load and draw artist image
     */
    private static async drawArtistImage(
        ctx: CanvasRenderingContext2D,
        imageUrl: string
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                const size = 300;
                const x = (this.CANVAS_WIDTH - size) / 2;
                const y = 400;

                // Draw circular clipped image
                ctx.save();
                ctx.beginPath();
                ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(img, x, y, size, size);
                ctx.restore();

                // Draw border
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
                ctx.stroke();

                resolve();
            };

            img.onerror = () => {
                console.warn('Failed to load artist image, continuing without it');
                resolve(); // Continue even if image fails
            };

            img.src = imageUrl;
        });
    }

    /**
     * Draw Conciertos LATAM logo
     */
    private static async drawConciertosLogo(
        ctx: CanvasRenderingContext2D
    ): Promise<void> {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                const logoWidth = 250; // Increased from 150px
                const logoHeight = (img.height / img.width) * logoWidth;
                const x = (this.CANVAS_WIDTH - logoWidth) / 2;
                const y = 1520; // Moved up to make room

                ctx.drawImage(img, x, y, logoWidth, logoHeight);
                resolve();
            };

            img.onerror = () => {
                console.warn('Failed to load Conciertos LATAM logo');
                resolve(); // Continue even if logo fails
            };

            // Use logo from assets
            img.src = logoImage;
        });
    }

    /**
     * Draw text content
     */
    private static drawTextContent(
        ctx: CanvasRenderingContext2D,
        params: ImageGeneratorParams
    ): void {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';

        // Add text shadow for better readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        // "LISTO PARA" text
        ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
        ctx.fillText('✅ LISTO PARA', this.CANVAS_WIDTH / 2, 800);

        // Artist name
        ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
        const artistName = params.artistName.toUpperCase();
        this.wrapText(ctx, artistName, this.CANVAS_WIDTH / 2, 900, 900, 80);

        // Date and venue
        ctx.font = '36px system-ui, -apple-system, sans-serif';
        const dateStr = this.formatDate(params.concertDate);
        ctx.fillText(`📅 ${dateStr}`, this.CANVAS_WIDTH / 2, 1100);
        ctx.fillText(`📍 ${params.venueName}`, this.CANVAS_WIDTH / 2, 1160);

        // "Modo Luz Activado"
        ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
        ctx.fillText('🔥 Modo Luz Activado', this.CANVAS_WIDTH / 2, 1280);

        // @conciertos.latam (moved down to avoid overlap with logo)
        ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#00d4ff'; // Accent color
        ctx.fillText('@conciertos.latam', this.CANVAS_WIDTH / 2, 1840);

        // Reset shadow
        ctx.shadowColor = 'transparent';
    }

    /**
     * Wrap text to fit within maxWidth
     */
    private static wrapText(
        ctx: CanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number
    ): void {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line, x, currentY);
                line = words[i] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }

    /**
     * Format date for display
     */
    private static formatDate(dateString: string): string {
        const date = new Date(dateString);
        const today = new Date();

        // Check if it's today
        if (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        ) {
            return `Hoy · ${date.toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit'
            })}`;
        }

        return date.toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
}
