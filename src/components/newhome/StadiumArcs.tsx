interface StadiumArcsProps {
    variant?: 'hero' | 'mini';
    className?: string;
}

/**
 * Elemento firma del Manual de Marca v2.0: los arcos del isotipo como luz
 * de escenario — morado arriba, violeta y fucsia al centro, naranja tocando
 * el horizonte. Usar en el hero + máximo 1-2 apariciones mini.
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
                <circle cx="200" cy="600" r="420" stroke="#FE670C" strokeOpacity="0.16" strokeWidth="2" />
                <circle cx="200" cy="600" r="470" stroke="#E70485" strokeOpacity="0.14" strokeWidth="2" />
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
            <circle cx="720" cy="1280" r="800" stroke="#FE670C" strokeOpacity="0.28" strokeWidth="2" />
            <circle cx="720" cy="1280" r="880" stroke="#E70485" strokeOpacity="0.22" strokeWidth="2" />
            <circle cx="720" cy="1280" r="960" stroke="#E70485" strokeOpacity="0.16" strokeWidth="2" />
            <circle cx="720" cy="1280" r="1040" stroke="#AB0DC4" strokeOpacity="0.14" strokeWidth="2" />
            <circle cx="720" cy="1280" r="1120" stroke="#7516E2" strokeOpacity="0.12" strokeWidth="2" />
        </svg>
    );
};
