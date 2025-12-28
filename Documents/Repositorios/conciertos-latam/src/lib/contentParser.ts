import { sanitizeHTML } from './sanitize';

interface MediaItem {
  id?: string;
  media_type: 'image' | 'video';
  media_url: string;
  caption?: string;
  position: number;
}

export const parseContentWithMedia = (content: string, mediaItems: MediaItem[]): string => {
  if (!content || !mediaItems || mediaItems.length === 0) {
    return content;
  }

  let parsedContent = content;

  // Ordenar media items por posición
  const sortedMedia = [...mediaItems].sort((a, b) => a.position - b.position);

  // Reemplazar placeholders de imágenes
  sortedMedia.forEach((item, index) => {
    const placeholder = item.media_type === 'image' 
      ? `[IMAGEN:${index}]` 
      : `[VIDEO:${index}]`;
    
    let replacement = '';
    
    // Sanitizar media_url y caption para prevenir XSS
    const safeMediaUrl = sanitizeHTML(item.media_url);
    const safeCaption = item.caption ? sanitizeHTML(item.caption) : '';
    
    if (item.media_type === 'image') {
      replacement = `
        <figure class="my-8">
          <img 
            src="${safeMediaUrl}" 
            alt="${safeCaption || 'Imagen del artículo'}" 
            class="w-full rounded-lg shadow-lg"
            loading="lazy"
          />
          ${safeCaption ? `<figcaption class="text-center text-sm text-muted-foreground mt-2">${safeCaption}</figcaption>` : ''}
        </figure>
      `;
    } else {
      replacement = `
        <figure class="my-8">
          <video 
            src="${safeMediaUrl}" 
            controls 
            class="w-full rounded-lg shadow-lg"
            preload="metadata"
          >
            Tu navegador no soporta el elemento de video.
          </video>
          ${safeCaption ? `<figcaption class="text-center text-sm text-muted-foreground mt-2">${safeCaption}</figcaption>` : ''}
        </figure>
      `;
    }
    
    parsedContent = parsedContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
  });

  return parsedContent;
};
