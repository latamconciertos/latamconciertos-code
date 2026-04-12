import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Search, Plus } from 'lucide-react';
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
import { useAdminNews, useDeleteNewsArticle } from '@/hooks/queries/useAdminNews';
import type { NewsArticle } from '@/types/entities';

interface Category {
  id: string;
  name: string;
}

export const NewsAdminNew = () => {
  const navigate = useNavigate();
  const { data: articles = [] } = useAdminNews();
  const deleteArticle = useDeleteNewsArticle();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<NewsArticle | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const getCategoryName = (categoryId: string | null) =>
    categories.find((c) => c.id === categoryId)?.name ?? 'Sin categoría';

  const filteredArticles = (articles ?? []).filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteArticle.mutateAsync(deleteTarget.id);
    } catch {
      // Handled by mutation hook
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold text-2xl">Noticias</h2>
          <p className="text-muted-foreground">Gestiona todos los artículos</p>
        </div>
        <Button onClick={() => navigate('/admin/news/new')} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Crear Artículo
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Búsqueda"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 font-semibold text-sm">
          <div className="col-span-1">Imagen</div>
          <div className="col-span-4">Título</div>
          <div className="col-span-2">Fecha</div>
          <div className="col-span-2">Secciones</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-1 text-right">Acciones</div>
        </div>

        <div className="divide-y">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/admin/news/edit/${article.id}`)}
            >
              <div className="col-span-1">
                {article.featured_image ? (
                  <img
                    src={article.featured_image}
                    alt={article.title}
                    className="w-12 h-12 rounded object-cover"
                    loading="lazy"
                    decoding="async"
                    width={48}
                    height={48}
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Sin img</span>
                  </div>
                )}
              </div>
              <div className="col-span-4">
                <h3 className="font-medium line-clamp-2">{article.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {getCategoryName(article.category_id)}
                </p>
              </div>
              <div className="col-span-2 text-sm text-muted-foreground">
                {article.published_at
                  ? new Date(article.published_at).toLocaleDateString('es', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'No publicado'}
              </div>
              <div className="col-span-2">
                <Badge variant="secondary">
                  {getCategoryName(article.category_id)}
                </Badge>
              </div>
              <div className="col-span-2">
                <Badge
                  className={
                    article.status === 'published'
                      ? 'bg-green-100 text-green-800 hover:bg-green-100'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                  }
                >
                  {article.status === 'published' ? 'Publicado' : 'Borrador'}
                </Badge>
              </div>
              <div className="col-span-1 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/news/edit/${article.id}`);
                  }}
                >
                  <Eye className="w-4 h-4 text-blue-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(article);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar artículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El artículo{' '}
              <strong>&quot;{deleteTarget?.title}&quot;</strong> será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
