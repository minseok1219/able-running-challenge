create table if not exists login_attempts (
  key text primary key,
  scope text not null check (scope in ('participant', 'admin')),
  dimension text not null check (dimension in ('account', 'ip')),
  subject text not null,
  attempt_count int not null default 0,
  first_attempt_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table admin_actions alter column record_id drop not null;

alter table admin_actions
  add column if not exists participant_user_id uuid references users(id) on delete set null;

alter table admin_actions
  add column if not exists participant_name text;

alter table admin_actions
  add column if not exists participant_username text;

alter table admin_actions
  add column if not exists participant_code text;

alter table admin_actions
  add column if not exists run_date date;

alter table admin_actions
  drop constraint if exists admin_actions_record_id_fkey;

alter table admin_actions
  add constraint admin_actions_record_id_fkey
  foreign key (record_id) references records(id) on delete set null;

alter table admin_actions
  drop constraint if exists admin_actions_action_type_check;

alter table admin_actions
  add constraint admin_actions_action_type_check
  check (
    action_type in (
      'approve',
      'warn',
      'reject',
      'edit',
      'participant_activate',
      'participant_deactivate',
      'participant_delete',
      'participant_branch_update'
    )
  );

update admin_actions
set
  participant_user_id = records.user_id,
  participant_name = users.name,
  participant_username = users.username,
  participant_code = users.participant_code,
  run_date = records.run_date
from records
join users on users.id = records.user_id
where admin_actions.record_id = records.id
  and (
    admin_actions.participant_user_id is null
    or admin_actions.participant_name is null
    or admin_actions.run_date is null
  );

create index if not exists idx_admin_actions_participant_user
on admin_actions(participant_user_id);

create index if not exists idx_login_attempts_scope
on login_attempts(scope);

create index if not exists idx_login_attempts_blocked_until
on login_attempts(blocked_until);

alter table login_attempts enable row level security;
