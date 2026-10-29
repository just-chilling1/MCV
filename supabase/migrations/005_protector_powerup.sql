-- Replace Done-For-You (dfy) with Wealth Protector (protector)

alter table public.powerup_access_tokens
  drop constraint if exists powerup_access_tokens_powerup_check;

alter table public.user_powerup_grants
  drop constraint if exists user_powerup_grants_powerup_check;

update public.user_powerup_grants
set powerup = 'protector'
where powerup = 'dfy';

update public.powerup_access_tokens
set powerup = 'protector'
where powerup = 'dfy';

alter table public.powerup_access_tokens
  add constraint powerup_access_tokens_powerup_check
  check (powerup in ('10x', 'infinite', 'automation', 'protector'));

alter table public.user_powerup_grants
  add constraint user_powerup_grants_powerup_check
  check (powerup in ('10x', 'infinite', 'automation', 'protector'));

create or replace function public.grant_default_powerups_to_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_powerup_grants (user_id, powerup) values
    (new.id, '10x'),
    (new.id, 'infinite'),
    (new.id, 'automation'),
    (new.id, 'protector')
  on conflict (user_id, powerup) do nothing;
  return new;
end;
$$;

insert into public.user_powerup_grants (user_id, powerup)
select u.id, p.powerup
from auth.users u
cross join (
  values ('10x'::text), ('infinite'), ('automation'), ('protector')
) as p(powerup)
on conflict (user_id, powerup) do nothing;

comment on function public.grant_default_powerups_to_new_user() is 'Grants all premium power-ups on signup; Wealth Protector replaces legacy Done-For-You.';
