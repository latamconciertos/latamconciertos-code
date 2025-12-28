import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface VenueSection {
  id: string;
  name: string;
  code: string;
}

interface SectionSelectModalProps {
  open: boolean;
  onClose: () => void;
  sections: VenueSection[];
  onSelect: (sectionId: string) => void;
  defaultValue?: string;
}

export const SectionSelectModal = ({
  open,
  onClose,
  sections,
  onSelect,
  defaultValue,
}: SectionSelectModalProps) => {
  const [selectedSection, setSelectedSection] = useState<string>(defaultValue || '');

  const handleConfirm = () => {
    if (selectedSection) {
      onSelect(selectedSection);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecciona tu localidad</DialogTitle>
          <DialogDescription>
            Escoge la sección donde estarás ubicado en el concierto. Esto determinará los colores que verás en tu pantalla.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="section">Localidad</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger id="section">
                <SelectValue placeholder="Selecciona una localidad" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedSection}>
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
