interface StadiumArcsProps {
    variant?: 'hero' | 'mini';
    className?: string;
}

/**
 * Elemento firma "Evolución Nocturna": los arcos del isotipo convertidos
 * en luz de escenario — la silueta del estadio iluminado saliendo del
 * horizonte inferior. Usar en el hero + máximo 1-2 apariciones mini.
 */
export const StadiumArcs = ({ variant = 'hero', className = '' }: StadiumArcsProps) => {
    if (variant === 'mini') {
        return (
            <svg
                className={className}
                viewBox="0 0 400 200"
                fill="none"
                preserveAspectRatio="xMidYMax slice"
                aria-hidden="true"
            >
                <circle cx="200" cy="600" r="420" stroke="#597CFF" strokeOpacity="0.18" strokeWidth="2" />
                <circle cx="200" cy="600" r="470" stroke="#83B4FF" strokeOpacity="0.12" strokeWidth="2" />
            </svg>
        );
    }

    return (
        <svg
            className={className}
            viewBox="0 0 1440 520"
            fill="none"
            preserveAspectRatio="xMidYMax slice"
            aria-hidden="true"
        >
            <circle cx="720" cy="1280" r="800" stroke="#597CFF" strokeOpacity="0.25" strokeWidth="2" />
            <circle cx="720" cy="1280" r="880" stroke="#83B4FF" strokeOpacity="0.18" strokeWidth="2" />
            <circle cx="720" cy="1280" r="960" stroke="#37C563" strokeOpacity="0.16" strokeWidth="2" />
            <circle cx="720" cy="1280" r="1040" stroke="#83B4FF" strokeOpacity="0.12" strokeWidth="2" />
            <circle cx="720" cy="1280" r="1120" stroke="#597CFF" strokeOpacity="0.10" strokeWidth="2" />
        </svg>
    );
};
