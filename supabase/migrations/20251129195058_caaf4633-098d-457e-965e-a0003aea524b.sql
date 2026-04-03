-- Create venue_sections table
CREATE TABLE public.venue_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fan_projects table
CREATE TABLE public.fan_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  concert_id UUID NOT NULL REFERENCES public.concerts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fan_project_songs table
CREATE TABLE public.fan_project_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_project_id UUID NOT NULL REFERENCES public.fan_projects(id) ON DELETE CASCADE,
  song_name TEXT NOT NULL,
  artist_name TEXT,
  duration_seconds INTEGER NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fan_project_color_sequences table
CREATE TABLE public.fan_project_color_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_project_song_id UUID NOT NULL REFERENCES public.fan_project_songs(id) ON DELETE CASCADE,
  venue_section_id UUID NOT NULL REFERENCES public.venue_sections(id) ON DELETE CASCADE,
  sequence JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(fan_project_song_id, venue_section_id)
);

-- Create fan_project_participants table
CREATE TABLE public.fan_project_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_project_id UUID NOT NULL REFERENCES public.fan_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_section_id UUID NOT NULL REFERENCES public.venue_sections(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(fan_project_id, user_id)
);

-- Enable RLS
ALTER TABLE public.venue_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_project_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_project_color_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_project_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for venue_sections
CREATE POLICY "Admins can manage venue sections" ON public.venue_sections
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Authenticated users can view venue sections" ON public.venue_sections
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for fan_projects
CREATE POLICY "Admins can manage fan projects" ON public.fan_projects
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Authenticated users can view active fan projects" ON public.fan_projects
  FOR SELECT USING (auth.uid() IS NOT NULL AND status = 'active');

-- RLS Policies for fan_project_songs
CREATE POLICY "Admins can manage fan project songs" ON public.fan_project_songs
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Authenticated users can view fan project songs" ON public.fan_project_songs
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.fan_projects 
      WHERE id = fan_project_songs.fan_project_id AND status = 'active'
    )
  );

-- RLS Policies for fan_project_color_sequences
CREATE POLICY "Admins can manage color sequences" ON public.fan_project_color_sequences
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Authenticated users can view color sequences" ON public.fan_project_color_sequences
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.fan_project_songs fps
      JOIN public.fan_projects fp ON fps.fan_project_id = fp.id
      WHERE fps.id = fan_project_color_sequences.fan_project_song_id AND fp.status = 'active'
    )
  );

-- RLS Policies for fan_project_participants
CREATE POLICY "Users can manage their own participation" ON public.fan_project_participants
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all participants" ON public.fan_project_participants
  FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));

-- Create indexes for performance
CREATE INDEX idx_venue_sections_venue_id ON public.venue_sections(venue_id);
CREATE INDEX idx_fan_projects_concert_id ON public.fan_projects(concert_id);
CREATE INDEX idx_fan_projects_status ON public.fan_projects(status);
CREATE INDEX idx_fan_project_songs_project_id ON public.fan_project_songs(fan_project_id);
CREATE INDEX idx_fan_project_color_sequences_song_id ON public.fan_project_color_sequences(fan_project_song_id);
CREATE INDEX idx_fan_project_participants_project_id ON public.fan_project_participants(fan_project_id);
CREATE INDEX idx_fan_project_participants_user_id ON public.fan_project_participants(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_venue_sections_updated_at
  BEFORE UPDATE ON public.venue_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_fan_projects_updated_at
  BEFORE UPDATE ON public.fan_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_fan_project_participants_updated_at
  BEFORE UPDATE ON public.fan_project_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();