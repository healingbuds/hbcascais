-- Delete test auth users that are no longer needed
-- scott.k1@outlook.com and admin-test@healingbuds.dev
DELETE FROM auth.users WHERE id IN (
  '2fffcb4c-7db7-45e3-9698-975941c6b7ab',
  '28ef562b-3a30-4344-a6b7-a4192af57ef1'
);