import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Music, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <SEO 
        title="Página no encontrada - Error 404"
        description="La página que buscas no existe. Descubre conciertos y eventos musicales en América Latina."
        url={location.pathname}
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="text-center max-w-2xl mx-auto">
            {/* Animated 404 Icon */}
            <div className="mb-8 relative">
              <div className="text-[120px] md:text-[180px] font-bold text-primary/20 select-none">
                404
              </div>
              <Music className="h-24 w-24 md:h-32 md:w-32 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>

            {/* Error Message */}
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              ¡Ups! Página no encontrada
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-md mx-auto">
              Parece que esta página se fue de gira. No podemos encontrarla en nuestro lineup.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/">
                <Button size="lg" className="w-full sm:w-auto">
                  <Home className="h-5 w-5 mr-2" />
                  Volver al inicio
                </Button>
              </Link>
              <Link to="/concerts">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Search className="h-5 w-5 mr-2" />
                  Buscar conciertos
                </Button>
              </Link>
            </div>

            {/* Helpful Links */}
            <div className="mt-12 pt-8 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                Quizás te interese visitar:
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/artists" className="text-primary hover:underline text-sm">
                  Artistas
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link to="/blog" className="text-primary hover:underline text-sm">
                  Noticias
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link to="/advertising" className="text-primary hover:underline text-sm">
                  Publicidad
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default NotFound;
