set lock_timeout = '5s';

ALTER TABLE public.presentations
  DROP CONSTRAINT IF EXISTS posts_description_check,
  ADD CONSTRAINT posts_description_check
    CHECK (char_length(description) <= 250),
  ADD CONSTRAINT posts_title_check
    CHECK (char_length(title) <= 100);
