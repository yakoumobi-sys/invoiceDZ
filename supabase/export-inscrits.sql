-- ═══ invoicedz · extraction des entreprises & des personnes ══════════════
-- À coller dans Supabase → SQL Editor du projet invoicedz (cjrkqrqznjhorkgcyirt)
-- puis « Run » et « Download CSV ». Requêtes en lecture seule.
--
-- Équivalent SQL de ce que fait /admin/utilisateurs (bouton « Exporter CSV »),
-- utile quand on veut les données sans passer par l'interface.

-- ── 1) Les inscrits : une entreprise + une personne par compte ───────────
-- (renseignés à l'inscription, cf. components/AuthForm.jsx → options.data)
select
  u.raw_user_meta_data -> 'entreprise' ->> 'nom'       as entreprise,
  u.raw_user_meta_data -> 'entreprise' ->> 'secteur'   as secteur,
  u.raw_user_meta_data -> 'entreprise' ->> 'effectif'  as effectif,
  u.raw_user_meta_data -> 'entreprise' ->> 'adresse'   as adresse,
  u.raw_user_meta_data -> 'entreprise' ->> 'telephone' as telephone,
  u.raw_user_meta_data -> 'contact'    ->> 'prenom'    as prenom,
  u.raw_user_meta_data -> 'contact'    ->> 'nom'       as nom,
  u.email,
  (u.email_confirmed_at is not null)                   as email_confirme,
  u.created_at::date                                   as inscrit_le,
  u.last_sign_in_at::date                              as derniere_connexion,
  (select count(*) from public.documents d where d.user_id = u.id)              as documents,
  (select count(*) from public.clients  c where c.user_id = u.id)               as clients
from auth.users u
order by u.created_at desc;

-- ── 2) Les clients saisis par les utilisateurs (CRM) ─────────────────────
-- Ce sont aussi des entreprises/personnes collectées, mais elles
-- appartiennent aux utilisateurs, pas à la plateforme.
select
  c.nom, c.telephone, c.email, c.ville, c.adresse, c.nif, c.rc,
  c.created_at::date as ajoute_le,
  u.email            as ajoute_par
from public.clients c
left join auth.users u on u.id = c.user_id
order by c.created_at desc;

-- ── 3) Résumé : combien d'entreprises par secteur ────────────────────────
select
  coalesce(nullif(u.raw_user_meta_data -> 'entreprise' ->> 'secteur', ''), '(non renseigné)') as secteur,
  count(*) as comptes
from auth.users u
group by 1
order by comptes desc;
