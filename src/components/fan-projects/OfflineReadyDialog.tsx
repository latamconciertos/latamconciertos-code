import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

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
}: OfflineReadyDialogProps) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="dark font-fira max-w-md mx-auto rounded-[20px] border-linea bg-superficie text-texto">
                <AlertDialogHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-7 w-7 text-verde flex-shrink-0" />
                        <AlertDialogTitle className="text-xl sm:text-2xl">
                            ¡Todo Listo!
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="space-y-4 text-left">
                        <div className="bg-verde/10 border border-verde/30 rounded-2xl p-4">
                            <p className="text-verde font-semibold text-base">
                                {sequenceCount} {sequenceCount === 1 ? 'canción lista' : 'canciones listas'}
                            </p>
                            <p className="text-texto-2 text-sm mt-1">
                                Ya puedes usar el modo luz sin conexión
                            </p>
                        </div>

                        <div className="bg-superficie-2 border border-linea rounded-2xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-periwinkle mt-0.5 flex-shrink-0" />
                                <div className="space-y-2">
                                    <p className="text-texto font-semibold text-sm">
                                        Para el día del concierto:
                                    </p>
                                    <ul className="text-texto-2 text-sm space-y-1.5">
                                        <li className="flex items-start gap-2">
                                            <span className="text-periwinkle mt-0.5">•</span>
                                            <span>No borres los datos de la app</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-periwinkle mt-0.5">•</span>
                                            <span>Mantén tu batería cargada</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-periwinkle mt-0.5">•</span>
                                            <span>Funciona sin internet</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-2">
                    <AlertDialogAction
                        onClick={() => onOpenChange(false)}
                        className="w-full rounded-full border-0 bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white shadow-[0_8px_32px_rgba(117,22,226,.45)] hover:opacity-95 text-base font-semibold py-6"
                    >
                        Entendido
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
