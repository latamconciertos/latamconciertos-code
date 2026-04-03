/**
 * Centralized Entity Types for Conciertos Latam
 * 
 * This module exports all domain entity types used throughout the application.
 * Types are derived from Supabase database types with additional relationship types
 * for use in queries with joins.
 * 
 * @module types/entities
 */

// Core domain entities
export * from './concert';
export * from './artist';
export * from './venue';
export * from './news';
export * from './setlist';
export * from './common';
export * from './user';
export * from './media';
export * from './friendship';
