import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HeroSection } from '@/components/benefits/HeroSection';
import {
  Music,
  Star,
  Crown,
  Zap,
  Gift,
  Users,
  ChevronRight,
  MapPin,
  CalendarDays,
  Award,
  CheckCircle2,
} from 'lucide-react';

// ─── Virtual LATAM Pass Card ─────────────────────────────────────────────────

const PassCard = ({ level = 'Fan', points = 340, concerts = 7 }: { level?: string; points?: number; concerts?: number }) => (
  <div className="relative w-[320px] md:w-[380px] select-none">
    {/* Glow behind card */}
    <div className="absolute -inset-4 bg-blue-600/20 rounded-3xl blur-2xl" />

    {/* Card */}
    <div className="relative rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: 'linear-gradient(135deg, #004aad 0%, #1e40af 40%, #312e81 80%, #4c1d95 100%)' }}>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' /%3E%3C/svg%3E")', backgroundSize: 'cover' }} />

      {/* Decorative circles */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute top-1/2 right-6 w-20 h-20 rounded-full bg-white/5" />

      {/* Content */}
      <div className="relative p-7">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/50 text-[10px] font-semibold tracking-[0.2em] uppercase">Conciertos LATAM</p>
            <p className="text-white font-bold text-lg tracking-wide">LATAM PASS</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
          </div>
        </div>

        {/* Level badge */}
        <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full mb-5">
          <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
          <span className="text-white text-xs font-semibold">{level}</span>
        </div>

        {/* Points big display */}
        <div className="mb-5">
          <p className="text-white/50 text-[11px] uppercase tracking-widest mb-0.5">Puntos acumulados</p>
          <p className="text-white text-4xl font-bold tabular-nums">{points.toLocaleString()}</p>
        </div>

        {/* Progress bar to next level */}
        <div className="mb-5">
          <div className="flex justify-between text-[10px] text-white/50 mb-1.5">
            <span>Progreso al siguiente nivel</span>
            <span>{points} / 500 pts</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full">
            <div
              className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full"
              style={{ width: `${Math.min((points / 500) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-6 pt-4 border-t border-white/10">
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-widest">Conciertos</p>
            <p className="text-white font-bold text-lg">{concerts}</p>
          </div>
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-widest">Badges</p>
            <p className="text-white font-bold text-lg">3</p>
          </div>
          <div className="ml-auto flex items-end">
            <p className="text-white/30 text-[10px] font-mono">CL·2025</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Data ────────────────────────────────────────────────────────────────────

const LEVELS = [
  {
    name: 'Rookie',
    range: '0 – 99 pts',
    icon: Music,
    color: 'from-slate-700 to-slate-600',
    glow: 'shadow-slate-500/20',
    benefits: ['Perfil personalizado', 'Historial de conciertos', 'Acceso a setlists', 'Badges básicos'],
    active: false,
  },
  {
    name: 'Fan',
    range: '100 – 499 pts',
    icon: Star,
    color: 'from-blue-700 to-blue-500',
    glow: 'shadow-blue-500/30',
    benefits: ['Todo lo de Rookie', 'Fan Projects (colaborar)', 'Notificaciones prioritarias', 'Badge Fan Dedicado'],
    active: true,
  },
  {
    name: 'Súper Fan',
    range: '500 – 1,499 pts',
    icon: Zap,
    color: 'from-indigo-700 to-violet-600',
    glow: 'shadow-indigo-500/30',
    benefits: ['Todo lo de Fan', 'Acceso anticipado a preventas', 'Descuentos exclusivos', 'Badge Súper Fan'],
    active: false,
  },
  {
    name: 'Leyenda',
    range: '1,500+ pts',
    icon: Crown,
    color: 'from-yellow-600 to-amber-500',
    glow: 'shadow-yellow-500/30',
    benefits: ['Todo lo de Súper Fan', 'Beneficios VIP en eventos', 'Invitaciones exclusivas', 'Badge Leyenda'],
    active: false,
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: CalendarDays,
    title: 'Asiste a conciertos',
    desc: 'Confirma tu asistencia a cualquier concierto de la plataforma y gana puntos automáticamente.',
    points: '+10 pts por concierto',
  },
  {
    step: '02',
    icon: Music,
    title: 'Participa activamente',
    desc: 'Sube setlists, crea Fan Projects, invita amigos y contribuye a la comunidad.',
    points: 'Hasta +50 pts por acción',
  },
  {
    step: '03',
    icon: Gift,
    title: 'Desbloquea beneficios',
    desc: 'A medida que subes de nivel, accedes a preventas, descuentos y experiencias exclusivas.',
    points: '4 niveles disponibles',
  },
];

const EARN_POINTS = [
  { action: 'Asistir a un concierto', points: 10, icon: MapPin },
  { action: 'Subir un setlist verificado', points: 25, icon: Music },
  { action: 'Crear un Fan Project', points: 30, icon: Star },
  { action: 'Invitar un amigo', points: 50, icon: Users },
  { action: 'Primer concierto del mes', points: 20, icon: CalendarDays },
  { action: 'Completar tu perfil', points: 15, icon: Award },
];

const BADGES = [
  { name: 'Primer Concierto', icon: '🎵', desc: '1 concierto' },
  { name: 'Fan Dedicado', icon: '⭐', desc: '5 conciertos' },
  { name: 'Súper Fan', icon: '🌟', desc: '10 conciertos' },
  { name: 'Leyenda', icon: '👑', desc: '25 conciertos' },
  { name: 'Maratonista', icon: '🏆', desc: '50 conciertos' },
];

// ─── Animations ──────────────────────────────────────────────────────────────

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

// ─── Page ─────────────────────────────────────────────────────────────────────

const Benefits = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} className="text-blue-500 dark:text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">
              Cómo funciona
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-foreground">
              Simple. Automático. Tuyo.
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {HOW_IT_WORKS.map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="relative bg-muted/40 border border-border rounded-2xl p-7 hover:bg-muted/60 transition-colors"
              >
                <span className="absolute top-5 right-6 text-5xl font-black text-foreground/5">{item.step}</span>
                <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-5">
                  <item.icon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-foreground font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{item.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-300 bg-blue-600/10 px-3 py-1 rounded-full border border-blue-500/20">
                  <Zap className="w-3 h-3" />
                  {item.points}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Earn points table ────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="flex flex-col lg:flex-row gap-14 items-center"
          >
            <motion.div variants={fadeUp} className="flex-1">
              <p className="text-blue-500 dark:text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">Puntos</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Gana puntos<br />en cada acción
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                Cada cosa que haces en la plataforma tiene valor. Desde confirmar que vas a un concierto hasta ayudar a la comunidad.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex-1 w-full">
              <div className="bg-muted/30 border border-border rounded-2xl overflow-hidden divide-y divide-border">
                {EARN_POINTS.map((item) => (
                  <div key={item.action} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/15 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    </div>
                    <span className="text-muted-foreground text-sm flex-1">{item.action}</span>
                    <span className="text-blue-600 dark:text-blue-300 font-bold text-sm tabular-nums">+{item.points} pts</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Levels ───────────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} className="text-blue-500 dark:text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">
              Niveles
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-foreground">
              ¿Dónde estás en tu camino?
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {LEVELS.map((level) => (
              <motion.div
                key={level.name}
                variants={fadeUp}
                className={`relative rounded-2xl overflow-hidden border ${level.active ? 'border-blue-500/50 ring-1 ring-blue-500/30' : 'border-border'}`}
              >
                {level.active && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/40 text-[10px] px-2 py-0.5">Ejemplo</Badge>
                  </div>
                )}
                {/* Gradient header */}
                <div className={`bg-gradient-to-br ${level.color} p-6 ${level.active ? `shadow-lg ${level.glow}` : ''}`}>
                  <level.icon className="w-8 h-8 text-white mb-3" />
                  <h3 className="text-white font-bold text-xl">{level.name}</h3>
                  <p className="text-white/70 text-xs mt-0.5">{level.range}</p>
                </div>
                {/* Benefits */}
                <div className="bg-card p-5 space-y-2.5">
                  {level.benefits.map((b) => (
                    <div key={b} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-xs leading-relaxed">{b}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Badges ───────────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={fadeUp} className="text-blue-500 dark:text-blue-400 text-sm font-semibold tracking-widest uppercase mb-3">
              Badges
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Colecciona tus logros
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-base mb-10">
              Cada badge representa un hito en tu historia como fanático de la música en vivo.
            </motion.p>

            <motion.div
              variants={stagger}
              className="flex flex-wrap justify-center gap-4 md:gap-6"
            >
              {BADGES.map((badge) => (
                <motion.div
                  key={badge.name}
                  variants={fadeUp}
                  className="flex flex-col items-center gap-2 bg-muted/40 border border-border rounded-2xl px-6 py-5 hover:bg-muted/60 transition-colors w-32"
                >
                  <span className="text-3xl">{badge.icon}</span>
                  <span className="text-foreground text-xs font-semibold text-center leading-tight">{badge.name}</span>
                  <span className="text-muted-foreground text-[10px]">{badge.desc}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {/* Card visual small */}
            <motion.div variants={fadeUp} className="flex justify-center mb-10">
              <PassCard level="Leyenda" points={1850} concerts={42} />
            </motion.div>

            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tu próximo concierto vale más de lo que crees
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground text-lg mb-8">
              Únete gratis y empieza a acumular puntos desde el primer concierto que registres.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-[#004aad] hover:bg-[#0055cc] text-white font-semibold px-10 h-12"
              >
                <Link to="/auth">
                  Crear cuenta gratis
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12"
              >
                <Link to="/concerts">Explorar conciertos</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Benefits;
