import { useState } from 'react';
import { Send, Calendar, MapPin, Music2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUserUpcomingConcerts, useSendConcertInvitation } from '@/hooks/queries/useFriends';

interface InviteToConcertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  friendId: string;
  friendName: string;
}

export function InviteToConcertModal({ 
  open, 
  onOpenChange, 
  userId, 
  friendId,
  friendName 
}: InviteToConcertModalProps) {
  const [selectedConcertId, setSelectedConcertId] = useState<string>('');
  const [message, setMessage] = useState('');
  
  const { data: concerts, isLoading } = useUserUpcomingConcerts(userId);
  const sendInvitation = useSendConcertInvitation();
  
  const handleSend = () => {
    if (!selectedConcertId) return;
    
    sendInvitation.mutate({
      senderId: userId,
      receiverId: friendId,
      concertId: selectedConcertId,
      message: message.trim() || undefined
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setSelectedConcertId('');
        setMessage('');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="text-base sm:text-lg">
            Invitar a {friendName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-4 py-3">
          <p className="text-sm text-muted-foreground mb-3">
            Selecciona un concierto al que quieras invitar a tu amigo:
          </p>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : concerts && concerts.length > 0 ? (
            <ScrollArea className="h-[250px] pr-4">
              <RadioGroup 
                value={selectedConcertId} 
                onValueChange={setSelectedConcertId}
                className="space-y-2"
              >
                {concerts.map((concert: any) => (
                  <div 
                    key={concert.id}
                    className={`relative flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedConcertId === concert.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedConcertId(concert.id)}
                  >
                    <RadioGroupItem 
                      value={concert.id} 
                      id={concert.id}
                      className="mt-1"
                    />
                    
                    <div className="flex gap-3 flex-1 min-w-0">
                      {concert.image_url ? (
                        <img 
                          src={concert.image_url} 
                          alt={concert.title}
                          className="h-12 w-12 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <Music2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      
                      <div className="min-w-0">
                        <Label 
                          htmlFor={concert.id} 
                          className="font-medium text-sm cursor-pointer line-clamp-1"
                        >
                          {concert.title}
                        </Label>
                        
                        {concert.date && (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {format(new Date(concert.date), "d MMM yyyy", { locale: es })}
                            </span>
                          </div>
                        )}
                        
                        {concert.venues?.name && (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                              {concert.venues.name}
                              {concert.venues.cities?.name && `, ${concert.venues.cities.name}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Music2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No tienes conciertos próximos</p>
              <p className="text-xs mt-1">Agrega conciertos a tu calendario primero</p>
            </div>
          )}
        </div>
        
        {concerts && concerts.length > 0 && (
          <>
            <div className="px-4 pb-3">
              <Label htmlFor="message" className="text-sm text-muted-foreground">
                Mensaje (opcional)
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="¡Vamos juntos a este concierto!"
                className="mt-1.5 resize-none h-16"
                maxLength={200}
              />
            </div>
            
            <div className="p-4 pt-0 border-t mt-auto">
              <Button
                onClick={handleSend}
                disabled={!selectedConcertId || sendInvitation.isPending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar invitación
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
