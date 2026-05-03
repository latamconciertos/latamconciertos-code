import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, User, Users, Trash2, Search } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserProfile {
  id: string;
  username: string;
  is_admin: boolean;
  created_at: string;
  roles: { role: string }[];
}

export const UsersAdmin = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'moderator' | 'user' | 'none'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, is_admin, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = (profiles ?? []).map((user) => ({
        ...user,
        roles: (userRoles ?? [])
          .filter((role) => role.user_id === user.id)
          .map((r) => ({ role: r.role })),
      })) as UserProfile[];

      setUsers(usersWithRoles);
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await supabase.from('user_roles').delete().eq('user_id', userId);

      if (newRole !== 'none') {
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: newRole as 'user' | 'admin' | 'moderator' }]);

        if (error) throw error;
      }

      toast({
        title: 'Éxito',
        description: `Rol actualizado a ${newRole === 'none' ? 'sin rol' : newRole}`,
      });

      fetchUsers();
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el rol del usuario',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userToDelete.id);
      if (error) throw error;

      toast({
        title: 'Usuario eliminado',
        description: 'El usuario ha sido eliminado correctamente',
      });
      fetchUsers();
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el usuario',
        variant: 'destructive',
      });
    } finally {
      setUserToDelete(null);
    }
  };

  const getRoleBadge = (roles: { role: string }[]) => {
    if (roles.length === 0) {
      return <Badge variant="outline" className="text-[10px]">Sin rol</Badge>;
    }

    const role = roles[0].role;
    const variants = {
      admin: { variant: 'destructive' as const, icon: Shield },
      moderator: { variant: 'default' as const, icon: Users },
      user: { variant: 'secondary' as const, icon: User },
    };

    const config = variants[role as keyof typeof variants] || variants.user;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="text-[10px]">
        <Icon className="w-3 h-3 mr-1" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        user.username?.toLowerCase().includes(searchLower) ||
        user.id.toLowerCase().includes(searchLower);

      let matchesRole = true;
      if (roleFilter !== 'all') {
        if (roleFilter === 'none') matchesRole = user.roles.length === 0;
        else matchesRole = user.roles[0]?.role === roleFilter;
      }

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize, roleFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">Administra roles y permisos de usuarios</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
          <SelectTrigger className="w-[160px] h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderador</SelectItem>
            <SelectItem value="user">Usuario</SelectItem>
            <SelectItem value="none">Sin rol</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredUsers.length} de {users.length}
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <div className="col-span-4">Usuario</div>
          <div className="col-span-2">ID</div>
          <div className="col-span-2">Rol</div>
          <div className="col-span-2">Registro</div>
          <div className="col-span-2 text-right">Cambiar rol</div>
        </div>

        <div className="divide-y">
          {paginatedUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {searchQuery || roleFilter !== 'all'
                ? 'No se encontraron usuarios.'
                : 'No hay usuarios registrados.'}
            </div>
          ) : (
            paginatedUsers.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-12 gap-4 px-4 py-2.5 items-center hover:bg-muted/40 transition-colors"
              >
                <div className="col-span-4 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium truncate">{user.username || 'Sin nombre'}</span>
                </div>
                <div className="col-span-2">
                  <code className="text-[10px] bg-muted px-2 py-0.5 rounded">
                    {user.id.slice(0, 8)}…
                  </code>
                </div>
                <div className="col-span-2">{getRoleBadge(user.roles)}</div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString('es', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="col-span-2 flex justify-end items-center gap-2">
                  <Select
                    value={user.roles[0]?.role ?? 'none'}
                    onValueChange={(value) => updateUserRole(user.id, value)}
                  >
                    <SelectTrigger className="h-8 w-[120px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="none">Sin rol</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setUserToDelete(user)}
                    aria-label="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1}–{Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length}
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Por página:</span>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <span className="text-sm">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario{' '}
              <strong>&quot;{userToDelete?.username || userToDelete?.id.slice(0, 8)}&quot;</strong>{' '}
              será eliminado permanentemente de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
