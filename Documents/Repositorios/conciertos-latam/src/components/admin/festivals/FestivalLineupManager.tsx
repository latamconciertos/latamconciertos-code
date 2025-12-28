/**
 * Festival Lineup Manager Component
 * 
 * Manages artists for a festival by date and stage.
 */

import { useState, useEffect } from 'react';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription, 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Trash2, Loader2, Music, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  useAdminFestivalLineup, 
  useAddToLineup, 
  useRemoveFromLineup,
  useUpdateLineupItem,
} from '@/hooks/queries/useAdminFestivals';
import type { Festival, FestivalLineupItem } from '@/types/entities/festival';

interface Artist {
  id: string;
  name: string;
  photo_url: string | null;
}

interface FestivalLineupManagerProps {
  festival: Festival | null;
  open: boolean;
  onClose: () => void;
}

const COMMON_STAGES = ['Main Stage', 'Stage 2', 'Stage 3', 'Alternativo', 'Electrónico'];

export function FestivalLineupManager({ festival, open, onClose }: FestivalLineupManagerProps) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [customStage, setCustomStage] = useState<string>('');

  const { data: lineup = [], isLoading: lineupLoading } = useAdminFestivalLineup(festival?.id);
  const addToLineup = useAddToLineup();
  const removeFromLineup = useRemoveFromLineup();
  const updateLineupItem = useUpdateLineupItem();

  useEffect(() => {
    if (open) {
      fetchArtists();
    }
  }, [open]);

  useEffect(() => {
    if (festival?.start_date) {
      setSelectedDate(festival.start_date);
    }
  }, [festival]);

  const fetchArtists = async () => {
    const { data } = await supabase
      .from('artists')
      .select('id, name, photo_url')
      .order('name');
    if (data) setArtists(data);
  };

  const getFestivalDays = (): string[] => {
    if (!festival?.start_date) return [];
    
    const start = parseISO(festival.start_date);
    const end = festival.end_date ? parseISO(festival.end_date) : start;
    
    return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
  };

  const handleAddToLineup = async () => {
    if (!festival || !selectedArtist) return;

    const stage = selectedStage === 'custom' ? customStage : selectedStage;
    const maxPosition = lineup.length > 0 ? Math.max(...lineup.map(l => l.position)) + 1 : 0;

    await addToLineup.mutateAsync({
      festival_id: festival.id,
      artist_id: selectedArtist,
      performance_date: selectedDate || null,
      stage: stage || null,
      position: maxPosition,
    });

    setSelectedArtist('');
    setCustomStage('');
  };

  const handleRemoveFromLineup = async (id: string) => {
    if (!festival) return;
    if (!confirm('¿Eliminar este artista del lineup?')) return;
    
    await removeFromLineup.mutateAsync({ id, festivalId: festival.id });
  };

  const handleUpdateLineupItem = async (id: string, data: { performance_date?: string; stage?: string }) => {
    if (!festival) return;
    await updateLineupItem.mutateAsync({ id, festivalId: festival.id, data });
  };

  const getAvailableArtists = () => {
    const lineupArtistIds = lineup.map(l => l.artist_id);
    return artists.filter(a => !lineupArtistIds.includes(a.id));
  };

  const festivalDays = getFestivalDays();

  // Group lineup by date
  const lineupByDate = lineup.reduce<Record<string, FestivalLineupItem[]>>((acc, item) => {
    const date = item.performance_date || 'sin-fecha';
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lineup: {festival?.name}</DialogTitle>
          <DialogDescription>
            Gestiona los artistas que participarán en el festival
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Artist Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agregar Artista</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <Label className="text-xs">Artista</Label>
                  <Select value={selectedArtist} onValueChange={setSelectedArtist}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableArtists().map((artist) => (
                        <SelectItem key={artist.id} value={artist.id}>
                          {artist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Fecha (opcional)</Label>
                  <Select value={selectedDate || 'none'} onValueChange={(v) => setSelectedDate(v === 'none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin fecha aún" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin fecha aún</SelectItem>
                      {festivalDays.map((day) => (
                        <SelectItem key={day} value={day}>
                          {format(parseISO(day), 'EEEE d MMM', { locale: es })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Escenario (opcional)</Label>
                  <Select value={selectedStage || 'none'} onValueChange={(v) => setSelectedStage(v === 'none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin escenario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin escenario</SelectItem>
                      {COMMON_STAGES.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Otro...</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedStage === 'custom' && (
                    <Input
                      className="mt-2"
                      placeholder="Nombre del escenario"
                      value={customStage}
                      onChange={(e) => setCustomStage(e.target.value)}
                    />
                  )}
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={handleAddToLineup}
                    disabled={!selectedArtist || addToLineup.isPending}
                    className="w-full"
                  >
                    {addToLineup.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lineup List */}
          {lineupLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : lineup.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay artistas en el lineup</p>
            </div>
          ) : (
            <div className="space-y-4">
              {festivalDays.map((day) => {
                const dayLineup = lineupByDate[day] || [];
                if (dayLineup.length === 0) return null;

                return (
                  <Card key={day}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        {format(parseISO(day), 'EEEE d MMMM', { locale: es })}
                        <Badge variant="outline" className="ml-2">
                          {dayLineup.length} artistas
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {dayLineup
                          .sort((a, b) => a.position - b.position)
                          .map((item) => (
                            <div 
                              key={item.id} 
                              className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={item.artists?.photo_url || undefined} />
                                <AvatarFallback>
                                  {item.artists?.name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {item.artists?.name || 'Artista desconocido'}
                                </p>
                                {item.stage && (
                                  <p className="text-xs text-muted-foreground">
                                    {item.stage}
                                  </p>
                                )}
                              </div>
                              <Select
                                value={item.stage || ''}
                                onValueChange={(value) => handleUpdateLineupItem(item.id, { stage: value })}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue placeholder="Escenario" />
                                </SelectTrigger>
                                <SelectContent>
                                  {COMMON_STAGES.map((stage) => (
                                    <SelectItem key={stage} value={stage}>
                                      {stage}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveFromLineup(item.id)}
                                disabled={removeFromLineup.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Artists without date */}
              {lineupByDate['sin-fecha']?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Sin fecha asignada
                      <Badge variant="outline" className="ml-2">
                        {lineupByDate['sin-fecha'].length} artistas
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {lineupByDate['sin-fecha'].map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={item.artists?.photo_url || undefined} />
                            <AvatarFallback>
                              {item.artists?.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">
                              {item.artists?.name || 'Artista desconocido'}
                            </p>
                          </div>
                          <Select
                            value={item.performance_date || ''}
                            onValueChange={(value) => handleUpdateLineupItem(item.id, { performance_date: value })}
                          >
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <SelectValue placeholder="Asignar fecha" />
                            </SelectTrigger>
                            <SelectContent>
                              {festivalDays.map((day) => (
                                <SelectItem key={day} value={day}>
                                  {format(parseISO(day), 'EEEE d MMM', { locale: es })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleRemoveFromLineup(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
