import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Users, Clock, Globe, Monitor, TrendingUp, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfDay, startOfWeek, startOfMonth, subDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PageView {
  page_path: string;
  page_title: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  referrer: string | null;
  created_at: string;
}

interface Session {
  duration_seconds: number | null;
  pages_visited: number;
  country: string | null;
  device_type: string | null;
  referrer: string | null;
  started_at: string;
}

interface Stats {
  totalVisits: number;
  uniqueVisitors: number;
  avgDuration: number;
  avgPagesPerSession: number;
  topPages: { name: string; value: number }[];
  topCountries: { name: string; value: number }[];
  deviceStats: { name: string; value: number }[];
  browserStats: { name: string; value: number }[];
  referrerStats: { name: string; value: number }[];
  dailyVisits: { date: string; visits: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function TrafficAdmin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '24hours':
        return subDays(now, 1);
      case '7days':
        return subDays(now, 7);
      case '30days':
        return subDays(now, 30);
      case '90days':
        return subDays(now, 90);
      default:
        return subDays(now, 7);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const dateFilter = getDateFilter();

      // Fetch page views
      const { data: pageViews, error: pageViewsError } = await supabase
        .from('page_views')
        .select('*')
        .gte('created_at', dateFilter.toISOString());

      if (pageViewsError) throw pageViewsError;

      // Fetch sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .gte('started_at', dateFilter.toISOString());

      if (sessionsError) throw sessionsError;

      // Process stats
      const totalVisits = pageViews?.length || 0;
      const uniqueVisitors = new Set(pageViews?.map(pv => pv.session_id)).size;
      const avgDuration = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / (sessions?.length || 1);
      const avgPagesPerSession = sessions?.reduce((sum, s) => sum + (s.pages_visited || 0), 0) / (sessions?.length || 1);

      // Top pages
      const pageCount: Record<string, number> = {};
      pageViews?.forEach(pv => {
        const page = pv.page_path || 'Unknown';
        pageCount[page] = (pageCount[page] || 0) + 1;
      });
      const topPages = Object.entries(pageCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

      // Top countries
      const countryCount: Record<string, number> = {};
      pageViews?.forEach(pv => {
        const country = pv.country || 'Unknown';
        countryCount[country] = (countryCount[country] || 0) + 1;
      });
      const topCountries = Object.entries(countryCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

      // Device stats
      const deviceCount: Record<string, number> = {};
      pageViews?.forEach(pv => {
        const device = pv.device_type || 'Unknown';
        deviceCount[device] = (deviceCount[device] || 0) + 1;
      });
      const deviceStats = Object.entries(deviceCount)
        .map(([name, value]) => ({ name, value }));

      // Browser stats
      const browserCount: Record<string, number> = {};
      pageViews?.forEach(pv => {
        const browser = pv.browser || 'Unknown';
        browserCount[browser] = (browserCount[browser] || 0) + 1;
      });
      const browserStats = Object.entries(browserCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      // Referrer stats
      const referrerCount: Record<string, number> = {};
      pageViews?.forEach(pv => {
        if (pv.referrer && pv.referrer !== '') {
          try {
            const url = new URL(pv.referrer);
            const domain = url.hostname;
            referrerCount[domain] = (referrerCount[domain] || 0) + 1;
          } catch (e) {
            referrerCount['Direct'] = (referrerCount['Direct'] || 0) + 1;
          }
        } else {
          referrerCount['Direct'] = (referrerCount['Direct'] || 0) + 1;
        }
      });
      const referrerStats = Object.entries(referrerCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

      // Daily visits
      const dailyCount: Record<string, number> = {};
      pageViews?.forEach(pv => {
        const date = format(new Date(pv.created_at), 'yyyy-MM-dd');
        dailyCount[date] = (dailyCount[date] || 0) + 1;
      });
      const dailyVisits = Object.entries(dailyCount)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, visits]) => ({ 
          date: format(new Date(date), 'dd MMM', { locale: es }), 
          visits 
        }));

      setStats({
        totalVisits,
        uniqueVisitors,
        avgDuration: Math.round(avgDuration),
        avgPagesPerSession: Math.round(avgPagesPerSession * 10) / 10,
        topPages,
        topCountries,
        deviceStats,
        browserStats,
        referrerStats,
        dailyVisits,
      });
    } catch (error) {
      console.error('Error fetching traffic stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Tráfico del Sitio</h2>
          <p className="text-muted-foreground">Análisis de visitantes y comportamiento</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24hours">Últimas 24 horas</SelectItem>
            <SelectItem value="7days">Últimos 7 días</SelectItem>
            <SelectItem value="30days">Últimos 30 días</SelectItem>
            <SelectItem value="90days">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Visitas</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Páginas vistas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Sesiones únicas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
            <p className="text-xs text-muted-foreground">Por sesión</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Páginas por Sesión</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPagesPerSession}</div>
            <p className="text-xs text-muted-foreground">Promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Visits Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Visitas Diarias</CardTitle>
          <CardDescription>Tendencia de visitas en el período seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.dailyVisits}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="visits" stroke="#8884d8" name="Visitas" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="pages" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pages">Páginas</TabsTrigger>
          <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
          <TabsTrigger value="browsers">Navegadores</TabsTrigger>
          <TabsTrigger value="referrers">Origen</TabsTrigger>
        </TabsList>

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>Páginas Más Visitadas</CardTitle>
              <CardDescription>Top 10 páginas por número de visitas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.topPages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" name="Visitas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>Países de Origen</CardTitle>
              <CardDescription>Distribución geográfica de visitantes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={stats.topCountries}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.topCountries.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Dispositivo</CardTitle>
              <CardDescription>Distribución por tipo de dispositivo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={stats.deviceStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.deviceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browsers">
          <Card>
            <CardHeader>
              <CardTitle>Navegadores</CardTitle>
              <CardDescription>Top 5 navegadores utilizados</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.browserStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" name="Visitas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrers">
          <Card>
            <CardHeader>
              <CardTitle>Fuentes de Tráfico</CardTitle>
              <CardDescription>De dónde vienen los visitantes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.referrerStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" name="Visitas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
