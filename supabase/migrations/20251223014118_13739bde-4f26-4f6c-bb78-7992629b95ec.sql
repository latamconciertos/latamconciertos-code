-- ============================================================================
-- FRIENDSHIPS TABLE - Para manejar relaciones de amistad
-- ============================================================================

CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  addressee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_requester FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_addressee FOREIGN KEY (addressee_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT unique_friendship UNIQUE(requester_id, addressee_id),
  CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id)
);

-- Índices para mejorar performance
CREATE INDEX idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);

-- Trigger para updated_at
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies para friendships
-- Users can view friendships where they are involved
CREATE POLICY "Users can view their own friendships"
  ON public.friendships
  FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can send friend requests (as requester)
CREATE POLICY "Users can send friend requests"
  ON public.friendships
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

-- Users can update friendships they are involved in (accept/reject/block)
CREATE POLICY "Users can update their friendships"
  ON public.friendships
  FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can delete friendships they are involved in
CREATE POLICY "Users can delete their friendships"
  ON public.friendships
  FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Admins can manage all friendships
CREATE POLICY "Admins can manage all friendships"
  ON public.friendships
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));

-- ============================================================================
-- CONCERT INVITATIONS TABLE - Para invitar amigos a conciertos
-- ============================================================================

CREATE TABLE public.concert_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  concert_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_sender FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_receiver FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_concert FOREIGN KEY (concert_id) REFERENCES public.concerts(id) ON DELETE CASCADE,
  CONSTRAINT unique_invitation UNIQUE(sender_id, receiver_id, concert_id),
  CONSTRAINT no_self_invitation CHECK (sender_id != receiver_id)
);

-- Índices
CREATE INDEX idx_concert_invitations_sender ON public.concert_invitations(sender_id);
CREATE INDEX idx_concert_invitations_receiver ON public.concert_invitations(receiver_id);
CREATE INDEX idx_concert_invitations_concert ON public.concert_invitations(concert_id);
CREATE INDEX idx_concert_invitations_status ON public.concert_invitations(status);

-- Trigger para updated_at
CREATE TRIGGER update_concert_invitations_updated_at
  BEFORE UPDATE ON public.concert_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

-- Enable RLS
ALTER TABLE public.concert_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies para concert_invitations
-- Users can view invitations they sent or received
CREATE POLICY "Users can view their invitations"
  ON public.concert_invitations
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send invitations (must be friends - we'll check in app logic)
CREATE POLICY "Users can send invitations"
  ON public.concert_invitations
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Receivers can update invitation status
CREATE POLICY "Receivers can update invitation status"
  ON public.concert_invitations
  FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Senders can delete their invitations
CREATE POLICY "Senders can delete invitations"
  ON public.concert_invitations
  FOR DELETE
  USING (auth.uid() = sender_id);

-- Admins can manage all invitations
CREATE POLICY "Admins can manage all invitations"
  ON public.concert_invitations
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));

-- ============================================================================
-- HELPER FUNCTION - Check if two users are friends
-- ============================================================================

CREATE OR REPLACE FUNCTION public.are_friends(user_a UUID, user_b UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
    AND (
      (requester_id = user_a AND addressee_id = user_b)
      OR (requester_id = user_b AND addressee_id = user_a)
    )
  );
$$;