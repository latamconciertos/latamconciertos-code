import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Ticket, ExternalLink, Copy, Check, AlertCircle, Image, Link, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { firecrawlApi, type ExtractedPrices, type TicketPrice } from '@/lib/api/firecrawl';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TicketPriceExtractorProps {
  ticketUrl?: string;
  initialPricesHtml?: string;
  /** For news: inserts HTML into rich text editor */
  onInsertContent?: (html: string) => void;
  /** For concerts/festivals: returns HTML to be saved */
  onPricesExtracted?: (html: string | null) => void;
  /** Compact mode for embedding in forms */
  compact?: boolean;
}

export const TicketPriceExtractor = ({ 
  ticketUrl, 
  initialPricesHtml,
  onInsertContent, 
  onPricesExtracted,
  compact = false 
}: TicketPriceExtractorProps) => {
  const [url, setUrl] = useState(ticketUrl || '');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedPrices | null>(null);
  const [copied, setCopied] = useState(false);
  const [extractionMethod, setExtractionMethod] = useState<'url' | 'image'>('url');
  const [isOpen, setIsOpen] = useState(false);
  const [hasSavedPrices, setHasSavedPrices] = useState(!!initialPricesHtml);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update URL when ticketUrl prop changes
  useEffect(() => {
    if (ticketUrl) {
      setUrl(ticketUrl);
    }
  }, [ticketUrl]);

  // Check if we have initial prices
  useEffect(() => {
    setHasSavedPrices(!!initialPricesHtml);
  }, [initialPricesHtml]);

  const handleExtractFromUrl = async () => {
    if (!url.trim()) {
      toast.error('Ingresa una URL válida');
      return;
    }

    setIsLoading(true);
    setExtractedData(null);

    try {
      const response = await firecrawlApi.scrapeTicketPrices(url);

      if (response.success && response.data) {
        setExtractedData({ ...response.data, source_url: url });
        
        const totalPrices = (response.data.presale_prices?.length || 0) + (response.data.regular_prices?.length || 0);
        if (totalPrices === 0) {
          toast.warning('No se encontraron precios en la página. Verifica que la URL sea correcta.');
        } else {
          toast.success(`Se encontraron ${totalPrices} zonas de precios`);
        }
      } else {
        toast.error(response.error || 'Error al extraer precios');
      }
    } catch (error) {
      console.error('Error extracting prices:', error);
      toast.error('Error al conectar con el servicio de extracción');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractFromImage = async (imageBase64?: string) => {
    if (!imageUrl.trim() && !imageBase64) {
      toast.error('Ingresa una URL de imagen o sube un archivo');
      return;
    }

    setIsLoading(true);
    setExtractedData(null);

    try {
      const response = await firecrawlApi.extractPricesFromImage(
        imageBase64 ? undefined : imageUrl,
        imageBase64
      );

      if (response.success && response.data) {
        setExtractedData({ ...response.data, source_url: imageUrl || 'imagen subida' });
        
        const totalPrices = (response.data.presale_prices?.length || 0) + (response.data.regular_prices?.length || 0);
        if (totalPrices === 0) {
          toast.warning('No se encontraron precios en la imagen.');
        } else {
          toast.success(`Se encontraron ${totalPrices} zonas de precios`);
        }
      } else {
        toast.error(response.error || 'Error al extraer precios de la imagen');
      }
    } catch (error) {
      console.error('Error extracting prices from image:', error);
      toast.error('Error al procesar la imagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      handleExtractFromImage(base64);
    };
    reader.onerror = () => {
      toast.error('Error al leer el archivo');
    };
    reader.readAsDataURL(file);
  };

  const getAvailabilityBadge = (availability?: string) => {
    const status = availability?.toLowerCase() || '';
    
    if (status.includes('agotado') || status.includes('sold')) {
      return <Badge variant="destructive">🔴 Agotado</Badge>;
    }
    if (status.includes('poca') || status.includes('few') || status.includes('última')) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">🟡 Pocas unidades</Badge>;
    }
    if (status.includes('próxima') || status.includes('soon')) {
      return <Badge variant="secondary">⏳ Próximamente</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">🟢 Disponible</Badge>;
  };

  const generatePriceTableHtml = (prices: TicketPrice[], title: string, bgColor: string): string => {
    if (!prices || prices.length === 0) return '';

    const hasServiceFees = prices.some(p => p.service_fee);
    
    const headerCols = hasServiceFees 
      ? '<th style="padding: 12px; text-align: left;">Zona</th><th style="padding: 12px; text-align: left;">Precio</th><th style="padding: 12px; text-align: left;">Servicio</th><th style="padding: 12px; text-align: left;">Disponibilidad</th>'
      : '<th style="padding: 12px; text-align: left;">Zona</th><th style="padding: 12px; text-align: left;">Precio</th><th style="padding: 12px; text-align: left;">Disponibilidad</th>';

    const priceRows = prices.map(p => {
      const availabilityEmoji = p.availability?.toLowerCase().includes('agotado') ? '🔴' :
        p.availability?.toLowerCase().includes('poca') ? '🟡' : 
        p.availability?.toLowerCase().includes('próxima') ? '⏳' : '🟢';
      const availabilityText = p.availability || 'Disponible';
      
      if (hasServiceFees) {
        return `<tr><td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>${p.zone}</strong></td><td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${p.price}</td><td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${p.service_fee || '-'}</td><td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${availabilityEmoji} ${availabilityText}</td></tr>`;
      }
      return `<tr><td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>${p.zone}</strong></td><td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${p.price}</td><td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${availabilityEmoji} ${availabilityText}</td></tr>`;
    }).join('\n');

    return `
  <div style="margin-bottom: 20px;">
    <h4 style="margin: 0 0 12px 0; color: #212529; font-size: 1.1rem; background: ${bgColor}; padding: 10px 12px; border-radius: 8px 8px 0 0; margin-bottom: 0;">${title}</h4>
    <table style="width: 100%; border-collapse: collapse; background: white;">
      <thead>
        <tr style="background: #495057; color: white;">
          ${headerCols}
        </tr>
      </thead>
      <tbody>
        ${priceRows}
      </tbody>
    </table>
  </div>`;
  };

  const generateHtmlBlock = (): string => {
    if (!extractedData) return '';
    
    const hasPresale = extractedData.presale_prices && extractedData.presale_prices.length > 0;
    const hasRegular = extractedData.regular_prices && extractedData.regular_prices.length > 0;
    
    if (!hasPresale && !hasRegular) return '';

    const today = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    let sourceDomain = '';
    try {
      sourceDomain = new URL(extractedData.source_url).hostname.replace('www.', '');
    } catch {
      sourceDomain = 'fuente oficial';
    }

    const presaleTable = hasPresale 
      ? generatePriceTableHtml(extractedData.presale_prices, '🎟️ Precios Preventa', '#e3f2fd')
      : '';
    
    const regularTable = hasRegular 
      ? generatePriceTableHtml(extractedData.regular_prices, '🎫 Precios Venta General', '#f5f5f5')
      : '';

    let datesInfo = '';
    if (extractedData.presale_date || extractedData.general_sale_date) {
      const parts = [];
      if (extractedData.presale_date) parts.push(`<strong>Preventa:</strong> ${extractedData.presale_date}`);
      if (extractedData.general_sale_date) parts.push(`<strong>Venta general:</strong> ${extractedData.general_sale_date}`);
      datesInfo = `<p style="margin-top: 12px; padding: 10px; background: #fff3cd; border-radius: 6px;">${parts.join(' | ')}</p>`;
    }

    return `
<div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #dee2e6;">
  <h3 style="margin: 0 0 16px 0; color: #212529; font-size: 1.25rem;">🎫 Precios de Entradas</h3>
  ${presaleTable}
  ${regularTable}
  ${datesInfo}
  <p style="margin: 16px 0 0 0; font-size: 0.85rem; color: #6c757d;">
    <em>Precios actualizados: ${today} | Fuente: <a href="${extractedData.source_url}" target="_blank" rel="noopener noreferrer" style="color: #0d6efd;">${sourceDomain}</a></em>
  </p>
</div>
`.trim();
  };

  const handleInsert = () => {
    const html = generateHtmlBlock();
    if (html && onInsertContent) {
      onInsertContent(html);
      toast.success('Tabla de precios insertada en el contenido');
    }
  };

  const handleSave = () => {
    const html = generateHtmlBlock();
    if (html && onPricesExtracted) {
      onPricesExtracted(html);
      setHasSavedPrices(true);
      toast.success('Precios guardados correctamente');
    }
  };

  const handleClearPrices = () => {
    if (onPricesExtracted) {
      onPricesExtracted(null);
      setHasSavedPrices(false);
      setExtractedData(null);
      toast.success('Precios eliminados');
    }
  };

  const handleCopyHtml = async () => {
    const html = generateHtmlBlock();
    if (html) {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      toast.success('HTML copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderPriceTable = (prices: TicketPrice[], title: string, badgeVariant: 'default' | 'secondary') => {
    if (!prices || prices.length === 0) return null;
    
    const hasServiceFees = prices.some(p => p.service_fee);

    return (
      <div className="space-y-2">
        <Badge variant={badgeVariant} className="text-xs">{title}</Badge>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium">Zona</th>
                <th className="text-left p-3 font-medium">Precio</th>
                {hasServiceFees && <th className="text-left p-3 font-medium">Servicio</th>}
                <th className="text-left p-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {prices.map((price, index) => (
                <tr key={index} className="hover:bg-muted/30">
                  <td className="p-3 font-medium">{price.zone}</td>
                  <td className="p-3">{price.price}</td>
                  {hasServiceFees && <td className="p-3 text-muted-foreground">{price.service_fee || '-'}</td>}
                  <td className="p-3">{getAvailabilityBadge(price.availability)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const hasData = extractedData && (
    (extractedData.presale_prices?.length || 0) + (extractedData.regular_prices?.length || 0) > 0
  );

  // Determine mode: news (insert) or concerts/festivals (save)
  const isNewsMode = !!onInsertContent;
  const isSaveMode = !!onPricesExtracted;

  // Compact mode renders as collapsible
  if (compact) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between" type="button">
            <span className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Extracción de Precios
              {hasSavedPrices && (
                <Badge variant="secondary" className="ml-2">Precios guardados</Badge>
              )}
            </span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            {hasSavedPrices && !extractedData && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Ya hay precios guardados para este evento.</span>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleClearPrices}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <Tabs value={extractionMethod} onValueChange={(v) => setExtractionMethod(v as 'url' | 'image')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Desde URL
                </TabsTrigger>
                <TabsTrigger value="image" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Desde Imagen
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="url" className="mt-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://tuboleta.com/evento/..."
                      disabled={isLoading}
                    />
                  </div>
                  <Button onClick={handleExtractFromUrl} disabled={isLoading || !url.trim()} type="button">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Extrayendo...
                      </>
                    ) : (
                      'Extraer'
                    )}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="image" className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://ejemplo.com/precios.jpg"
                      disabled={isLoading}
                    />
                  </div>
                  <Button onClick={() => handleExtractFromImage()} disabled={isLoading || !imageUrl.trim()} type="button">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Procesando...
                      </>
                    ) : (
                      'Extraer'
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">o</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex-1"
                    type="button"
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Subir imagen
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {hasData && (
              <div className="space-y-4">
                {renderPriceTable(extractedData.presale_prices, '🎟️ Precios Preventa', 'default')}
                {renderPriceTable(extractedData.regular_prices, '🎫 Precios Venta General', 'secondary')}

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} className="flex-1" type="button">
                    Guardar Precios
                  </Button>
                  <Button variant="outline" onClick={handleCopyHtml} type="button">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {extractedData && !hasData && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No se encontraron precios. Verifica que la URL sea de una página de venta de tickets.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Full card mode (for news)
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Extractor de Precios de Tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={extractionMethod} onValueChange={(v) => setExtractionMethod(v as 'url' | 'image')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Desde URL
            </TabsTrigger>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Desde Imagen
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="mt-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="ticket-url" className="sr-only">URL de tickets</Label>
                <Input
                  id="ticket-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://tuboleta.com/evento/..."
                  disabled={isLoading}
                />
              </div>
              <Button onClick={handleExtractFromUrl} disabled={isLoading || !url.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Extrayendo...
                  </>
                ) : (
                  'Extraer'
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="image" className="mt-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="image-url" className="sr-only">URL de imagen</Label>
                <Input
                  id="image-url"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/precios.jpg"
                  disabled={isLoading}
                />
              </div>
              <Button onClick={() => handleExtractFromImage()} disabled={isLoading || !imageUrl.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  'Extraer'
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">o</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex-1"
              >
                <Image className="h-4 w-4 mr-2" />
                Subir imagen
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {hasData && (
          <div className="space-y-4">
            {/* Event info */}
            {(extractedData.event_name || extractedData.venue_name) && (
              <div className="text-sm text-muted-foreground">
                {extractedData.event_name && <p><strong>Evento:</strong> {extractedData.event_name}</p>}
                {extractedData.venue_name && <p><strong>Venue:</strong> {extractedData.venue_name}</p>}
              </div>
            )}

            {/* Presale prices table */}
            {renderPriceTable(extractedData.presale_prices, '🎟️ Precios Preventa', 'default')}
            
            {/* Regular prices table */}
            {renderPriceTable(extractedData.regular_prices, '🎫 Precios Venta General', 'secondary')}

            {/* Sale dates */}
            {(extractedData.presale_date || extractedData.general_sale_date) && (
              <div className="flex flex-wrap gap-3 text-sm">
                {extractedData.presale_date && (
                  <div className="flex items-center gap-1">
                    <Badge variant="outline">Preventa</Badge>
                    <span>{extractedData.presale_date}</span>
                  </div>
                )}
                {extractedData.general_sale_date && (
                  <div className="flex items-center gap-1">
                    <Badge variant="outline">Venta General</Badge>
                    <span>{extractedData.general_sale_date}</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {isNewsMode && (
                <Button onClick={handleInsert} className="flex-1">
                  Insertar en Noticia
                </Button>
              )}
              {isSaveMode && (
                <Button onClick={handleSave} className="flex-1">
                  Guardar Precios
                </Button>
              )}
              <Button variant="outline" onClick={handleCopyHtml}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="outline" asChild>
                <a href={extractedData.source_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}

        {extractedData && !hasData && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se encontraron precios en esta página. Verifica que la URL sea de una página de venta de tickets con precios visibles.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
