alter table public.presentations
  add column if not exists slides jsonb not null default '[]'::jsonb,
  add column if not exists schema_version integer not null default 1,
  add column if not exists last_modified timestamp with time zone not null default now();

create or replace function public.sync_presentation_metadata()
returns trigger as $$
begin
  new.slide_count := jsonb_array_length(new.slides);
  new.last_modified := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_sync_presentation_metadata on public.presentations;
create trigger trg_sync_presentation_metadata
before insert or update on public.presentations
for each row execute function public.sync_presentation_metadata();
