import { MessageCircle, Plus, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeScreenProps {
  userName: string;
  onCreateConversation: () => void;
  isDisabled: boolean;
  onOpenSidebar: () => void;
}

const WelcomeScreen = ({ userName, onCreateConversation, isDisabled, onOpenSidebar }: WelcomeScreenProps) => {
  return (
    <div className="flex-1 flex flex-col">
      {/* Header móvil con botón menú */}
      <div className="lg:hidden flex items-center justify-between py-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onOpenSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm text-muted-foreground">Historial</span>
        <div className="w-9" /> {/* Spacer para centrar */}
      </div>

      {/* Contenido centrado */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-6 max-w-sm mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span className="text-primary font-semibold">Asistente IA</span>
          </div>

          {/* Saludo simple y limpio */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            ¡Hola{userName ? ` ${userName.includes('@') ? userName.split('@')[0] : userName}` : ''}!
          </h1>

          <p className="text-muted-foreground mb-8 leading-relaxed">
            Soy tu asistente para conciertos. Puedo ayudarte a encontrar el concierto perfecto, recomendarte hoteles cercanos y mucho más.
          </p>

          <Button
            onClick={onCreateConversation}
            size="lg"
            disabled={isDisabled}
            className="px-8"
          >
            <Plus className="h-5 w-5 mr-2" />
            Iniciar conversación
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
