import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, Trash2, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdvertisingRequest {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  ad_type: string;
  budget_range: string | null;
  campaign_duration: string | null;
  target_audience: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

const AdvertisingAdmin = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<AdvertisingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AdvertisingRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('advertising_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las solicitudes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('advertising_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Estado actualizado',
        description: 'El estado de la solicitud ha sido actualizado',
      });

      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta solicitud?')) return;

    try {
      const { error } = await supabase
        .from('advertising_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Solicitud eliminada',
        description: 'La solicitud ha sido eliminada correctamente',
      });

      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la solicitud',
        variant: 'destructive',
      });
    }
  };

  const statusChipClasses: Record<string, string> = {
    pending: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    contacted: 'border-periwinkle/30 bg-periwinkle/10 text-periwinkle',
    approved: 'border-verde/30 bg-verde/10 text-verde',
    rejected: 'border-destructive/30 bg-destructive/10 text-destructive',
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      contacted: 'Contactado',
      approved: 'Aprobado',
      rejected: 'Rechazado',
    };

    return (
      <Badge variant="outline" className={statusChipClasses[status] || 'border-linea bg-superficie-2 text-texto-2'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const viewDetails = (request: AdvertisingRequest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Cargando solicitudes...</div>;
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const contactedCount = requests.filter((r) => r.status === 'contacted').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display uppercase tracking-[0.01em] font-extrabold text-2xl text-texto">Solicitudes de Publicidad</h2>
          <p className="text-texto-2">Leads comerciales que llegan desde /publicidad</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[20px] border border-linea bg-superficie p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-2">Total</p>
          <p className="font-display text-3xl font-extrabold text-texto mt-1">{requests.length}</p>
        </div>
        <div className="rounded-[20px] border border-linea bg-superficie p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-2">Pendientes</p>
          <p className="font-display text-3xl font-extrabold text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="rounded-[20px] border border-linea bg-superficie p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-2">Contactados</p>
          <p className="font-display text-3xl font-extrabold text-periwinkle mt-1">{contactedCount}</p>
        </div>
        <div className="rounded-[20px] border border-linea bg-superficie p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-texto-2">Aprobados</p>
          <p className="font-display text-3xl font-extrabold text-verde mt-1">{approvedCount}</p>
        </div>
      </div>

      <div className="rounded-[20px] border border-linea bg-superficie overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-linea hover:bg-transparent">
              <TableHead className="text-texto-2">Fecha</TableHead>
              <TableHead className="text-texto-2">Empresa</TableHead>
              <TableHead className="text-texto-2">Contacto</TableHead>
              <TableHead className="text-texto-2">Tipo</TableHead>
              <TableHead className="text-texto-2">Presupuesto</TableHead>
              <TableHead className="text-texto-2">Estado</TableHead>
              <TableHead className="text-right text-texto-2">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-texto-2">
                  No hay solicitudes
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id} className="border-linea hover:bg-superficie-2/50">
                  <TableCell className="font-medium">
                    {format(new Date(request.created_at), 'dd/MM/yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>{request.company_name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{request.contact_name}</div>
                      <div className="text-texto-2">{request.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{request.ad_type}</TableCell>
                  <TableCell>{request.budget_range || '-'}</TableCell>
                  <TableCell>
                    <Select
                      value={request.status}
                      onValueChange={(value) => updateStatus(request.id, value)}
                    >
                      <SelectTrigger
                        className={`w-32 h-8 rounded-full border text-xs font-semibold ${statusChipClasses[request.status] || 'border-linea bg-superficie-2 text-texto-2'}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="contacted">Contactado</SelectItem>
                        <SelectItem value="approved">Aprobado</SelectItem>
                        <SelectItem value="rejected">Rechazado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-texto-2 hover:text-periwinkle"
                        asChild
                      >
                        <a href={`mailto:${request.email}`} aria-label="Contactar por email">
                          <Mail className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-texto-2 hover:text-periwinkle"
                        onClick={() => viewDetails(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-texto-2 hover:text-destructive"
                        onClick={() => deleteRequest(request.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Solicitud</DialogTitle>
            <DialogDescription>
              Información completa de la solicitud de publicidad
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Empresa</p>
                  <p className="text-sm">{selectedRequest.company_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contacto</p>
                  <p className="text-sm">{selectedRequest.contact_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedRequest.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  <p className="text-sm">{selectedRequest.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sitio Web</p>
                  <p className="text-sm">{selectedRequest.website || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Anuncio</p>
                  <p className="text-sm">{selectedRequest.ad_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Presupuesto</p>
                  <p className="text-sm">{selectedRequest.budget_range || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duración</p>
                  <p className="text-sm">{selectedRequest.campaign_duration || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Audiencia Objetivo</p>
                  <p className="text-sm">{selectedRequest.target_audience || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Mensaje</p>
                  <p className="text-sm">{selectedRequest.message || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de Solicitud</p>
                  <p className="text-sm">
                    {format(new Date(selectedRequest.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-linea">
                <Button
                  asChild
                  className="rounded-full border-0 bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white font-semibold shadow-[0_8px_32px_rgba(117,22,226,.45)] hover:opacity-95"
                >
                  <a href={`mailto:${selectedRequest.email}?subject=Publicidad en Conciertos Latam`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Contactar a {selectedRequest.contact_name}
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvertisingAdmin;
