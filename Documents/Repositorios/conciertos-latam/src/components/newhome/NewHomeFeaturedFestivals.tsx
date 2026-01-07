import { motion } from 'framer-motion';
import { PartyPopper, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModernFestivalCard } from './ModernFestivalCard';
import { useQuery } from '@tanstack/react-query';
import { festivalService } from '@/services/festivalService';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { Link, useNavigate } from 'react-router-dom';

export const NewHomeFeaturedFestivals = () => {
    const navigate = useNavigate();

    // Fetch upcoming festivals (limit to 6 for the grid)
    const { data: festivals = [], isLoading } = useQuery({
        queryKey: ['upcoming-festivals-newhome'],
        queryFn: async () => {
            const result = await festivalService.getUpcoming(6);
            if (!result.success) throw new Error(result.error || 'Error fetching upcoming festivals');
            return result.data || [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const handleFestivalClick = (festival: any) => {
        // Navigate to festivals page - in future could open modal
        navigate('/festivals');
    };

    if (isLoading) {
        return (
            <section className="w-full py-16 md:py-20 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center">
                        <LoadingSpinnerInline />
                    </div>
                </div>
            </section>
        );
    }

    if (festivals.length === 0) {
        return null;
    }

    return (
        <section className="w-full py-8 md:py-12 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary text-base px-4 py-1.5 font-bold font-fira mb-4">
                        <PartyPopper className="h-4 w-4 mr-2" />
                        Festivales Destacados
                    </Badge>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 font-fira">
                        Las Mejores Experiencias Musicales
                    </h2>
                    <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                        Descubre los festivales más esperados de la región
                    </p>
                </motion.div>

                {/* Festival Cards Grid - Same layout as concerts */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {festivals.map((festival, index) => (
                        <motion.div
                            key={festival.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                            <ModernFestivalCard
                                festival={festival}
                                onClick={() => handleFestivalClick(festival)}
                            />
                        </motion.div>
                    ))}
                </div>

                {/* View All Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-12"
                >
                    <Link to="/festivals">
                        <Button
                            size="lg"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 py-3 text-base rounded-lg transition-all hover:scale-105"
                        >
                            Ver Todos los Festivales
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};
