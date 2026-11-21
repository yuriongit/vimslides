ALTER TABLE public.presentations -- If users occur, in future create a table to drop NULLs
  ALTER COLUMN file_url DROP NOT NULL,
  ALTER COLUMN slide_count SET NOT NULL,
  ALTER COLUMN slide_count SET DEFAULT 0,
  ADD CONSTRAINT presentations_slide_count_non_negative CHECK (slide_count >= 0);
