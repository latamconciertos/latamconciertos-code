import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, User, Users } from 'lucide-react';

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

      const usersWithRoles = profiles?.map(user => ({
        ...user,
        roles: userRoles?.filter(role => role.user_id === user.id).map(r => ({ role: r.role })) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // First, remove existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then add the new role
      if (newRole !== 'none') {
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: newRole as 'user' | 'admin' | 'moderator' }]);

        if (error) throw error;
      }

      toast({
        title: "Éxito",
        description: "Rol de usuario actualizado correctamente",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol del usuario",
        variant: "destructive",
      });
    }
  };


  const getRoleIcon = (roles: { role: string }[]) => {
    if (roles.some(r => r.role === 'admin')) return <Shield className="w-4 h-4 text-red-500" />;
    if (roles.some(r => r.role === 'moderator')) return <Users className="w-4 h-4 text-blue-500" />;
    return <User className="w-4 h-4 text-gray-500" />;
  };

  const getCurrentRole = (roles: { role: string }[]) => {
    if (roles.length === 0) return 'none';
    return roles[0].role;
  };

  if (loading) {
    return <div>Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        <div className="text-sm text-muted-foreground">
          Total: {users.length} usuarios
        </div>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getRoleIcon(user.roles)}
                    <div>
                      <h3 className="font-semibold">
                        {user.username || 'Usuario sin nombre'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        ID: {user.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {user.is_admin && (
                      <Badge variant="destructive">
                        Admin
                      </Badge>
                    )}
                    {user.roles.map((role, index) => (
                      <Badge key={index} variant="secondary">
                        {role.role}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Select
                    value={getCurrentRole(user.roles)}
                    onValueChange={(value) => updateUserRole(user.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin rol</SelectItem>
                      <SelectItem value="user">Usuario</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground">
                Registrado: {new Date(user.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};