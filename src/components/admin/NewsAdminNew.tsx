import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Pencil, Search, Plus } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
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

  const filteredArticles = useMemo(
    () =>
      (articles ?? []).filter((article) => {
        const matchesSearch =
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.slug.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
        const matchesCategory =
          categoryFilter === 'all' || article.category_id === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
      }),
    [articles, searchTerm, statusFilter, categoryFilter],
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
          <h2 className="text-2xl font-bold">Gestión de Noticias</h2>
          <p className="text-muted-foreground">Gestiona todos los artículos</p>
        </div>
        <Button onClick={() => navigate('/admin/news/new')} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Crear Artículo
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o slug…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las secciones</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredArticles.length} de {articles.length}
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="grid grid-cols-12 gap-4 px-4 py-2.5 bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <div className="col-span-6">Artículo</div>
          <div className="col-span-3">Fecha</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-1 text-right">Acciones</div>
        </div>

        <div className="divide-y">
          {filteredArticles.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No se encontraron artículos.
            </div>
          ) : (
            filteredArticles.map((article) => (
              <div
                key={article.id}
                className="grid grid-cols-12 gap-4 px-4 py-2.5 items-center hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/news/edit/${article.id}`)}
              >
                <div className="col-span-6 flex items-center gap-3 min-w-0">
                  {article.featured_image ? (
                    <img
                      src={article.featured_image}
                      alt=""
                      className="w-10 h-10 rounded object-cover shrink-0"
                      loading="lazy"
                      decoding="async"
                      width={40}
                      height={40}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                      <span className="text-[10px] text-muted-foreground">Sin img</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{article.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {getCategoryName(article.category_id)}
                    </p>
                  </div>
                </div>
                <div className="col-span-3 text-sm text-muted-foreground">
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
                <div className="col-span-1 flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/news/edit/${article.id}`);
                    }}
                    aria-label="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(article);
                    }}
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
