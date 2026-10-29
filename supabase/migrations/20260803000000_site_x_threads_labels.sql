-- Thread versions: custom names + pinning, and allow owners to update their rows.
alter table public.site_x_threads
  add column if not exists batch_label text,
  add column if not exists is_pinned boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'site_x_threads'
      and policyname = 'Users update own site x threads'
  ) then
    create policy "Users update own site x threads"
      on public.site_x_threads for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
