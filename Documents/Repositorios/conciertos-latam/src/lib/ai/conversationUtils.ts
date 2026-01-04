/**
 * Conversation Utilities
 * Helper functions for AI conversation management
 */

/**
 * Generates a smart, descriptive title from a user message
 * Removes common greetings and filler words, capitalizes, and truncates
 * 
 * @param message - The user's message
 * @returns A clean, descriptive title (max 45 chars)
 */
export function generateConversationTitle(message: string): string {
    // First, clean up extra whitespace and normalize
    let cleaned = message.trim().replace(/\s+/g, ' ');

    // If message is too short, return as is
    if (cleaned.length < 3) {
        return 'Nueva conversación';
    }

    // Remove common greetings and filler words at the start
    cleaned = cleaned.replace(/^(Hola|Hi|Hello|Hey|Buenos días|Buenas tardes|Buenas noches|Buenas)\s+/gi, '');

    // Remove common helper phrases
    cleaned = cleaned.replace(/^(Ayúdame|Ayuda|Podrías|Puedes|Me puedes|Por favor)\s+(a\s+|con\s+)?/gi, '');
    cleaned = cleaned.replace(/^(Quiero|Necesito|Me gustaría|Quisiera)\s+(saber\s+|conocer\s+|información\s+sobre\s+)?/gi, '');

    // Remove question marks and exclamations only at start/end
    cleaned = cleaned.replace(/^[¿¡]+\s*/, '').replace(/\s*[?!]+$/, '');

    // If cleaning resulted in empty string, use original message
    if (!cleaned || cleaned.length < 3) {
        cleaned = message.trim();
    }

    // Capitalize first letter
    if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Limit to 45 characters for better readability
    const maxLength = 45;

    if (cleaned.length <= maxLength) {
        return cleaned;
    }

    // Find last complete word within the limit
    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    // Break at last word if reasonable, otherwise hard cut
    if (lastSpace > 25) {
        return truncated.substring(0, lastSpace) + '...';
    }

    return truncated.trim() + '...';
}
