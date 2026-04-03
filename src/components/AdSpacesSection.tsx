import { Target, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AdSpacesSection = () => {
  const navigate = useNavigate();
  
  const handleAdClick = () => {
    navigate('/publicidad');
  };
  
  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card 
          className="overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group" 
          onClick={handleAdClick}
        >
          <div className="relative bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Espacio Publicitario</h3>
                <p className="text-sm text-muted-foreground">Promociona tu evento y alcanza miles de fanáticos</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="shrink-0">
              Más información
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default AdSpacesSection;