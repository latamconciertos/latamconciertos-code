import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  authSchema,
  usernameSchema,
  profileSchema,
  slugSchema,
  artistSchema,
  venueSchema,
  concertSchema,
  newsArticleSchema,
  promoterSchema,
  setlistSongSchema,
  categorySchema,
  mediaItemSchema,
} from '../validation';

describe('Authentication Schemas', () => {
  describe('emailSchema', () => {
    it('acepta emails válidos', () => {
      expect(emailSchema.safeParse('test@example.com').success).toBe(true);
      expect(emailSchema.safeParse('user.name@domain.co').success).toBe(true);
    });

    it('rechaza emails inválidos', () => {
      expect(emailSchema.safeParse('invalid-email').success).toBe(false);
      expect(emailSchema.safeParse('').success).toBe(false);
      expect(emailSchema.safeParse('@no-user.com').success).toBe(false);
    });

    it('rechaza emails muy largos', () => {
      const longEmail = 'a'.repeat(250) + '@test.com';
      expect(emailSchema.safeParse(longEmail).success).toBe(false);
    });

    it('trim whitespace', () => {
      const result = emailSchema.parse('  test@example.com  ');
      expect(result).toBe('test@example.com');
    });
  });

  describe('passwordSchema', () => {
    it('acepta contraseñas válidas', () => {
      expect(passwordSchema.safeParse('123456').success).toBe(true);
      expect(passwordSchema.safeParse('securePassword123').success).toBe(true);
    });

    it('rechaza contraseñas muy cortas', () => {
      expect(passwordSchema.safeParse('12345').success).toBe(false);
      expect(passwordSchema.safeParse('').success).toBe(false);
    });

    it('rechaza contraseñas muy largas', () => {
      const longPassword = 'a'.repeat(73);
      expect(passwordSchema.safeParse(longPassword).success).toBe(false);
    });
  });

  describe('authSchema', () => {
    it('valida credenciales completas', () => {
      const result = authSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rechaza credenciales incompletas', () => {
      expect(authSchema.safeParse({ email: 'test@example.com' }).success).toBe(false);
      expect(authSchema.safeParse({ password: 'password123' }).success).toBe(false);
    });
  });
});

