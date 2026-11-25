alter table public.presentations
  add column if not exists public_id uuid not null default gen_random_uuid();

create unique index if not exists presentations_public_id_key
  on public.presentations (public_id);
