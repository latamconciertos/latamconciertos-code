-- Accreditation tracking for events
CREATE TYPE accreditation_status AS ENUM (
  'draft',
  'pending',
  'submitted',
  'approved',
  'rejected',
  'expired'
);

CREATE TYPE team_role AS ENUM (
  'periodista',
  'fotografo',
  'camarografo',
  'social_media',
  'coordinador',
  'otro'
);

CREATE TABLE IF NOT EXISTS accreditations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Link to existing concert (optional) or free-text event
  concert_id UUID REFERENCES concerts(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  venue_name TEXT,
  event_date DATE,
  -- Deadline tracking
  deadline DATE NOT NULL,
  status accreditation_status DEFAULT 'draft',
  -- Details
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  -- Proposal/response tracking
  submitted_at TIMESTAMPTZ,
  response_at TIMESTAMPTZ,
  response_notes TEXT,
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accreditation_id UUID NOT NULL REFERENCES accreditations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role team_role NOT NULL DEFAULT 'periodista',
  confirmed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_accreditations_deadline ON accreditations(deadline);
CREATE INDEX idx_accreditations_status ON accreditations(status);
CREATE INDEX idx_accreditations_event_date ON accreditations(event_date);
CREATE INDEX idx_accreditations_concert ON accreditations(concert_id);
CREATE INDEX idx_team_assignments_accreditation ON event_team_assignments(accreditation_id);
CREATE INDEX idx_team_assignments_user ON event_team_assignments(user_id);

-- RLS
ALTER TABLE accreditations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_team_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage accreditations" ON accreditations FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage team assignments" ON event_team_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_accreditation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_accreditations_updated_at
  BEFORE UPDATE ON accreditations
  FOR EACH ROW EXECUTE FUNCTION update_accreditation_timestamp();
