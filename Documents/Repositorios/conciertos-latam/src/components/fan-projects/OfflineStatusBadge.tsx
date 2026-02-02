import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { indexedDBStorage } from '@/utils/indexedDBStorage';

interface OfflineStatusBadgeProps {
    projectId: string;
    songId: string;
    sectionId: string;
    className?: string;
}

type OfflineStatus = 'checking' | 'ready' | 'not-ready' | 'error';

export const OfflineStatusBadge = ({
    projectId,
    songId,
    sectionId,
    className = '',
}: OfflineStatusBadgeProps) => {
    const [status, setStatus] = useState<OfflineStatus>('checking');

    useEffect(() => {
        checkOfflineStatus();
    }, [projectId, songId, sectionId]);

    const checkOfflineStatus = async () => {
        try {
            setStatus('checking');

            const sequence = await indexedDBStorage.getSequence(projectId, songId, sectionId);

            if (sequence) {
                // Check if sequence is not expired
                const age = Date.now() - sequence.timestamp;
                const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

                if (age < maxAge) {
                    setStatus('ready');
                } else {
                    setStatus('not-ready');
                }
            } else {
                setStatus('not-ready');
            }
        } catch (error) {
            console.error('Error checking offline status:', error);
            setStatus('error');
        }
    };

    const getStatusConfig = () => {
        switch (status) {
            case 'checking':
                return {
                    icon: Loader2,
                    text: 'Verificando...',
                    variant: 'secondary' as const,
                    className: 'bg-gray-100 text-gray-700',
                    iconClassName: 'animate-spin',
                };
            case 'ready':
                return {
                    icon: CheckCircle2,
                    text: '✅ Listo sin internet',
                    variant: 'default' as const,
                    className: 'bg-green-500 text-white hover:bg-green-600',
                    iconClassName: '',
                };
            case 'not-ready':
                return {
                    icon: AlertTriangle,
                    text: '⚠️ Requiere precargar',
                    variant: 'secondary' as const,
                    className: 'bg-yellow-500 text-white hover:bg-yellow-600',
                    iconClassName: '',
                };
            case 'error':
                return {
                    icon: XCircle,
                    text: '❌ Error de verificación',
                    variant: 'destructive' as const,
                    className: 'bg-red-500 text-white',
                    iconClassName: '',
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <Badge
            variant={config.variant}
            className={`${config.className} ${className} flex items-center gap-1.5 px-3 py-1.5`}
        >
            <Icon className={`h-4 w-4 ${config.iconClassName}`} />
            <span className="text-sm font-medium">{config.text}</span>
        </Badge>
    );
};
