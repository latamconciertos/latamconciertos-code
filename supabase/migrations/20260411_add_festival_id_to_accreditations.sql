-- Add festival_id to accreditations
ALTER TABLE accreditations
  ADD COLUMN festival_id UUID REFERENCES festivals(id) ON DELETE SET NULL;

CREATE INDEX idx_accreditations_festival ON accreditations(festival_id);
