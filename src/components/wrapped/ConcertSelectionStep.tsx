import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, ChevronRight, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import logo from '@/assets/logo.png';

interface ConcertSelectionStepProps {
  year: number;
  onComplete: () => void;
  onSkip: () => void;
}

interface PastConcert {
  id: string;
  title: string;
  date: string;
  artists: { name: string; photo_url: string | null } | null;
  venues: { name: string; cities: { name: string } | null } | null;
}

const ConcertSelectionStep = ({ year, onComplete, onSkip }: ConcertSelectionStepProps) => {
  const [concerts, setConcerts] = useState<PastConcert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch past concerts for the year
  useEffect(() => {
    const fetchConcerts = async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('concerts')
        .select('id, title, date, artists(name, photo_url), venues(name, cities(name))')
        .gte('date', `${year}-01-01`)
        .lte('date', today)
        .order('date', { ascending: false })
        .limit(100);

      if (!error && data) {
        setConcerts(data as unknown as PastConcert[]);
      }
      setLoading(false);
    };

    fetchConcerts();
  }, [year]);

  // Filter concerts client-side
  const filteredConcerts = useMemo(() => {
    if (!debouncedQuery.trim()) return concerts;
    const q = debouncedQuery.toLowerCase();
    return concerts.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.artists?.name && c.artists.name.toLowerCase().includes(q))
    );
  }, [concerts, debouncedQuery]);

  const toggleConcert = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleContinue = async () => {
    if (selectedIds.size === 0) {
      onComplete();
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const rows = Array.from(selectedIds).map((concert_id) => ({
        user_id: session.user.id,
        concert_id,
        attendance_type: 'attending' as const,
        is_favorite: true,
      }));

      await supabase
        .from('favorite_concerts')
        .upsert(rows, { onConflict: 'user_id,concert_id' });

      onComplete();
    } catch (err) {
      console.error('Error saving attended concerts:', err);
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const formatConcertDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d 'de' MMM", { locale: es });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="flex flex-col items-center px-6 pt-8 pb-4">
        <motion.img
          src={logo}
          alt="Conciertos Latam"
          className="mb-6 h-12 w-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        />

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-2 text-center text-2xl font-bold text-white"
        >
          ¿A qué conciertos fuiste en {year}?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-6 text-center text-sm text-gray-400"
        >
          Selecciona los conciertos a los que asististe. Se guardarán en tu perfil.
        </motion.p>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="relative w-full max-w-md"
        >
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por artista o concierto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
          />
        </motion.div>
      </div>

      {/* Concert list */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Music className="h-8 w-8 text-purple-400" />
            </motion.div>
            <p className="mt-3 text-sm text-gray-500">Cargando conciertos...</p>
          </div>
        ) : filteredConcerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-gray-500">
              {debouncedQuery ? 'No se encontraron conciertos' : 'No hay conciertos disponibles'}
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-md space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredConcerts.map((concert, i) => {
                const isSelected = selectedIds.has(concert.id);
                return (
                  <motion.button
                    key={concert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(i * 0.03, 0.6), duration: 0.3 }}
                    onClick={() => toggleConcert(concert.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-purple-500/60 bg-purple-500/10'
                        : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.06]'
                    }`}
                  >
                    {/* Artist photo */}
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/10">
                      {concert.artists?.photo_url ? (
                        <img
                          src={concert.artists.photo_url}
                          alt={concert.artists.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Music className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {concert.title}
                      </p>
                      <p className="truncate text-xs text-gray-400">
                        {concert.artists?.name}
                        {concert.venues?.cities?.name && ` · ${concert.venues.cities.name}`}
                        {concert.date && ` · ${formatConcertDate(concert.date)}`}
                      </p>
                    </div>

                    {/* Checkbox */}
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-purple-400 bg-purple-500'
                          : 'border-gray-600 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating bottom bar */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="fixed inset-x-0 bottom-0 border-t border-white/5 bg-gray-950/90 px-6 py-4 backdrop-blur-lg"
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <p className="text-xs text-gray-400">
            {selectedIds.size === 0
              ? 'Ningún concierto seleccionado'
              : `${selectedIds.size} concierto${selectedIds.size > 1 ? 's' : ''} seleccionado${selectedIds.size > 1 ? 's' : ''}`}
          </p>
          <Button
            onClick={handleContinue}
            disabled={saving}
            className="w-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 py-6 text-base font-bold text-white hover:from-purple-700 hover:to-indigo-700"
          >
            {saving ? 'Guardando...' : 'Continuar'}
          </Button>
          <button
            onClick={onSkip}
            className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-300"
          >
            Saltar
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ConcertSelectionStep;
