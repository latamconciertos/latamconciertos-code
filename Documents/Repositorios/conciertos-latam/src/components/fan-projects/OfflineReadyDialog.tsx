import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface OfflineReadyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sequenceCount: number;
    storageType: 'IndexedDB' | 'localStorage';
}

export const OfflineReadyDialog = ({
    open,
    onOpenChange,
    sequenceCount,
    storageType,
}: OfflineReadyDialogProps) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                        <AlertDialogTitle className="text-xl">
                            ¡Secuencia Precargada!
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="space-y-4 text-left">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-green-800 font-medium">
                                ✅ {sequenceCount} {sequenceCount === 1 ? 'secuencia guardada' : 'secuencias guardadas'}
                            </p>
                            <p className="text-green-700 text-sm mt-1">
                                Almacenamiento: {storageType}
                            </p>
                            <p className="text-green-700 text-sm">
                                Válido por: 30 días
                            </p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-yellow-900 font-semibold text-sm">
                                        IMPORTANTE PARA EL DÍA DEL EVENTO:
                                    </p>
                                    <ul className="text-yellow-800 text-sm mt-2 space-y-1 list-disc list-inside">
                                        <li>NO borres el caché del navegador</li>
                                        <li>NO uses modo incógnito/privado</li>
                                        <li>Mantén la app instalada (PWA)</li>
                                        <li>La secuencia funcionará sin internet</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-blue-900 font-semibold text-sm">
                                        Recomendaciones:
                                    </p>
                                    <ul className="text-blue-800 text-sm mt-2 space-y-1 list-disc list-inside">
                                        <li>Instala la app en tu teléfono (PWA)</li>
                                        <li>Verifica la precarga 24h antes del evento</li>
                                        <li>Mantén tu batería cargada</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction
                        onClick={() => onOpenChange(false)}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Entendido
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
