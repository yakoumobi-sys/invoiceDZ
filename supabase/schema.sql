-- ═══ invoicedz · script d'installation cloud (à coller dans Supabase → SQL Editor → Run) ═══
-- Crée les tables documents, clients & produits et protège toutes les données par
-- utilisateur (RLS). Sans ce script, le site fonctionne quand même : tout reste
-- enregistré sur l'appareil (mode invité). Script idempotent : peut être relancé
-- sans risque (create if not exists, drop policy if exists).

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  type text not null,
  numero text,
  statut text,
  date date,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.documents enable row level security;
drop policy if exists "documents_own" on public.documents;
create policy "documents_own" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  nom text not null,
  telephone text,
  email text,
  adresse text,
  ville text,
  nif text,
  rc text,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.clients enable row level security;
drop policy if exists "clients_own" on public.clients;
create policy "clients_own" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.produits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  designation text not null,
  unite text default 'Unité',
  "prixUnitaire" numeric default 0,
  tva numeric default 19,
  created_at timestamptz not null default now()
);
alter table public.produits enable row level security;
drop policy if exists "produits_own" on public.produits;
create policy "produits_own" on public.produits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
