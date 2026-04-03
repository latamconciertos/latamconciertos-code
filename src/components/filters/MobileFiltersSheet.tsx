import { ReactNode } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface MobileFiltersSheetProps {
  children: ReactNode;
  activeFiltersCount: number;
  onClearFilters: () => void;
  onApply?: () => void;
  title?: string;
}

export const MobileFiltersSheet = ({
  children,
  activeFiltersCount,
  onClearFilters,
  onApply,
  title = 'Filtros',
}: MobileFiltersSheetProps) => {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          <span>{title}</span>
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {title}
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="p-4 space-y-4 overflow-y-auto">
          {children}
        </div>
        
        <DrawerFooter className="border-t pt-4">
          <div className="flex gap-2 w-full">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                onClick={onClearFilters}
                className="flex-1 gap-2"
              >
                <X className="h-4 w-4" />
                Limpiar
              </Button>
            )}
            <DrawerClose asChild>
              <Button className="flex-1" onClick={onApply}>
                Aplicar Filtros
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileFiltersSheet;
