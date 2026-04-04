import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const WrappedBanner = () => {
  const { data: banner } = useQuery({
    queryKey: ['site-banner', 'wrapped-2026'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('site_banners')
        .select('*')
        .eq('slug', 'wrapped-2026')
        .eq('active', true)
        .maybeSingle();
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  if (!banner) return null;

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Link to={banner.link || '/wrapped'}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${banner.bg_color_from || '#004aad'}, ${banner.bg_color_to || '#003080'})`,
            }}
          >
            {/* Subtle animated glow */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </div>

            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white/90" />
                </motion.div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white font-fira">
                    {banner.title}
                  </h3>
                  {banner.description && (
                    <p className="text-sm sm:text-base text-white/70 mt-1">
                      {banner.description}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant="secondary"
                className="hidden sm:flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-sm"
              >
                Descubrir
                <ChevronRight className="h-4 w-4" />
              </Button>
              <ChevronRight className="h-6 w-6 text-white/60 sm:hidden shrink-0" />
            </div>
          </motion.div>
        </Link>
      </div>
    </section>
  );
};
