import { useParams } from 'react-router-dom';
import { useAdminNewsArticle } from '@/hooks/queries/useAdminNews';
import { useRequireAdmin } from '@/hooks/admin/useRequireAdmin';
import { NewsArticleForm } from '@/components/admin/news/NewsArticleForm';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const NewsArticleEditor = () => {
  const { id } = useParams<{ id: string }>();
  const { isReady } = useRequireAdmin();
  const { data: article, isLoading } = useAdminNewsArticle(id ?? '');

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Verificando permisos...</div>
      </div>
    );
  }

  if (id && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NewsArticleForm article={id ? article : null} />
    </div>
  );
};

export default NewsArticleEditor;
