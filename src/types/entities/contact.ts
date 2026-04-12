export interface Contact {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  promoter_id: string | null;
  company: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactWithPromoter extends Contact {
  promoters?: { name: string } | null;
}

export interface ContactInsert {
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  promoter_id?: string | null;
  company?: string | null;
  notes?: string | null;
  created_by?: string | null;
}

export type ContactUpdate = Partial<ContactInsert>;
