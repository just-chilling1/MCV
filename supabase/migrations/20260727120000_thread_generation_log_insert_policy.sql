do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'thread_generation_log'
      and policyname = 'Users insert own thread generation log'
  ) then
    create policy "Users insert own thread generation log"
      on public.thread_generation_log for insert
      with check (auth.uid() = user_id);
  end if;
end $$;
