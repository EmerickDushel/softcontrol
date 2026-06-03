-- ============================================================
-- SOFTCONTROL — Script SQL Supabase
-- Copiez-collez ce script entier dans :
-- Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================

-- ── 1. TABLE PROFILS UTILISATEURS ──────────────────────────
-- Étend la table auth.users de Supabase avec des infos métier
create table if not exists public.profils (
  id          uuid primary key references auth.users(id) on delete cascade,
  nom         text not null,
  prenom      text not null,
  email       text not null,
  role        text not null default 'Contrôleur'
              check (role in ('Administrateur', 'Contrôleur', 'Superviseur')),
  created_at  timestamptz default now()
);

-- Activer RLS (Row Level Security)
alter table public.profils enable row level security;

-- Politique : chaque utilisateur voit tous les profils (lecture)
create policy "Profils visibles par tous les utilisateurs connectés"
  on public.profils for select
  using (auth.role() = 'authenticated');

-- Politique : chaque utilisateur ne modifie que son propre profil
create policy "Utilisateur modifie son propre profil"
  on public.profils for update
  using (auth.uid() = id);

-- Politique : insertion autorisée pour créer son profil
create policy "Insertion de son propre profil"
  on public.profils for insert
  with check (auth.uid() = id);

-- Politique : admins peuvent tout faire
create policy "Admins gèrent tous les profils"
  on public.profils for all
  using (
    exists (
      select 1 from public.profils
      where id = auth.uid() and role = 'Administrateur'
    )
  );

-- ── 2. TABLE CONTROLES HACCP ───────────────────────────────
create table if not exists public.controles (
  id              uuid primary key default gen_random_uuid(),
  control_id      integer not null,       -- ID interne du contrôle (101, 201…)
  category_id     integer not null,       -- ID de la catégorie (1 à 6)
  category_name   text not null,
  name            text not null,
  description     text,
  criticality     text default 'Majeur'
                  check (criticality in ('Critique', 'Majeur', 'Mineur')),
  status          text not null default 'Non fait'
                  check (status in ('Non fait', 'En cours', 'Terminé', 'Non conforme')),
  planned_date    date,
  realized_date   date,
  agent_nom       text,
  agent_prenom    text,
  comment         text,
  time_realized   text,                   -- format HH:MM
  created_by      uuid references auth.users(id),
  updated_by      uuid references auth.users(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.controles enable row level security;

-- Tous les utilisateurs connectés peuvent lire
create policy "Contrôles lisibles par utilisateurs connectés"
  on public.controles for select
  using (auth.role() = 'authenticated');

-- Tous les utilisateurs connectés peuvent insérer
create policy "Contrôles créables par utilisateurs connectés"
  on public.controles for insert
  with check (auth.role() = 'authenticated');

-- Tous les utilisateurs connectés peuvent modifier
create policy "Contrôles modifiables par utilisateurs connectés"
  on public.controles for update
  using (auth.role() = 'authenticated');

-- Admins et Superviseurs peuvent supprimer
create policy "Suppression par admins et superviseurs"
  on public.controles for delete
  using (
    exists (
      select 1 from public.profils
      where id = auth.uid()
      and role in ('Administrateur', 'Superviseur')
    )
  );

-- Trigger pour mettre à jour updated_at automatiquement
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger controles_updated_at
  before update on public.controles
  for each row execute function update_updated_at();

-- ── 3. TABLE PHOTOS ────────────────────────────────────────
create table if not exists public.photos (
  id            uuid primary key default gen_random_uuid(),
  controle_id   uuid not null references public.controles(id) on delete cascade,
  storage_path  text not null,            -- chemin dans Supabase Storage
  nom_fichier   text,
  uploaded_by   uuid references auth.users(id),
  created_at    timestamptz default now()
);

alter table public.photos enable row level security;

create policy "Photos lisibles par utilisateurs connectés"
  on public.photos for select
  using (auth.role() = 'authenticated');

create policy "Photos uploadables par utilisateurs connectés"
  on public.photos for insert
  with check (auth.role() = 'authenticated');

create policy "Photos supprimables par uploader ou admin"
  on public.photos for delete
  using (
    auth.uid() = uploaded_by
    or exists (
      select 1 from public.profils
      where id = auth.uid() and role = 'Administrateur'
    )
  );

-- ── 4. BUCKET STORAGE POUR LES PHOTOS ─────────────────────
-- Créer le bucket "photos-haccp" (public en lecture)
insert into storage.buckets (id, name, public)
values ('photos-haccp', 'photos-haccp', true)
on conflict (id) do nothing;

-- Politique storage : lecture publique
create policy "Photos HACCP publiques en lecture"
  on storage.objects for select
  using (bucket_id = 'photos-haccp');

-- Politique storage : upload par utilisateurs connectés
create policy "Upload photos HACCP par utilisateurs connectés"
  on storage.objects for insert
  with check (
    bucket_id = 'photos-haccp'
    and auth.role() = 'authenticated'
  );

-- Politique storage : suppression par le propriétaire
create policy "Suppression photos par propriétaire"
  on storage.objects for delete
  using (
    bucket_id = 'photos-haccp'
    and auth.uid() = owner
  );

-- ── 5. FONCTION CRÉATION PROFIL AUTOMATIQUE ───────────────
-- Crée automatiquement un profil quand un utilisateur s'inscrit
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profils (id, nom, prenom, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nom', 'Utilisateur'),
    coalesce(new.raw_user_meta_data->>'prenom', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'Contrôleur')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 6. VUE STATISTIQUES ────────────────────────────────────
create or replace view public.stats_controles as
select
  count(*) as total,
  count(*) filter (where status = 'Terminé') as termines,
  count(*) filter (where status = 'Non fait') as non_faits,
  count(*) filter (where status = 'En cours') as en_cours,
  count(*) filter (where status = 'Non conforme') as non_conformes,
  count(*) filter (
    where status = 'Non fait'
    and planned_date < current_date
  ) as en_retard
from public.controles;

-- ── 7. TABLE PRODUITS & DLC ────────────────────────────────
create table if not exists public.produits (
  id                   uuid primary key default gen_random_uuid(),
  nom                  text not null,
  categorie            text,
  fournisseur          text,
  numero_lot           text,
  dlc                  date not null,
  quantite             text,
  unite                text default 'kg',
  alerte_j3_envoyee    boolean default false,
  created_by           uuid references auth.users(id),
  updated_by           uuid references auth.users(id),
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table public.produits enable row level security;

create policy "Produits lisibles par utilisateurs connectés"
  on public.produits for select
  using (auth.role() = 'authenticated');

create policy "Produits créables par utilisateurs connectés"
  on public.produits for insert
  with check (auth.role() = 'authenticated');

create policy "Produits modifiables par utilisateurs connectés"
  on public.produits for update
  using (auth.role() = 'authenticated');

create policy "Produits supprimables par admins et superviseurs"
  on public.produits for delete
  using (
    exists (
      select 1 from public.profils
      where id = auth.uid()
      and role in ('Administrateur', 'Superviseur')
    )
  );

create trigger produits_updated_at
  before update on public.produits
  for each row execute function update_updated_at();

-- ── FIN DU SCRIPT ──────────────────────────────────────────
-- Vérification : afficher les tables créées
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
