insert into branches (code, name, sort_order)
values
  ('jamsil', '잠실', 1),
  ('munjeong', '문정', 2),
  ('hanam', '하남', 3),
  ('geoyeo', '거여', 4)
on conflict (code) do update
set name = excluded.name,
    sort_order = excluded.sort_order;

insert into challenge_types (code, name, target_distance_m, start_date, end_date, sort_order)
values
  ('100km', '100km', 100000, '2026-03-23', '2026-04-26', 1),
  ('160km', '100 miles (160km)', 160000, '2026-03-23', '2026-05-16', 2)
on conflict (code) do update
set name = excluded.name,
    target_distance_m = excluded.target_distance_m,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    sort_order = excluded.sort_order;

insert into users (participant_code, name, phone_last4, password_hash, branch_id, challenge_type_id, role)
select
  null,
  'admin',
  null,
  'scrypt:4d7188cbf8830338a38f9e545b00c6c8:388094f055e345d49df9fd775fdb22e2ab2cd49b861e6170015e5865f96b9111ad6db3c6102a6a75134c8e871fb0a0b697ea9fd27154209d2549dcbecff729d2',
  null,
  null,
  'admin'
where not exists (
  select 1 from users where role = 'admin' and name = 'admin'
);

insert into users (participant_code, name, phone_last4, password_hash, branch_id, challenge_type_id, role)
select
  'ARC-123456',
  '김러너',
  '1234',
  'scrypt:5b8c1844ca5e6f7a98fce894b5fc2844:ca635a637b6b85fcbd71f4b39664f4e3bfa47a164822453cf9195780a9a9f203305a5a24ba6b967fd82c045caf2aceaa06ff901f44c75d7e4c6e032e8ee0d26b',
  (select id from branches where code = 'jamsil'),
  (select id from challenge_types where code = '100km'),
  'participant'
where not exists (
  select 1 from users where participant_code = 'ARC-123456'
);

insert into records (user_id, run_date, distance_m, pace_sec_per_km, note, status, warning_reason)
select
  (select id from users where participant_code = 'ARC-123456'),
  '2026-03-24',
  5200,
  330,
  '잠실 석촌호수',
  'approved',
  null
where exists (select 1 from users where participant_code = 'ARC-123456')
  and not exists (
    select 1 from records
    where user_id = (select id from users where participant_code = 'ARC-123456')
      and run_date = '2026-03-24'
  );
