insert into users (name, email)
values ('Shuaib', 'alkhudairi.sa@gmail.com'),
('test', 'salk147@aucklanduni.ac.nz')
on conflict (email) do update
set name = excluded.name;

insert into clubs (name, abbreviation, signup_url, spreadsheet_url)
values (
  'Test Club',
  'TEST',
  'https://example.com/signup',
  'https://docs.google.com/spreadsheets/d/example'
)
on conflict (abbreviation) do nothing;

insert into admin_of (user_id, club_id)
select users.id, clubs.id
from users
join clubs on clubs.abbreviation = 'TEST'
where users.email = 'alkhudairi.sa@gmail.com'
on conflict do nothing;
