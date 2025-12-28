import DOMPurify from 'dompurify';

/**
 * Sanitiza contenido HTML para prevenir ataques XSS
 * Permite tags seguros para artículos y contenido de noticias
 */
export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'figure', 'figcaption', 'img', 'video', 'blockquote',
      'code', 'pre', 'span', 'div'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'class', 'target', 'rel', 
      'controls', 'preload', 'loading', 'width', 'height',
      'title', 'id'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|data|blob):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Sanitiza códigos de embed (iframes) para videos
 * Solo permite iframes de fuentes confiables
 */
export const sanitizeEmbedCode = (embedCode: string): string => {
  return DOMPurify.sanitize(embedCode, {
    ALLOWED_TAGS: ['iframe'],
    ALLOWED_ATTR: [
      'src', 'width', 'height', 'frameborder', 
      'allow', 'allowfullscreen', 'title', 'loading'
    ],
    ALLOWED_URI_REGEXP: /^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|soundcloud\.com)/i,
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Convierte URLs en texto a enlaces HTML seguros
 * Útil para convertir URLs en mensajes de chat
 */
export const linkifyText = (text: string): string => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const linkedText = text.replace(
    urlRegex, 
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>'
  );
  return sanitizeHTML(linkedText);
};
