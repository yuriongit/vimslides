alter table public.presentations
  add column slides jsonb not null default '[]'::jsonb,
  add column schema_version integer not null default 1,
  add column last_modified timestamp with time zone not null default now();

-- Optional: automatically keep slide_count and last_modified accurate on every write
create or replace function public.sync_presentation_metadata()
returns trigger as $$
begin
  new.slide_count := jsonb_array_length(new.slides);
  new.last_modified := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_sync_presentation_metadata
before insert or update of slides on public.presentations
for each row execute function public.sync_presentation_metadata();
