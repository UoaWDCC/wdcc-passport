-- Insert users
insert into users (name, email)
values ('Shuaib', 'alkhudairi.sa@gmail.com'),
('test', 'salk147@aucklanduni.ac.nz')
on conflict (email) do update
set name = excluded.name;

-- Insert clubs
insert into clubs (name, abbreviation, signup_url, spreadsheet_url)
values (
  'Test Club',
  'TEST',
  'https://example.com/signup',
  'https://docs.google.com/spreadsheets/d/example'
)
on conflict (abbreviation) do nothing;

-- Insert admin_of relationship
insert into admin_of (user_id, club_id)
select users.id, clubs.id
from users
join clubs on clubs.abbreviation = 'TEST'
where users.email = 'alkhudairi.sa@gmail.com'
on conflict do nothing;

-- Insert cards
insert into cards (name, slug, image_url, rarity)
values
('Snorelax', 'snorelax', '/cards/snorelax.webp', 'common'),
('Bulbasour', 'bulbasour', '/cards/bulbasour.webp', 'common'),
('Jigglybuff', 'jigglybuff', '/cards/jigglybuff.webp', 'common'),
('Pikachoo', 'pikachoo', '/cards/pikachoo.webp', 'common'),
('Pokewebster', 'pokewebster', '/cards/pokewebster.webp', 'uncommon'),
('Psyweb', 'psyweb', '/cards/psyweb.webp', 'uncommon'),
('Warill', 'warill', '/cards/warill.webp', 'uncommon'),
('Warizard', 'warizard', '/cards/warizard.webp', 'rare'),
('Webbykarp', 'webbykarp', '/cards/webbykarp.webp', 'common'),
('Wengar', 'wengar', '/cards/wengar.webp', 'rare'),
('Wewtwo', 'wewtwo', '/cards/wewtwo.webp', 'event_rare'),
('Witto', 'witto', '/cards/witto.webp', 'uncommon'),
('Worterra', 'worterra', '/cards/worterra.webp', 'rare'),
('Weowth', 'weowth', '/cards/weowth.webp', 'common'),
('Wiglet', 'wiglet', '/cards/wiglet.webp', 'common'),
('Wogepi', 'wogepi', '/cards/wogepi.webp', 'event_rare')
on conflict (slug) do update
set name = excluded.name,
  image_url = excluded.image_url,
  rarity = excluded.rarity;