import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useTrafficTracking } from "@/hooks/useTrafficTracking";
import { FloatingAIChat } from "@/components/FloatingAIChat";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

// Critical route - load immediately
import Index from "./pages/Index";

// Lazy loaded routes
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const Artists = lazy(() => import("./pages/Artists"));
const ArtistDetail = lazy(() => import("./pages/ArtistDetail"));
const Concerts = lazy(() => import("./pages/Concerts"));
const ConcertDetail = lazy(() => import("./pages/ConcertDetail"));
const Promoters = lazy(() => import("./pages/Promoters"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const Profile = lazy(() => import("./pages/Profile"));
const MyCalendar = lazy(() => import("./pages/MyCalendar"));
const Advertising = lazy(() => import("./pages/Advertising"));
const ConcertCommunityChat = lazy(() => import("./pages/ConcertCommunityChat"));
const About = lazy(() => import("./pages/About"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const EditorialGuidelines = lazy(() => import("./pages/EditorialGuidelines"));
const GoogleSearchConsoleSetup = lazy(() => import("./pages/GoogleSearchConsoleSetup"));
const SEOGuide = lazy(() => import("./pages/admin/SEOGuide"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Setlists = lazy(() => import("./pages/Setlists"));
const SetlistDetail = lazy(() => import("./pages/SetlistDetail"));
const FanProjects = lazy(() => import("./pages/FanProjects"));
const FanProjectDetail = lazy(() => import("./pages/FanProjectDetail"));
const FanProjectLightMode = lazy(() => import("./pages/FanProjectLightMode"));
const Friends = lazy(() => import("./pages/Friends"));
const FriendProfile = lazy(() => import("./pages/FriendProfile"));
const ConcertsByCountry = lazy(() => import("./pages/ConcertsByCountry"));
const Festivals = lazy(() => import("./pages/Festivals"));
const FestivalDetail = lazy(() => import("./pages/FestivalDetail"));
const NewHome = lazy(() => import("./pages/NewHome"));

const AppContent = () => {
  useTrafficTracking();
  const location = useLocation();

  // Hide floating AI chat when already on AI assistant page or community chat
  const showFloatingChat = location.pathname !== '/ai-assistant' && !location.pathname.includes('/chat');

  return (
    <>
      <Toaster />
      <Sonner />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/seo-guide" element={<SEOGuide />} />
          <Route path="/admin/google-search-console-setup" element={<GoogleSearchConsoleSetup />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/artists/:slug" element={<ArtistDetail />} />
          <Route path="/festivals" element={<Festivals />} />
          <Route path="/festivals/:slug" element={<FestivalDetail />} />
          <Route path="/concerts" element={<Concerts />} />
          <Route path="/concerts/:slug" element={<ConcertDetail />} />
          <Route path="/promoters" element={<Promoters />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-calendar" element={<MyCalendar />} />
          <Route path="/publicidad" element={<Advertising />} />
          <Route path="/concerts/:concertId/chat" element={<ConcertCommunityChat />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/editorial-guidelines" element={<EditorialGuidelines />} />
          <Route path="/setlists" element={<Setlists />} />
          <Route path="/setlist/:artistSlug/:concertSlug/:city/:date" element={<SetlistDetail />} />
          <Route path="/fan-projects" element={<FanProjects />} />
          <Route path="/fan-projects/:projectId" element={<FanProjectDetail />} />
          <Route path="/fan-projects/:projectId/song/:songId/light" element={<FanProjectLightMode />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/friends/:friendId" element={<FriendProfile />} />
          <Route path="/conciertos/:countrySlug" element={<ConcertsByCountry />} />
          <Route path="/nuevo-home" element={<NewHome />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {showFloatingChat && <FloatingAIChat />}
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
