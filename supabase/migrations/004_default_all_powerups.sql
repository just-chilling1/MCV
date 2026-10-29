-- Every user gets all premium power-ups by default (no access-token flow required).

insert into public.user_powerup_grants (user_id, powerup)
select u.id, p.powerup
from auth.users u
cross join (
  values ('10x'::text), ('infinite'), ('automation'), ('dfy')
) as p(powerup)
on conflict (user_id, powerup) do nothing;

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
    (new.id, 'dfy')
  on conflict (user_id, powerup) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_grant_all_powerups on auth.users;

create trigger on_auth_user_created_grant_all_powerups
  after insert on auth.users
  for each row
  execute procedure public.grant_default_powerups_to_new_user();

comment on function public.grant_default_powerups_to_new_user() is 'Grants all premium power-ups on signup; keeps user_powerup_grants in sync with app defaults.';
