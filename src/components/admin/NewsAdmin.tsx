import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Plus } from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
  keywords: string;
  featured_image: string;
  status: string;
  category_id: string;
  published_at: string;
}

interface Category {
  id: string;
  name: string;
}

export const NewsAdmin = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    meta_title: '',
    meta_description: '',
    keywords: '',
    featured_image: '',
    status: 'draft',
    category_id: '',
  });

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las noticias",
        variant: "destructive",
      });
    } else {
      setArticles(data || []);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      });
    } else {
      setCategories(data || []);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const articleData = {
      ...formData,
      slug: formData.slug || generateSlug(formData.title),
      published_at: formData.status === 'published' ? new Date().toISOString() : null,
      status: formData.status as 'draft' | 'published' | 'archived',
    };

    if (editingArticle) {
      const { error } = await supabase
        .from('news_articles')
        .update(articleData)
        .eq('id', editingArticle.id);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar la noticia",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Noticia actualizada correctamente",
        });
        resetForm();
        fetchArticles();
      }
    } else {
      const { error } = await supabase
        .from('news_articles')
        .insert([articleData]);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo crear la noticia",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Éxito",
          description: "Noticia creada correctamente",
        });
        resetForm();
        fetchArticles();
      }
    }
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      content: article.content || '',
      meta_title: article.meta_title || '',
      meta_description: article.meta_description || '',
      keywords: article.keywords || '',
      featured_image: article.featured_image || '',
      status: article.status,
      category_id: article.category_id || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta noticia?')) return;

    const { error } = await supabase
      .from('news_articles')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la noticia",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Noticia eliminada correctamente",
      });
      fetchArticles();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      meta_title: '',
      meta_description: '',
      keywords: '',
      featured_image: '',
      status: 'draft',
      category_id: '',
    });
    setEditingArticle(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Noticias</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Noticia
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingArticle ? 'Editar Noticia' : 'Nueva Noticia'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Se genera automáticamente"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Contenido</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="meta_title">Meta Título (SEO)</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="keywords">Palabras clave (SEO)</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="meta_description">Meta Descripción (SEO)</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="featured_image">URL de imagen destacada</Label>
                <Input
                  id="featured_image"
                  value={formData.featured_image}
                  onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingArticle ? 'Actualizar' : 'Crear'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {articles.map((article) => (
          <Card key={article.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold">{article.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Estado: {article.status} | Slug: {article.slug}
                  </p>
                  {article.meta_description && (
                    <p className="text-sm mt-2">{article.meta_description}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(article)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(article.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};