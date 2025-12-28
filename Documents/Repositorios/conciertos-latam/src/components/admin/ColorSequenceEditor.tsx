import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ColorBlock {
  start: number;
  end: number;
  color: string;
}

interface VenueSection {
  id: string;
  name: string;
  code: string;
}

interface ColorSequenceEditorProps {
  projectId: string;
  songId: string;
  songName: string;
  onBack: () => void;
}

export const ColorSequenceEditor = ({
  projectId,
  songId,
  songName,
  onBack,
}: ColorSequenceEditorProps) => {
  const [sections, setSections] = useState<VenueSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [sequence, setSequence] = useState<ColorBlock[]>([]);
  const [mode, setMode] = useState<'fixed' | 'strobe'>('fixed');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSections();
  }, [projectId]);

  useEffect(() => {
    if (selectedSection) {
      loadSequence();
    }
  }, [selectedSection, songId]);

  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from('venue_sections')
        .select('*')
        .eq('fan_project_id', projectId)
        .order('display_order');

      if (error) throw error;
      setSections(data || []);
      
      if (data && data.length > 0) {
        setSelectedSection(data[0].id);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las localidades',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSequence = async () => {
    try {
      const { data, error } = await supabase
        .from('fan_project_color_sequences')
        .select('sequence, mode')
        .eq('fan_project_song_id', songId)
        .eq('venue_section_id', selectedSection)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSequence(data.sequence as any);
        setMode(data.mode as 'fixed' | 'strobe');
      } else {
        setSequence([]);
        setMode('fixed');
      }
    } catch (error) {
      console.error('Error loading sequence:', error);
    }
  };

  const addBlock = () => {
    const lastEnd = sequence.length > 0 
      ? sequence[sequence.length - 1].end 
      : 0;

    setSequence([
      ...sequence,
      {
        start: lastEnd,
        end: lastEnd + 10,
        color: '#FF0000',
      },
    ]);
  };

  const updateBlock = (index: number, field: keyof ColorBlock, value: string | number) => {
    const updated = [...sequence];
    updated[index] = {
      ...updated[index],
      [field]: field === 'color' ? value : Number(value),
    };
    setSequence(updated);
  };

  const removeBlock = (index: number) => {
    setSequence(sequence.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedSection) {
      toast({
        title: 'Error',
        description: 'Selecciona una sección',
        variant: 'destructive',
      });
      return;
    }

    if (sequence.length === 0) {
      toast({
        title: 'Error',
        description: 'Agrega al menos un bloque de color',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('fan_project_color_sequences')
        .upsert({
          fan_project_song_id: songId,
          venue_section_id: selectedSection,
          sequence: sequence as any,
          mode: mode,
        }, {
          onConflict: 'fan_project_song_id,venue_section_id'
        });

      if (error) throw error;

      toast({
        title: 'Secuencia guardada',
        description: `Colores guardados para ${sections.find(s => s.id === selectedSection)?.name}`,
      });
    } catch (error: any) {
      console.error('Error saving sequence:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar la secuencia',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  if (sections.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            Este proyecto no tiene localidades configuradas
          </p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button onClick={onBack} variant="outline" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h3 className="text-2xl font-bold">Editor de Colores: {songName}</h3>
          <p className="text-sm text-muted-foreground">
            Configura la secuencia de colores por localidad
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Selecciona la Localidad</CardTitle>
            <Badge variant="secondary">
              {sequence.length} {sequence.length === 1 ? 'bloque' : 'bloques'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Localidad</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una localidad" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name} ({section.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Configura los colores para cada localidad del proyecto
            </p>
          </div>

          <div className="space-y-2">
            <Label>Modo de Secuencia</Label>
            <Select value={mode} onValueChange={(value: 'fixed' | 'strobe') => setMode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fijo - Color constante</SelectItem>
                <SelectItem value="strobe">Strobe - Efecto intermitente</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {mode === 'fixed' 
                ? 'Los colores se mostrarán de forma constante durante cada bloque'
                : 'Los colores parpadearán creando un efecto strobe durante cada bloque'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bloques de Color</CardTitle>
            <Button onClick={addBlock} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Bloque
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sequence.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay bloques de color configurados</p>
              <p className="text-sm mt-2">
                Agrega bloques para definir los colores en diferentes momentos
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sequence.map((block, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded bg-muted font-semibold">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Inicio (seg)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={block.start}
                        onChange={(e) => updateBlock(index, 'start', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Fin (seg)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={block.end}
                        onChange={(e) => updateBlock(index, 'end', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Color</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          type="color"
                          value={block.color}
                          onChange={(e) => updateBlock(index, 'color', e.target.value)}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={block.color}
                          onChange={(e) => updateBlock(index, 'color', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {[
                          '#FF006E', // Neón Rosa
                          '#FF00FF', // Neón Magenta
                          '#00FFFF', // Neón Cyan
                          '#00FF00', // Neón Verde
                          '#FFFF00', // Neón Amarillo
                          '#FF7700', // Neón Naranja
                          '#7700FF', // Neón Púrpura
                          '#0099FF', // Neón Azul
                        ].map((neonColor) => (
                          <button
                            key={neonColor}
                            type="button"
                            onClick={() => updateBlock(index, 'color', neonColor)}
                            className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                            style={{ backgroundColor: neonColor }}
                            title={neonColor}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeBlock(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {sequence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 h-16 rounded-lg overflow-hidden">
              {sequence.map((block, index) => {
                const duration = block.end - block.start;
                const totalDuration = sequence[sequence.length - 1].end;
                const percentage = (duration / totalDuration) * 100;
                
                return (
                  <div
                    key={index}
                    style={{
                      backgroundColor: block.color,
                      width: `${percentage}%`,
                    }}
                    className="transition-all hover:opacity-80"
                    title={`${block.start}s - ${block.end}s`}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
