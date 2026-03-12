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
  name text not null,
  phone_last4 text,
  password_hash text not null,
  branch_id uuid references branches(id),
  challenge_type_id uuid references challenge_types(id),
  role text not null check (role in ('participant', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  record_id uuid not null references records(id) on delete cascade,
  action_type text not null check (action_type in ('approve', 'warn', 'reject', 'edit')),
  previous_status text,
  new_status text,
  memo text,
  created_at timestamptz not null default now()
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

alter table branches enable row level security;
alter table challenge_types enable row level security;
alter table users enable row level security;
alter table records enable row level security;
alter table admin_actions enable row level security;
