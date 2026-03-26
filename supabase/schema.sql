create extension if not exists "pgcrypto";

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text unique not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists challenge_types (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  target_distance_m int not null,
  start_date date not null,
  end_date date not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  participant_code text unique,
  username text unique,
  name text not null,
  phone_last4 text,
  password_hash text not null,
  branch_id uuid references branches(id),
  challenge_type_id uuid references challenge_types(id),
  role text not null check (role in ('participant', 'admin')),
  is_active boolean not null default true,
  session_version int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table users add column if not exists username text;
alter table users add column if not exists session_version int not null default 0;
create unique index if not exists idx_users_username_unique on users(username) where username is not null;

create table if not exists records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  run_date date not null,
  distance_m int not null,
  pace_sec_per_km int not null,
  note text,
  status text not null default 'approved' check (status in ('approved', 'warning', 'rejected')),
  warning_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references users(id),
  record_id uuid references records(id) on delete set null,
  participant_user_id uuid references users(id) on delete set null,
  participant_name text,
  participant_username text,
  participant_code text,
  run_date date,
  action_type text not null check (
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
  ),
  previous_status text,
  new_status text,
  memo text,
  created_at timestamptz not null default now()
);

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

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on users;
create trigger users_set_updated_at
before update on users
for each row
execute function set_updated_at();

drop trigger if exists records_set_updated_at on records;
create trigger records_set_updated_at
before update on records
for each row
execute function set_updated_at();

create index if not exists idx_users_role on users(role);
create index if not exists idx_users_branch on users(branch_id);
create index if not exists idx_users_challenge on users(challenge_type_id);
create index if not exists idx_records_user_run_date on records(user_id, run_date);
create index if not exists idx_records_status on records(status);
create index if not exists idx_admin_actions_record on admin_actions(record_id);
create index if not exists idx_admin_actions_participant_user on admin_actions(participant_user_id);
create index if not exists idx_login_attempts_scope on login_attempts(scope);
create index if not exists idx_login_attempts_blocked_until on login_attempts(blocked_until);

alter table branches enable row level security;
alter table challenge_types enable row level security;
alter table users enable row level security;
alter table records enable row level security;
alter table admin_actions enable row level security;
alter table login_attempts enable row level security;
