import { useState, useEffect, useMemo } from 'react';
import { NewsMediaManager } from './NewsMediaManager';
import { TicketPriceExtractor } from './TicketPriceExtractor';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Eye, Search, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from './ImageUpload';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RichTextEditor } from './RichTextEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { QualityIndicator } from './QualityIndicator';
import { slugify, isValidSlug } from '@/lib/slugify';
import { toast } from 'sonner';
import { 
  useAdminNews, 
  useCreateNewsArticle, 
  useUpdateNewsArticle, 
  useDeleteNewsArticle 
} from '@/hooks/queries/useAdminNews';
import { newsArticleSchema } from '@/lib/validation';
import type { NewsArticle } from '@/types/entities';

interface Category {
  id: string;
  name: string;
}
interface Artist {
  id: string;
  name: string;
  photo_url: string | null;
}
interface Author {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
}

export const NewsAdminNew = () => {
  // React Query hooks for articles
  const { data: articles = [], isLoading: articlesLoading } = useAdminNews();
  const createArticle = useCreateNewsArticle();
  const updateArticle = useUpdateNewsArticle();
  const deleteArticle = useDeleteNewsArticle();

  // Local state for related entities
  const [categories, setCategories] = useState<Category[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    meta_title: '',
    meta_description: '',
    keywords: '',
    featured_image: '',
    photo_credit: '',
    status: 'draft',
    category_id: '',
    artist_id: '',
    author_id: '',
    concert_id: '',
    published_at: ''
  });
  const [mediaItems, setMediaItems] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchArtists();
    fetchAuthors();
    fetchConcerts();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('name');
    if (data) setCategories(data);
  };

  const fetchArtists = async () => {
    const { data } = await supabase.from('artists').select('id, name, photo_url').order('name');
    if (data) setArtists(data);
  };

  const fetchAuthors = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name')
      .order('username');
    if (data) setAuthors(data);
  };

  const [concerts, setConcerts] = useState<any[]>([]);

  const fetchConcerts = async () => {
    const { data } = await supabase
      .from('concerts')
      .select('id, title, date, ticket_url')
      .order('date', { ascending: false })
      .limit(100);
    if (data) setConcerts(data);
  };

  // Get selected concert's ticket URL
  const selectedConcertTicketUrl = useMemo(() => {
    if (!formData.concert_id || formData.concert_id === 'none') return '';
    const concert = concerts.find(c => c.id === formData.concert_id);
    return concert?.ticket_url || '';
  }, [formData.concert_id, concerts]);

  // Handle inserting price content into the article
  const handleInsertPriceContent = (html: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + '\n\n' + html
    }));
  };
  const generateSlug = (title: string) => {
    return slugify(title);
  };

  // Análisis de calidad del artículo
  const analyzeArticleQuality = useMemo(() => {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Contar palabras en el contenido (sin HTML)
    const textContent = formData.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
    
    // Validaciones críticas
    if (wordCount < 300) {
      issues.push(`Contenido muy corto (${wordCount} palabras). Mínimo recomendado: 300 palabras.`);
    }
    
    if (!formData.meta_description || formData.meta_description.length < 120) {
      issues.push('Meta descripción muy corta (mínimo 120 caracteres)');
    }
    
    if (formData.meta_description && formData.meta_description.length > 160) {
      warnings.push('Meta descripción muy larga (máximo 160 caracteres recomendado)');
    }
    
    if (!formData.featured_image) {
      issues.push('Imagen destacada requerida para SEO');
    }
    
    const keywordCount = formData.keywords ? formData.keywords.split(',').filter(k => k.trim().length > 0).length : 0;
    if (keywordCount < 3) {
      warnings.push('Agrega al menos 3 keywords para mejor SEO');
    }
    
    if (!formData.category_id) {
      issues.push('Categoría requerida');
    }

    if (!formData.author_id && formData.status === 'published') {
      issues.push('Autor requerido para artículos publicados');
    }

    // Validar formato del slug
    if (formData.slug && !isValidSlug(formData.slug)) {
      issues.push('El slug contiene caracteres inválidos. Solo se permiten letras minúsculas, números y guiones.');
    }
    
    return { 
      issues, 
      warnings, 
      wordCount,
      metaDescLength: formData.meta_description?.length || 0,
      keywordCount,
      isValid: issues.length === 0 
    };
  }, [formData]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar calidad antes de publicar
    if (formData.status === 'published' && !analyzeArticleQuality.isValid) {
      toast.error('El artículo no cumple con los requisitos mínimos de calidad. Revisa los problemas detectados.');
      return;
    }
    
    // Determinar published_at basado en el contexto
    let publishedAt = formData.published_at;
    
    if (!editingArticle && formData.status === 'published' && !formData.published_at) {
      publishedAt = new Date().toISOString();
    } else if (formData.status !== 'published') {
      publishedAt = '';
    }
    
    const articleData = {
      title: formData.title,
      slug: formData.slug || generateSlug(formData.title),
      content: formData.content || null,
      meta_title: formData.meta_title || null,
      meta_description: formData.meta_description || null,
      keywords: formData.keywords || null,
      featured_image: formData.featured_image || null,
      photo_credit: formData.photo_credit || null,
      published_at: publishedAt || null,
      status: formData.status as 'draft' | 'published' | 'archived',
      category_id: formData.category_id || null,
      artist_id: formData.artist_id === 'none' ? null : formData.artist_id || null,
      author_id: formData.author_id || null,
      concert_id: formData.concert_id === 'none' ? null : formData.concert_id || null
    };

    try {
      if (editingArticle) {
        await updateArticle.mutateAsync({ 
          id: editingArticle.id, 
          data: articleData
        });

        // Eliminar media anterior y guardar nuevo
        await supabase.from('news_media').delete().eq('article_id', editingArticle.id);

        if (mediaItems.length > 0) {
          const mediaData = mediaItems.map((item, index) => ({
            article_id: editingArticle.id,
            media_type: item.media_type,
            media_url: item.media_url,
            caption: item.caption || null,
            position: index
          }));
          await supabase.from('news_media').insert(mediaData);
        }
        resetForm();
      } else {
        const result = await createArticle.mutateAsync(articleData);

        // Guardar media
        if (mediaItems.length > 0 && result) {
          const mediaData = mediaItems.map((item, index) => ({
            article_id: result.id,
            media_type: item.media_type,
            media_url: item.media_url,
            caption: item.caption || null,
            position: index
          }));
          await supabase.from('news_media').insert(mediaData);
        }
        resetForm();
      }
    } catch (error) {
      // Error handled by mutation hooks
    }
  };
  const handleEdit = async (article: NewsArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      content: article.content || '',
      meta_title: article.meta_title || '',
      meta_description: article.meta_description || '',
      keywords: article.keywords || '',
      featured_image: article.featured_image || '',
      photo_credit: article.photo_credit || '',
      status: article.status,
      category_id: article.category_id || '',
      artist_id: article.artist_id || 'none',
      author_id: article.author_id || '',
      concert_id: (article as any).concert_id || 'none',
      published_at: article.published_at || ''
    });

    // Cargar media existente
    const { data: mediaData } = await supabase
      .from('news_media')
      .select('*')
      .eq('article_id', article.id)
      .order('position');
    
    setMediaItems(mediaData || []);
    setShowForm(true);
  };
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta noticia?')) return;
    
    try {
      await deleteArticle.mutateAsync(id);
    } catch (error) {
      // Error handled by mutation hook
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
      photo_credit: '',
      status: 'draft',
      category_id: '',
      artist_id: 'none',
      author_id: '',
      concert_id: 'none',
      published_at: ''
    });
    setMediaItems([]);
    setEditingArticle(null);
    setShowForm(false);
  };
  const filteredArticles = articles.filter(article => article.title.toLowerCase().includes(searchTerm.toLowerCase()) || article.slug.toLowerCase().includes(searchTerm.toLowerCase()));
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  };
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold text-2xl">Noticias</h2>
          <p className="text-muted-foreground">Gestiona todos los artículos</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="lg">+ Crear Articulo</Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Búsqueda" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
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
          {filteredArticles.map(article => <div key={article.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors">
              <div className="col-span-1">
                {article.featured_image ? <img src={article.featured_image} alt={article.title} className="w-12 h-12 rounded object-cover" /> : <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Sin img</span>
                  </div>}
              </div>
              <div className="col-span-4">
                <h3 className="font-medium line-clamp-2">{article.title}</h3>
                <p className="text-sm text-muted-foreground">{getCategoryName(article.category_id)}</p>
              </div>
              <div className="col-span-2 text-sm text-muted-foreground">
                {article.published_at ? new Date(article.published_at).toLocaleDateString('es', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'No publicado'}
              </div>
              <div className="col-span-2">
                <Badge variant="secondary">{getCategoryName(article.category_id)}</Badge>
              </div>
              <div className="col-span-2">
                <Badge className={article.status === 'published' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-800 hover:bg-gray-100'}>
                  {article.status === 'published' ? 'Publicado' : 'Borrador'}
                </Badge>
              </div>
              <div className="col-span-1 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(article)}>
                  <Eye className="w-4 h-4 text-blue-600" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(article.id)}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>)}
        </div>
      </div>

      {/* Edit Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingArticle ? 'Modificar el artículo' : 'Nuevo artículo'}
            </SheetTitle>
            <SheetDescription>
              {editingArticle ? 'Edita los detalles del artículo' : 'Completa los campos para crear un nuevo artículo'}
            </SheetDescription>
          </SheetHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Main Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={formData.title} onChange={e => setFormData({
              ...formData,
              title: e.target.value
            })} required placeholder="Ingresa el título del artículo" />
            </div>

            <div>
              <RichTextEditor
                label="Contenido"
                value={formData.content}
                onChange={(value) => setFormData({
                  ...formData,
                  content: value
                })}
                placeholder="Escribe el contenido del artículo aquí..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Palabras: <span className={analyzeArticleQuality.wordCount >= 300 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  {analyzeArticleQuality.wordCount}
                </span> / 300 mínimo
              </p>
            </div>

            <ImageUpload 
              currentImageUrl={formData.featured_image} 
              onImageUploaded={url => setFormData({
                ...formData,
                featured_image: url
              })} 
              enableCrop={true}
            />

            <div>
              <Label htmlFor="photo_credit">Crédito de Foto</Label>
              <Input 
                id="photo_credit" 
                value={formData.photo_credit} 
                onChange={e => setFormData({
                  ...formData,
                  photo_credit: e.target.value
                })} 
                placeholder="Ej: Getty Images, Google Maps, nombre del fotógrafo"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Aparecerá debajo de la imagen destacada
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoría *</Label>
                <Select value={formData.category_id} onValueChange={value => setFormData({
                ...formData,
                category_id: value
              })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={value => setFormData({
                ...formData,
                status: value
              })}>
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
              <Label htmlFor="author">Autor {formData.status === 'published' && '*'}</Label>
              <Select value={formData.author_id} onValueChange={value => setFormData({
              ...formData,
              author_id: value
            })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar autor" />
                </SelectTrigger>
                <SelectContent>
                  {authors.map(author => <SelectItem key={author.id} value={author.id}>
                      {author.first_name} {author.last_name} {author.username && `(@${author.username})`}
                    </SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Obligatorio para artículos publicados
              </p>
            </div>

            {formData.status === 'published' && (
              <div>
                <Label htmlFor="published_at">Fecha de Publicación</Label>
                <Input 
                  id="published_at" 
                  type="datetime-local"
                  value={formData.published_at ? new Date(formData.published_at).toISOString().slice(0, 16) : ''} 
                  onChange={e => setFormData({
                    ...formData,
                    published_at: e.target.value ? new Date(e.target.value).toISOString() : ''
                  })} 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Esta es la fecha original de publicación. Solo cámbiala si necesitas actualizar la fecha visible.
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="artist">Artista Relacionado (opcional)</Label>
              <Select value={formData.artist_id} onValueChange={value => setFormData({
              ...formData,
              artist_id: value
            })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar artista (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {artists.map(artist => <SelectItem key={artist.id} value={artist.id}>
                      {artist.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Si no subes una imagen, se usará la foto del artista seleccionado
              </p>
            </div>

            <div>
              <Label htmlFor="concert">Concierto Relacionado (opcional)</Label>
              <Select value={formData.concert_id} onValueChange={value => setFormData({
              ...formData,
              concert_id: value
            })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar concierto (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {concerts.map(concert => {
                    // Formatear fecha sin conversión de zona horaria
                    const formattedDate = concert.date 
                      ? concert.date.split('-').reverse().join('/')
                      : 'Sin fecha';
                    return (
                      <SelectItem key={concert.id} value={concert.id}>
                        {concert.title} - {formattedDate}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Ticket Price Extractor */}
            <div className="border-t pt-4">
              <TicketPriceExtractor
                ticketUrl={selectedConcertTicketUrl}
                onInsertContent={handleInsertPriceContent}
              />
            </div>

            {/* Galería multimedia */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Galería Multimedia</h3>
              <NewsMediaManager
                articleId={editingArticle?.id}
                initialMedia={mediaItems}
                onChange={setMediaItems}
              />
            </div>

            {/* SEO Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">SEO</h3>
              
              <div>
                <Label htmlFor="meta_title">Meta Título</Label>
                <Input id="meta_title" value={formData.meta_title} onChange={e => setFormData({
                ...formData,
                meta_title: e.target.value
              })} placeholder="Título para SEO" />
              </div>

              <div>
                <Label htmlFor="meta_description">Meta Descripción *</Label>
                <Textarea id="meta_description" value={formData.meta_description} onChange={e => setFormData({
                ...formData,
                meta_description: e.target.value
              })} rows={3} placeholder="Descripción para SEO (120-160 caracteres)" maxLength={200} />
                <p className="text-xs text-muted-foreground mt-1">
                  Caracteres: <span className={
                    analyzeArticleQuality.metaDescLength >= 120 && analyzeArticleQuality.metaDescLength <= 160
                      ? 'text-green-600 font-semibold'
                      : 'text-yellow-600 font-semibold'
                  }>
                    {analyzeArticleQuality.metaDescLength}
                  </span> / 120-160 recomendado
                </p>
              </div>

              <div>
                <Label htmlFor="keywords">Palabras clave</Label>
                <Input id="keywords" value={formData.keywords} onChange={e => setFormData({
                ...formData,
                keywords: e.target.value
              })} placeholder="palabras, clave, separadas, por, comas" />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={formData.status === 'published' && !analyzeArticleQuality.isValid}
              >
                {editingArticle ? 'Guardar Cambios' : 'Crear Artículo'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>

          {/* Quality Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="sticky top-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Calidad del Artículo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 divide-y">
                  <QualityIndicator
                    label="Palabras"
                    value={analyzeArticleQuality.wordCount}
                    min={300}
                    status={analyzeArticleQuality.wordCount >= 300 ? 'good' : 'bad'}
                  />
                  <QualityIndicator
                    label="Meta Description"
                    value={analyzeArticleQuality.metaDescLength}
                    min={120}
                    max={160}
                  />
                  <QualityIndicator
                    label="Keywords"
                    value={analyzeArticleQuality.keywordCount}
                    min={3}
                    status={analyzeArticleQuality.keywordCount >= 3 ? 'good' : 'warning'}
                  />
                  <QualityIndicator
                    label="Imagen destacada"
                    value={formData.featured_image ? 1 : 0}
                    min={1}
                    status={formData.featured_image ? 'good' : 'bad'}
                  />
                  <QualityIndicator
                    label="Categoría"
                    value={formData.category_id ? 1 : 0}
                    min={1}
                    status={formData.category_id ? 'good' : 'bad'}
                  />
                  <QualityIndicator
                    label="Autor"
                    value={formData.author_id ? 1 : 0}
                    min={1}
                    status={formData.author_id ? 'good' : (formData.status === 'published' ? 'bad' : 'warning')}
                  />
                </CardContent>
              </Card>

              {analyzeArticleQuality.issues.length > 0 && (
                <Alert variant="destructive">
                  <AlertTitle>Problemas detectados</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 space-y-1 text-sm">
                      {analyzeArticleQuality.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {analyzeArticleQuality.warnings.length > 0 && analyzeArticleQuality.issues.length === 0 && (
                <Alert>
                  <AlertTitle>Advertencias</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 space-y-1 text-sm">
                      {analyzeArticleQuality.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {analyzeArticleQuality.isValid && analyzeArticleQuality.warnings.length === 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertTitle className="text-green-800">¡Artículo listo!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    El artículo cumple con todos los requisitos de calidad.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
        </SheetContent>
      </Sheet>
    </div>;
};