alter table users add column if not exists username text;

create unique index if not exists idx_users_username_unique
on users(username)
where username is not null;

update users
set
  username = 'runner123',
  updated_at = now()
where participant_code = 'ARC-123456'
  and (username is null or username = '');
