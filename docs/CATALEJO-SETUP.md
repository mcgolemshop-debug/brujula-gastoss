# Catalejo · Escáner de comprobantes — Setup

Catalejo lee una foto/PDF de un comprobante (factura SENIAT, ticket, o captura de
transferencia/Pago Móvil) y pre-rellena el formulario de gasto para que solo lo
revises y confirmes. **La entrada manual sigue igual**; el escáner es opcional.

## Estado actual

- ✅ Todo el pipeline cliente, el mapper (IVA/peso/duplicados/fechas), la UI, la
  integración a los formularios y la server action de adjuntar están construidos y
  probados (17 tests de OCR + build limpio).
- ✅ **Funciona en modo mock hoy mismo**: con `NEXT_PUBLIC_DATA_SOURCE=mock`, el
  botón "Escanear comprobante" devuelve datos de tus 6 comprobantes reales (fixtures)
  sin necesidad de API key. Ideal para ver la UX de punta a punta.
- ⏳ Para la extracción **real** (producción) faltan 3 pasos manuales (abajo).

## Pasos manuales (los haces tú una vez)

### 1. API key de Gemini (gratis)
- Entra a **https://aistudio.google.com** → *Get API key* (no pide tarjeta).
- Copia la key.

### 2. Cargar secrets en Supabase
```bash
supabase secrets set GEMINI_API_KEY=TU_KEY_AQUI
supabase secrets set GEMINI_MODEL=gemini-2.5-flash
```
> Verifica en `ai.google.dev` cuál es el modelo Flash vigente (p. ej. la familia
> Gemini 3 Flash) y ajusta `GEMINI_MODEL` si conviene. El diseño no depende del
> modelo exacto.

### 3. Desplegar la Edge Function
```bash
supabase functions deploy extraer-comprobante
```

### 4. Verificar la policy de Storage (scan-tmp)
El escaneo sube la imagen temporal a `facturas/${tu_uid}/scan-tmp/...`. Si tus
uploads normales de factura ya funcionan (suben a `facturas/${uid}/${gastoId}/`),
scan-tmp **también** funciona (misma carpeta raíz por uid). Si diera error de
permisos al escanear, agrega esta policy en el SQL Editor:
```sql
-- Permite a cada usuario escribir bajo su propia carpeta en el bucket facturas
create policy "facturas · usuario escribe en su carpeta"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'facturas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 5. Probar con las 6 fotos reales
Escanea cada una y confirma (checklist del prompt maestro §12):

| Foto | Resultado esperado |
|---|---|
| Farmatodo | Lote 8 filas, 2026-06-25 21:09, Σ ≈ Bs 34.955,62 ✓ |
| Mi Super | Lote 14 filas, 2026-07-08 18:04, Σ ≈ Bs 47.297,86 ✓ |
| Redvital | Lote ~55-60 filas, 2026-05-30 22:13, Σ ≈ Bs 188.895,69 ✓; **medir que el guardado tarde < 10 s** |
| Banesco | Gasto individual, 16:43, ref 061831291166, Pago Móvil, Bs 51.500,00 |
| PagomóvilBDV | Gasto individual, sin hora (+aviso), Bs 200,00 |
| Pago Móvil CCE | Gasto individual, sin hora, Bs 15.008,63 |

## Privacidad (opcional)
En el free tier de Gemini, Google puede usar los datos para entrenamiento. Las
facturas traen RIF/C.I. Si te incomoda: activa billing en Google (Gemini Flash-Lite
cuesta centavos/mes a este volumen y el tier pagado **no** entrena con tus datos).
El cambio es solo de billing, sin tocar código.

## Nota de rendimiento (facturas gigantes)
La factura de ~60 ítems (Redvital) crea ~55-60 gastos secuenciales. En Vercel Hobby
(timeout 10 s) puede quedar justo. Si al probar el guardado supera ~7 s, avísame para
implementar la **Fase 2**: una función Postgres `crear_lote_gastos(jsonb)` que hace
todos los inserts en una sola transacción dentro de la base (< 1 s). El resto de la
feature ya corre fuera de Vercel (la extracción vive en la Edge Function de Supabase).
