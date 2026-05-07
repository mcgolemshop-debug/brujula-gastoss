-- =====================================================================
-- Brújula Markets · Seed inicial (solo dev local)
-- Crea: 8 usuarios + 12 categorías + tasa 36.5 + 10 mobiliario + 5 gastos
-- =====================================================================

-- IMPORTANTE: Este seed inserta directamente en auth.users (solo dev local).
-- En producción, los usuarios se crean vía Supabase Admin API.
-- Password de todos los usuarios demo: "Brujula2026!"

-- UUIDs fijos para que el seed sea reproducible
-- Orlando = 0001, Arlet = 0002, Lenin = 0003, Christian = 0004,
-- Diego = 0005, Sandro = 0006, Luis = 0007, Gean = 0008

-- =====================================================================
-- 1. AUTH.USERS (8 personas) — solo dev local
-- =====================================================================

-- Función helper local para insertar auth users limpio
do $$
declare
  encrypted_pw text := crypt('Brujula2026!', gen_salt('bf'));
begin

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  values
    ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'orlando@brujula.local', encrypted_pw, now(), '{"provider":"email","providers":["email"]}', '{"nombre_completo":"Orlando Velásquez","rol":"admin","cargo":"Director / Jefe"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'arlet@brujula.local', encrypted_pw, now(), '{"provider":"email","providers":["email"]}', '{"nombre_completo":"Arlet Rodríguez","rol":"empleado","cargo":"Trader"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'lenin@brujula.local', encrypted_pw, now(), '{"provider":"email","providers":["email"]}', '{"nombre_completo":"Lenin Rodríguez","rol":"empleado","cargo":"Trader"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'christian@brujula.local', encrypted_pw, now(), '{"provider":"email","providers":["email"]}', '{"nombre_completo":"Christian Polanco","rol":"empleado","cargo":"Trader"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'diego@brujula.local', encrypted_pw, now(), '{"provider":"email","providers":["email"]}', '{"nombre_completo":"Diego Pérez","rol":"empleado","cargo":"Trader"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'sandro@brujula.local', encrypted_pw, now(), '{"provider":"email","providers":["email"]}', '{"nombre_completo":"Sandro Dhoy","rol":"empleado","cargo":"Trader"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'luis@brujula.local', encrypted_pw, now(), '{"provider":"email","providers":["email"]}', '{"nombre_completo":"Luis Rodríguez","rol":"empleado","cargo":"Trader"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated', 'gean@brujula.local', encrypted_pw, now(), '{"provider":"email","providers":["email"]}', '{"nombre_completo":"Gean Carlos Moncalves","rol":"empleado","cargo":"Trader"}', now(), now(), '', '', '', '')
  on conflict (id) do nothing;

  -- Identidades para login con email
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  select
    gen_random_uuid(),
    id,
    id::text,
    jsonb_build_object('sub', id::text, 'email', email),
    'email',
    now(), now(), now()
  from auth.users
  where email like '%@brujula.local'
  on conflict do nothing;

end $$;

-- =====================================================================
-- 2. TASA DE CAMBIO INICIAL — 36.5 Bs/USD del Excel
-- =====================================================================
insert into public.tasa_cambio (valor_bs_por_usd, fuente, actualizado_por)
values (36.5, 'inicial · Excel mayo 2026', '00000000-0000-0000-0000-000000000001');

-- =====================================================================
-- 3. CATEGORÍAS (12)
-- =====================================================================
insert into public.categorias (nombre, icono, color, tipo, notas, orden) values
  ('Comida', 'UtensilsCrossed', '#D4A574', 'variable', 'Alimentación equipo', 1),
  ('Ferretería', 'Wrench', '#5F5E5A', 'variable', 'Reparaciones / Tornillería', 2),
  ('Limpieza', 'Sparkles', '#60A5FA', 'variable', 'Productos de limpieza', 3),
  ('Repuestos', 'Cog', '#F59E0B', 'variable', 'Para vehículos / equipos', 4),
  ('Aceites Carro/Moto', 'Droplets', '#7C2D12', 'variable', 'Lubricantes', 5),
  ('Mobiliario', 'Armchair', '#0A2540', 'activo_fijo', 'Va a inventario', 6),
  ('Tecnología/Dispositivos', 'Laptop', '#143659', 'activo_fijo', 'Va a inventario', 7),
  ('Servicios', 'Plug', '#15803D', 'fijo', 'Internet, luz, agua', 8),
  ('Combustible', 'Fuel', '#DC2626', 'variable', 'Gasolina / Gas', 9),
  ('Medicinas', 'Pill', '#10B981', 'variable', 'Botiquín oficina', 10),
  ('Papelería/Oficina', 'FileText', '#8B5CF6', 'variable', 'Hojas, tinta, carpetas', 11),
  ('Otros', 'MoreHorizontal', '#6B7280', 'variable', 'Misceláneos', 12)
on conflict (nombre) do nothing;

-- =====================================================================
-- 4. MOBILIARIO INICIAL (10 ítems del Excel)
-- =====================================================================
insert into public.mobiliario (codigo, tipo, descripcion, marca_modelo, serial, cantidad, estado, ubicacion, asignado_a, precio_compra_usd, fecha_ingreso, fecha_ultimo_mantenimiento, notas) values
  ('M-001', 'mobiliario', 'Escritorio ejecutivo de madera', 'Importado', 'ESC-001', 1, 'buen_estado', 'Sala Trading', '00000000-0000-0000-0000-000000000001', 350, '2025-01-15', '2025-09-01', 'Comprado al inicio de la oficina'),
  ('M-002', 'mobiliario', 'Silla ergonómica', 'Office Pro', 'SIL-001', 8, 'buen_estado', 'Sala Trading', null, 120, '2025-01-15', null, '8 sillas para los traders'),
  ('M-003', 'dispositivo', 'Monitor 24 pulgadas', 'Samsung', 'SN-MON-2024-01', 8, 'nuevo', 'Sala Trading', null, 180, '2025-01-20', null, 'Monitores principales para análisis'),
  ('M-004', 'dispositivo', 'PC Desktop i7', 'HP', 'SN-PC-2024-01', 8, 'nuevo', 'Sala Trading', null, 850, '2025-01-20', '2025-08-15', 'Equipos para trading 24/5'),
  ('M-005', 'dispositivo', 'Router WiFi 6', 'TP-Link', 'RT-001', 1, 'buen_estado', 'Sala Trading', null, 95, '2025-02-01', null, 'Conexión de respaldo'),
  ('M-006', 'mobiliario', 'Mesa de reuniones', 'Local', 'MES-001', 1, 'buen_estado', 'Sala Reuniones', null, 220, '2025-02-10', null, null),
  ('M-007', 'equipo', 'Aire acondicionado split', 'LG', 'SN-AC-001', 2, 'buen_estado', 'Sala Trading', null, 480, '2025-03-05', '2025-10-01', 'Última recarga gas refrigerante'),
  ('M-008', 'mobiliario', 'Archivero metálico 4 gavetas', 'Metal Office', 'ARC-001', 2, 'regular', 'Oficina Principal', null, 145, '2025-03-15', null, 'Necesita ajuste de gavetas'),
  ('M-009', 'dispositivo', 'Impresora multifuncional', 'Epson', 'SN-IMP-001', 1, 'buen_estado', 'Recepción', null, 280, '2025-04-01', null, 'Tinta cargable'),
  ('M-010', 'mobiliario', 'Silla vieja de visitante', 'Marca antigua', 'SIL-VIE-001', 1, 'necesita_reparacion', 'Almacén', null, 0, '2025-05-10', null, 'Considerar dar de baja')
on conflict (codigo) do nothing;

-- =====================================================================
-- 5. GASTOS DE EJEMPLO (5 del Excel) — opcional, comentar si no se quieren
-- =====================================================================
do $$
declare
  cat_comida uuid;
  cat_ferreteria uuid;
  cat_aceites uuid;
  cat_tech uuid;
begin
  select id into cat_comida from public.categorias where nombre = 'Comida';
  select id into cat_ferreteria from public.categorias where nombre = 'Ferretería';
  select id into cat_aceites from public.categorias where nombre = 'Aceites Carro/Moto';
  select id into cat_tech from public.categorias where nombre = 'Tecnología/Dispositivos';

  insert into public.gastos (codigo, fecha, hora, usuario_id, categoria_id, descripcion, cantidad, unidad, items, precio_unitario_usd, tasa_cambio, metodo_pago, lugar_compra, numero_factura, va_a_inventario, observaciones) values
    ('G-0001', '2026-05-01', '09:30', '00000000-0000-0000-0000-000000000004', cat_comida, 'Carne de solomo', 1.5, 'Kg', 1, 8.5, 36.5, 'Efectivo $', 'Carnicería La Estrella', 'F-12345', false, 'Almuerzo del equipo'),
    ('G-0002', '2026-05-01', '09:35', '00000000-0000-0000-0000-000000000004', cat_comida, 'Limones', 2, 'Kg', 1, 1.2, 36.5, 'Efectivo $', 'Carnicería La Estrella', 'F-12345', false, 'Para jugos'),
    ('G-0003', '2026-05-01', '11:15', '00000000-0000-0000-0000-000000000003', cat_ferreteria, 'Tornillos varios + destornillador', 1, 'Set', 1, 12, 36.5, 'Pago Móvil', 'Ferretería El Centro', 'F-789', false, 'Reparación silla'),
    ('G-0004', '2026-05-02', '14:20', '00000000-0000-0000-0000-000000000005', cat_aceites, 'Aceite 20W50', 1, 'Galón', 1, 18, 36.5, 'Efectivo $', 'Auto Repuestos JR', 'F-456', false, 'Cambio aceite carro Orlando'),
    ('G-0005', '2026-05-02', '16:00', '00000000-0000-0000-0000-000000000006', cat_tech, 'Mouse inalámbrico Logitech', 1, 'Unidad', 2, 25, 36.5, 'Transferencia', 'TecnoStore', 'F-2233', true, 'Para nuevos puestos de trabajo')
  on conflict (codigo) do nothing;
end $$;
