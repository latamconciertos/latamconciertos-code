import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
    eyebrow: string;
    title: string;
    subtitle?: string;
    action?: { label: string; to: string };
}

/**
 * Encabezado de sección "Evolución Nocturna": eyebrow con barra verde,
 * titular en Big Shoulders uppercase y acción secundaria a la derecha.
 * Alineado a la izquierda a propósito — evitar layouts 100% centrados.
 */
export const SectionHeader = ({ eyebrow, title, subtitle, action }: SectionHeaderProps) => {
    return (
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 mb-10 md:mb-12">
            <div className="max-w-2xl">
                <span className="eyebrow-nocturno mb-3">{eyebrow}</span>
                <h2 className="font-display font-extrabold uppercase tracking-[0.01em] text-3xl md:text-4xl leading-none text-texto">
                    {title}
                </h2>
                {subtitle && (
                    <p className="mt-3 font-fira text-base text-texto-2">
                        {subtitle}
                    </p>
                )}
            </div>
            {action && (
                <Link to={action.to} className="btn-nocturno-secundario shrink-0">
                    {action.label}
                    <ArrowRight className="h-4 w-4" />
                </Link>
            )}
        </div>
    );
};
