-- Add UPDATE policy for favorite_concerts
CREATE POLICY "Users can update their own favorites"
ON favorite_concerts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);