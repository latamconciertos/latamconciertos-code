import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Target, Send } from 'lucide-react';
import { advertisingSchema } from '@/lib/validation';
import { z } from 'zod';
const Advertising = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    ad_type: '',
    budget_range: '',
    campaign_duration: '',
    target_audience: '',
    message: ''
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate input with Zod
      const validatedData = advertisingSchema.parse({
        company_name: formData.company_name.trim(),
        contact_name: formData.contact_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        website: formData.website.trim(),
        ad_type: formData.ad_type,
        budget_range: formData.budget_range,
        campaign_duration: formData.campaign_duration,
        target_audience: formData.target_audience.trim(),
        message: formData.message.trim(),
      });

      const {
        error
      } = await supabase.from('advertising_requests').insert([{
        company_name: validatedData.company_name,
        contact_name: validatedData.contact_name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        website: validatedData.website || null,
        ad_type: validatedData.ad_type,
        budget_range: validatedData.budget_range || null,
        campaign_duration: validatedData.campaign_duration || null,
        target_audience: validatedData.target_audience || null,
        message: validatedData.message || null,
      }]);
      if (error) throw error;
      toast({
        title: '¡Solicitud enviada!',
        description: 'Nos pondremos en contacto contigo pronto.'
      });
      navigate('/');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: 'Error de validación',
          description: firstError.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'No se pudo enviar la solicitud. Inténtalo de nuevo.',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  return <>
      <SEO title="Publicidad - Conciertos Latam" description="Anuncia con nosotros y alcanza miles de fanáticos de la música en América Latina" url="/publicidad" />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Target className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground font-fira">
                Publicidad en Conciertos Latam
              </h1>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Solicitud de Pauta</CardTitle>
                <CardDescription>
                  Completa el formulario y nos pondremos en contacto contigo para discutir las opciones de publicidad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Nombre de la Empresa *</Label>
                      <Input id="company_name" required value={formData.company_name} onChange={e => handleChange('company_name', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_name">Nombre de Contacto *</Label>
                      <Input id="contact_name" required value={formData.contact_name} onChange={e => handleChange('contact_name', e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" required value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input id="phone" type="tel" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio Web</Label>
                    <Input id="website" type="url" placeholder="https://" value={formData.website} onChange={e => handleChange('website', e.target.value)} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ad_type">Tipo de Publicidad *</Label>
                      <Select required value={formData.ad_type} onValueChange={value => handleChange('ad_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="banner-principal">Banner Principal</SelectItem>
                          <SelectItem value="banner-lateral">Banner Lateral</SelectItem>
                          <SelectItem value="espacio-premium">Espacio Premium</SelectItem>
                          <SelectItem value="patrocinio-evento">Patrocinio de Evento</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="budget_range">Presupuesto</Label>
                      <Select value={formData.budget_range} onValueChange={value => handleChange('budget_range', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un rango" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="menos-500">Menos de $500</SelectItem>
                          <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                          <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                          <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                          <SelectItem value="mas-10000">Más de $10,000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaign_duration">Duración de la Campaña</Label>
                    <Select value={formData.campaign_duration} onValueChange={value => handleChange('campaign_duration', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la duración" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-mes">1 mes</SelectItem>
                        <SelectItem value="3-meses">3 meses</SelectItem>
                        <SelectItem value="6-meses">6 meses</SelectItem>
                        <SelectItem value="12-meses">12 meses</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_audience">Audiencia Objetivo</Label>
                    <Input id="target_audience" placeholder="Ej: Fanáticos del rock, millennials, etc." value={formData.target_audience} onChange={e => handleChange('target_audience', e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensaje / Comentarios</Label>
                    <Textarea id="message" rows={4} placeholder="Cuéntanos más sobre tus objetivos de publicidad..." value={formData.message} onChange={e => handleChange('message', e.target.value)} />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? 'Enviando...' : 'Enviar Solicitud'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </>;
};
export default Advertising;