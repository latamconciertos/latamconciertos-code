export type AccreditationStatus =
  | 'draft'
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'expired';

export type TeamRole =
  | 'periodista'
  | 'fotografo'
  | 'camarografo'
  | 'social_media'
  | 'coordinador'
  | 'otro';

export interface Accreditation {
  id: string;
  concert_id: string | null;
  festival_id: string | null;
  event_name: string;
  venue_name: string | null;
  event_date: string | null;
  deadline: string;
  status: AccreditationStatus;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  submitted_at: string | null;
  response_at: string | null;
  response_notes: string | null;
  proposal_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccreditationWithTeam extends Accreditation {
  event_team_assignments?: TeamAssignment[];
  concerts?: {
    title: string;
    date: string | null;
    promoter_id: string | null;
    promoter_name: string | null;
  } | null;
}

export interface AccreditationInsert {
  concert_id?: string | null;
  festival_id?: string | null;
  event_name: string;
  venue_name?: string | null;
  event_date?: string | null;
  deadline: string;
  status?: AccreditationStatus;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  notes?: string | null;
  proposal_url?: string | null;
  submitted_at?: string | null;
  created_by?: string | null;
}

export interface AccreditationUpdate extends Partial<AccreditationInsert> {
  response_at?: string | null;
  response_notes?: string | null;
}

export interface TeamAssignment {
  id: string;
  accreditation_id: string;
  user_id: string;
  role: TeamRole;
  confirmed: boolean;
  notes: string | null;
  created_at: string;
  profiles?: {
    username: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export interface TeamAssignmentInsert {
  accreditation_id: string;
  user_id: string;
  role: TeamRole;
  confirmed?: boolean;
  notes?: string | null;
}

export const ACCREDITATION_STATUS_LABELS: Record<AccreditationStatus, string> = {
  draft: 'Borrador',
  pending: 'Pendiente',
  submitted: 'Enviada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  expired: 'Vencida',
};

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  periodista: 'Periodista',
  fotografo: 'Fotógrafo',
  camarografo: 'Camarógrafo',
  social_media: 'Social Media',
  coordinador: 'Coordinador',
  otro: 'Otro',
};
