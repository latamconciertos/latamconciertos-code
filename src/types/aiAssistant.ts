/**
 * AI Assistant Types
 * Shared type definitions for AI conversation and messaging system
 */

export interface Message {
    role: 'user' | 'bot';
    content: string;
}

export interface Conversation {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}
