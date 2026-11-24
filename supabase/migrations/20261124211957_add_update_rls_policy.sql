create policy "Enable update for users based on user_id"
on "public"."presentations"
to authenticated
using (
  ((select auth.uid() as uid) = user_id)
);