describe('Profile Schemas', () => {
  describe('usernameSchema', () => {
    it('acepta usernames válidos', () => {
      expect(usernameSchema.safeParse('john_doe').success).toBe(true);
      expect(usernameSchema.safeParse('user-123').success).toBe(true);
      expect(usernameSchema.safeParse('ConcertFan').success).toBe(true);
    });

    it('acepta strings vacíos (opcional)', () => {
      expect(usernameSchema.safeParse('').success).toBe(true);
    });

    it('rechaza usernames muy cortos', () => {
      expect(usernameSchema.safeParse('ab').success).toBe(false);
    });

    it('rechaza caracteres especiales', () => {
      expect(usernameSchema.safeParse('user@name').success).toBe(false);
      expect(usernameSchema.safeParse('user name').success).toBe(false);
    });
  });

  describe('profileSchema', () => {
    it('valida perfil completo', () => {
      const result = profileSchema.safeParse({
        username: 'concert_fan',
        first_name: 'Juan',
        last_name: 'Pérez',
        birth_date: '1990-01-15',
        country_id: '550e8400-e29b-41d4-a716-446655440000',
        city_id: '550e8400-e29b-41d4-a716-446655440001',
      });
      expect(result.success).toBe(true);
    });

    it('valida perfil vacío (todos opcionales)', () => {
      const result = profileSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});

describe('Admin Form Schemas', () => {
  describe('slugSchema', () => {
    it('acepta slugs válidos', () => {
      expect(slugSchema.safeParse('bad-bunny').success).toBe(true);
      expect(slugSchema.safeParse('tour-2024').success).toBe(true);
    });

    it('rechaza slugs con mayúsculas', () => {
      expect(slugSchema.safeParse('Bad-Bunny').success).toBe(false);
    });

    it('rechaza slugs con caracteres especiales', () => {
      expect(slugSchema.safeParse('bad_bunny').success).toBe(false);
    });

    it('acepta strings vacíos (opcional)', () => {
      expect(slugSchema.safeParse('').success).toBe(true);
    });
  });

  describe('artistSchema', () => {
    it('valida artista válido', () => {
      const result = artistSchema.safeParse({
        name: 'Bad Bunny',
        slug: 'bad-bunny',
        bio: 'Artista puertorriqueño',
        photo_url: 'https://example.com/photo.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('requiere nombre', () => {
      const result = artistSchema.safeParse({
        slug: 'test-artist',
      });
      expect(result.success).toBe(false);
    });

    it('rechaza nombres vacíos', () => {
      const result = artistSchema.safeParse({
        name: '',
        slug: 'test',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('venueSchema', () => {
    it('valida venue válido', () => {
      const result = venueSchema.safeParse({
        name: 'Estadio Nacional',
        slug: 'estadio-nacional',
        capacity: 50000,
        city_id: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(result.success).toBe(true);
    });

    it('rechaza capacidad negativa', () => {
      const result = venueSchema.safeParse({
        name: 'Test Venue',
        capacity: -100,
      });
      expect(result.success).toBe(false);
    });

    it('rechaza capacidad excesiva', () => {
      const result = venueSchema.safeParse({
        name: 'Test Venue',
        capacity: 1000000,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('concertSchema', () => {
    it('valida concierto válido', () => {
      const result = concertSchema.safeParse({
        title: 'World Tour 2024',
        slug: 'world-tour-2024',
        date: '2024-12-31',
        event_type: 'concert',
      });
      expect(result.success).toBe(true);
    });

    it('acepta todos los tipos de evento', () => {
      expect(concertSchema.safeParse({ title: 'Test', event_type: 'concert' }).success).toBe(true);
      expect(concertSchema.safeParse({ title: 'Test', event_type: 'festival' }).success).toBe(true);
      expect(concertSchema.safeParse({ title: 'Test', event_type: 'tour' }).success).toBe(true);
    });

    it('rechaza tipos de evento inválidos', () => {
      const result = concertSchema.safeParse({
        title: 'Test',
        event_type: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('valida formato de fecha', () => {
      expect(concertSchema.safeParse({ title: 'T', event_type: 'concert', date: '2024-01-15' }).success).toBe(true);
      expect(concertSchema.safeParse({ title: 'T', event_type: 'concert', date: 'invalid' }).success).toBe(false);
    });
  });

  describe('newsArticleSchema', () => {
    it('valida artículo válido', () => {
      const result = newsArticleSchema.safeParse({
        title: 'Nueva noticia importante',
        slug: 'nueva-noticia',
        content: 'A'.repeat(100),
        status: 'published',
      });
      expect(result.success).toBe(true);
    });

    it('rechaza contenido muy corto', () => {
      const result = newsArticleSchema.safeParse({
        title: 'Test',
        content: 'Short',
        status: 'draft',
      });
      expect(result.success).toBe(false);
    });

    it('valida meta descripción length', () => {
      const validMeta = newsArticleSchema.safeParse({
        title: 'Test',
        content: 'A'.repeat(100),
        status: 'draft',
        meta_description: 'A'.repeat(60),
      });
      expect(validMeta.success).toBe(true);

      const tooLongMeta = newsArticleSchema.safeParse({
        title: 'Test',
        content: 'A'.repeat(100),
        status: 'draft',
        meta_description: 'A'.repeat(170),
      });
      expect(tooLongMeta.success).toBe(false);
    });
  });

  describe('promoterSchema', () => {
    it('valida promotor válido', () => {
      const result = promoterSchema.safeParse({
        name: 'Live Nation',
        website: 'https://livenation.com',
      });
      expect(result.success).toBe(true);
    });

    it('requiere nombre', () => {
      const result = promoterSchema.safeParse({
        website: 'https://example.com',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('setlistSongSchema', () => {
    it('valida canción válida', () => {
      const result = setlistSongSchema.safeParse({
        song_name: 'Titi Me Preguntó',
        position: 1,
        duration_seconds: 240,
      });
      expect(result.success).toBe(true);
    });

    it('requiere posición válida', () => {
      expect(setlistSongSchema.safeParse({ song_name: 'Test', position: 0 }).success).toBe(false);
      expect(setlistSongSchema.safeParse({ song_name: 'Test', position: 501 }).success).toBe(false);
    });

    it('limita duración a 2 horas', () => {
      expect(setlistSongSchema.safeParse({ song_name: 'Test', position: 1, duration_seconds: 7200 }).success).toBe(true);
      expect(setlistSongSchema.safeParse({ song_name: 'Test', position: 1, duration_seconds: 7201 }).success).toBe(false);
    });
  });

  describe('categorySchema', () => {
    it('valida categoría válida', () => {
      const result = categorySchema.safeParse({
        name: 'Noticias',
        slug: 'noticias',
        description: 'Categoría de noticias',
      });
      expect(result.success).toBe(true);
    });

    it('requiere nombre', () => {
      const result = categorySchema.safeParse({
        slug: 'test',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('mediaItemSchema', () => {
    it('valida media item válido', () => {
      const result = mediaItemSchema.safeParse({
        title: 'Video del concierto',
        type: 'video',
        media_url: 'https://youtube.com/watch?v=123',
      });
      expect(result.success).toBe(true);
    });

    it('acepta todos los tipos de media', () => {
      expect(mediaItemSchema.safeParse({ title: 'T', type: 'video' }).success).toBe(true);
      expect(mediaItemSchema.safeParse({ title: 'T', type: 'photo' }).success).toBe(true);
      expect(mediaItemSchema.safeParse({ title: 'T', type: 'audio' }).success).toBe(true);
    });

    it('rechaza tipos inválidos', () => {
      const result = mediaItemSchema.safeParse({
        title: 'Test',
        type: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });
});
