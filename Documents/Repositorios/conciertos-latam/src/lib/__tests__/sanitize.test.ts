import { describe, it, expect } from 'vitest';
import { sanitizeHTML, sanitizeEmbedCode, linkifyText } from '../sanitize';

describe('sanitizeHTML', () => {
  it('permite tags seguros', () => {
    const html = '<p>Hello <strong>World</strong></p>';
    expect(sanitizeHTML(html)).toBe(html);
  });

  it('permite enlaces con atributos seguros', () => {
    const html = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
    expect(sanitizeHTML(html)).toContain('href="https://example.com"');
  });

  it('elimina scripts maliciosos', () => {
    const html = '<p>Hello</p><script>alert("XSS")</script>';
    expect(sanitizeHTML(html)).toBe('<p>Hello</p>');
  });

  it('elimina event handlers', () => {
    const html = '<p onclick="alert(1)">Click me</p>';
    expect(sanitizeHTML(html)).toBe('<p>Click me</p>');
  });

  it('permite imágenes con alt', () => {
    const html = '<img src="https://example.com/img.jpg" alt="Test image">';
    const result = sanitizeHTML(html);
    expect(result).toContain('src="https://example.com/img.jpg"');
    expect(result).toContain('alt="Test image"');
  });

  it('permite headings h1-h6', () => {
    const html = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>';
    expect(sanitizeHTML(html)).toBe(html);
  });

  it('permite listas', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    expect(sanitizeHTML(html)).toBe(html);
  });

  it('permite blockquotes', () => {
    const html = '<blockquote>Quote text</blockquote>';
    expect(sanitizeHTML(html)).toBe(html);
  });

  it('permite videos con controles', () => {
    const html = '<video src="test.mp4" controls></video>';
    const result = sanitizeHTML(html);
    expect(result).toContain('controls');
  });

  it('elimina javascript: URLs', () => {
    const html = '<a href="javascript:alert(1)">Click</a>';
    const result = sanitizeHTML(html);
    expect(result).not.toContain('javascript:');
  });
});

describe('sanitizeEmbedCode', () => {
  it('permite iframes de YouTube', () => {
    const embed = '<iframe src="https://www.youtube.com/embed/abc123" width="560" height="315"></iframe>';
    expect(sanitizeEmbedCode(embed)).toContain('youtube.com');
  });

  it('permite iframes de Vimeo', () => {
    const embed = '<iframe src="https://vimeo.com/video/123456" width="560" height="315"></iframe>';
    expect(sanitizeEmbedCode(embed)).toContain('vimeo.com');
  });

  it('elimina iframes de fuentes no confiables', () => {
    const embed = '<iframe src="https://malicious-site.com/embed"></iframe>';
    expect(sanitizeEmbedCode(embed)).toBe('');
  });

  it('elimina scripts dentro de embeds', () => {
    const embed = '<iframe src="https://youtube.com/embed/123"></iframe><script>evil()</script>';
    const result = sanitizeEmbedCode(embed);
    expect(result).not.toContain('script');
  });

  it('elimina otros tags dentro de embeds', () => {
    const embed = '<iframe src="https://youtube.com/embed/123"></iframe><div>malicious</div>';
    const result = sanitizeEmbedCode(embed);
    expect(result).not.toContain('<div>');
  });
});

describe('linkifyText', () => {
  it('convierte URLs en enlaces', () => {
    const text = 'Visit https://example.com for more info';
    const result = linkifyText(text);
    expect(result).toContain('<a href="https://example.com"');
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('maneja múltiples URLs', () => {
    const text = 'Check https://site1.com and https://site2.com';
    const result = linkifyText(text);
    expect(result).toContain('site1.com');
    expect(result).toContain('site2.com');
  });

  it('mantiene texto sin URLs intacto', () => {
    const text = 'Just plain text here';
    expect(linkifyText(text)).toBe('Just plain text here');
  });

  it('soporta URLs http', () => {
    const text = 'Link: http://example.com';
    const result = linkifyText(text);
    expect(result).toContain('<a href="http://example.com"');
  });

  it('sanitiza el resultado para prevenir XSS', () => {
    const text = 'Check https://example.com <script>alert(1)</script>';
    const result = linkifyText(text);
    expect(result).not.toContain('<script>');
  });
});
