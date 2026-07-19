-- Tabla de perfiles para el Modo Diablo de Cosmos Atlas
create table if not exists profiles (
  id text primary key, -- Neural ID
  favorites text[] default '{}',
  visited text[] default '{}',
  achievements jsonb default '{}',
  settings jsonb default '{}',
  last_uplink timestamp with time zone default now()
);

-- Habilitar acceso para inserciones anónimas (Modo Invitado)
alter table profiles enable row level security;

-- Política restringida: Solo el dueño puede ver su perfil
create policy "Users can view own profile" on profiles for select using (
  auth.uid()::text = id
);

-- Política restringida: Solo el dueño puede actualizar su propio perfil
create policy "Users can update own profile" on profiles for update using (
  auth.uid()::text = id
) with check (
  auth.uid()::text = id
);

-- Permitir inserción inicial (signUp)
create policy "Users can insert own profile" on profiles for insert with check (
  auth.uid()::text = id
);
