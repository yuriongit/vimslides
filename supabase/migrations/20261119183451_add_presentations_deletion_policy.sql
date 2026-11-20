create policy "Enable delete for users based on user_id"
on "public"."presentations"
as PERMISSIVE
for DELETE
to authenticated
using (
  (select auth.uid()) = user_id
);
