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
import { Target, Eye, Trash2 } from 'lucide-react';
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'default',
      contacted: 'secondary',
      approved: 'secondary',
      rejected: 'destructive',
    };

    const labels: Record<string, string> = {
      pending: 'Pendiente',
      contacted: 'Contactado',
      approved: 'Aprobado',
      rejected: 'Rechazado',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Solicitudes de Publicidad</h2>
        </div>
        <Badge variant="secondary">{requests.length} solicitudes</Badge>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Presupuesto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No hay solicitudes
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {format(new Date(request.created_at), 'dd/MM/yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>{request.company_name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{request.contact_name}</div>
                      <div className="text-muted-foreground">{request.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{request.ad_type}</TableCell>
                  <TableCell>{request.budget_range || '-'}</TableCell>
                  <TableCell>
                    <Select
                      value={request.status}
                      onValueChange={(value) => updateStatus(request.id, value)}
                    >
                      <SelectTrigger className="w-32">
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
                        onClick={() => viewDetails(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRequest(request.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvertisingAdmin;
