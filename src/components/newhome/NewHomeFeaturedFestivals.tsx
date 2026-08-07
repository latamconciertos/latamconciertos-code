import { motion } from 'framer-motion';
import { ModernFestivalCard } from './ModernFestivalCard';
import { SectionHeader } from './SectionHeader';
import { useQuery } from '@tanstack/react-query';
import { festivalService } from '@/services/festivalService';
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';
import { useNavigate } from 'react-router-dom';

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

    const handleFestivalClick = (_festival: any) => {
        // Navigate to festivals page - in future could open modal
        navigate('/festivals');
    };

    if (isLoading) {
        return (
            <section className="w-full py-12 md:py-16">
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
        <section className="w-full py-12 md:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <SectionHeader
                    eyebrow="Festivales"
                    title="Festivales imperdibles"
                    subtitle="Los festivales más esperados de la región, con lineup y fechas."
                    action={{ label: 'Ver todos los festivales', to: '/festivals' }}
                />

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

            </div>
        </section>
    );
};
