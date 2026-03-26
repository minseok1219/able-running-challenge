alter table users
  add column if not exists session_version int not null default 0;
