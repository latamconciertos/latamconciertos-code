/**
 * StructuredData Component
 * 
 * Renders JSON-LD structured data in the page head.
 */

import { useEffect } from 'react';

interface StructuredDataProps {
    data: Record<string, any>;
}

export const StructuredData = ({ data }: StructuredDataProps) => {
    useEffect(() => {
        // Create script element
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(data);

        // Add to head
        document.head.appendChild(script);

        // Cleanup on unmount
        return () => {
            document.head.removeChild(script);
        };
    }, [data]);

    return null;
};
