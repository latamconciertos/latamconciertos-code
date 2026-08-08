import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';
import { authSchema } from '@/lib/validation';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { StadiumArcs } from '@/components/newhome/StadiumArcs';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkRoleAndRedirect = useCallback(async (userId: string) => {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleData) {
      navigate('/admin');
    } else {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    // Check if user is already logged in
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          checkRoleAndRedirect(session.user.id);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkRoleAndRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkRoleAndRedirect]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input with Zod
      const validatedData = authSchema.parse({
        email: email.trim(),
        password,
      });

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });
        if (error) throw error;
        toast({
          title: "Inicio de sesión exitoso",
          description: "Bienvenido a Conciertos LATAM",
        });
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email: validatedData.email,
          password: validatedData.password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        if (error) throw error;
        toast({
          title: "Registro exitoso",
          description: "Revisa tu email para confirmar tu cuenta",
        });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: "Error de validación",
          description: firstError.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo iniciar sesión con Google',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    // "Evolución Nocturna": el login vive dentro del venue de noche
    <div className="dark font-fira relative min-h-screen overflow-hidden bg-noche text-texto">
      {/* Glow de escenario: cobalto en radial, nunca plano */}
      <div
        className="absolute left-1/2 top-[30%] h-[420px] w-[min(760px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(closest-side, rgba(0,74,173,.45), transparent 70%)',
          filter: 'blur(110px)'
        }}
      />
      {/* Elemento firma: arcos del isotipo en el horizonte */}
      <StadiumArcs className="absolute inset-x-0 bottom-0 h-[50vh] w-full pointer-events-none" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md rounded-[20px] border-linea bg-superficie">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <img src={logo} alt="Conciertos LATAM" className="h-40 w-auto" decoding="async" width={160} height={160} />
            </div>
            <CardTitle className="font-display text-3xl font-extrabold uppercase tracking-[0.01em] text-center text-texto">
              {isLogin ? 'Iniciar sesión' : 'Unirme gratis'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Google Sign-In Button — variante oscura oficial, el logo multicolor es identidad de Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-full bg-superficie-2 hover:bg-superficie-2/70 text-texto border-linea font-medium mb-4"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'Cargando...' : 'Continuar con Google'}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-linea" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-superficie px-2 text-texto-2">
                  o continúa con email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-full bg-superficie-2 border-linea focus-visible:ring-periwinkle px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 rounded-full bg-superficie-2 border-linea focus-visible:ring-periwinkle px-4 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-texto-2 hover:text-texto transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-full border-0 bg-[linear-gradient(95deg,#004AAD,#597CFF)] text-white font-semibold shadow-[0_8px_32px_rgba(0,74,173,.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,74,173,.55)]"
                disabled={loading}
              >
                {loading ? 'Cargando...' : (isLogin ? 'Iniciar sesión' : 'Unirme gratis')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                className="text-periwinkle hover:text-azul-claro"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;