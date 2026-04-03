import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria_type: string;
  criteria_value: any;
}

interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badges: Badge;
}

interface BadgesDisplayProps {
  userId: string;
}

const BadgesDisplay = ({ userId }: BadgesDisplayProps) => {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, [userId]);

  const fetchBadges = async () => {
    try {
      // Obtener todas las insignias disponibles
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('criteria_value->count', { ascending: true });

      if (badgesError) throw badgesError;
      setAllBadges(badges || []);

      // Obtener insignias del usuario
      const { data: userBadgesData, error: userBadgesError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', userId);

      if (userBadgesError) throw userBadgesError;
      setUserBadges(userBadgesData || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasBadge = (badgeId: string) => {
    return userBadges.some(ub => ub.badge_id === badgeId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (allBadges.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay insignias disponibles</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {allBadges.map((badge) => {
        const earned = hasBadge(badge.id);
        return (
          <Card
            key={badge.id}
            className={`p-4 text-center transition-all ${
              earned
                ? 'bg-primary/10 border-primary'
                : 'opacity-50 grayscale'
            }`}
          >
            <div className="text-4xl mb-2">{badge.icon}</div>
            <h3 className="font-semibold text-sm mb-1">{badge.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {badge.description}
            </p>
            {earned && (
              <div className="mt-2">
                <span className="inline-block bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  ✓ Desbloqueada
                </span>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default BadgesDisplay;
