/**
 * Catalejo · Compresión de comprobantes en el cliente antes de subirlos.
 * Reduce el peso (y de paso decodifica HEIC de iPhone vía Safari) sin perder
 * legibilidad de facturas con letra pequeña.
 */

async function aJpeg(canvas: HTMLCanvasElement, q: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("No se pudo generar JPEG"))),
      "image/jpeg",
      q
    )
  );
}

export interface ComprobanteComprimido {
  blob: Blob;
  mimeType: string;
}

/** PDF pasa directo; imágenes se reescalan a ≤2048px lado mayor y JPEG q0.85. */
export async function comprimirComprobante(
  file: File
): Promise<ComprobanteComprimido> {
  if (file.type === "application/pdf") {
    return { blob: file, mimeType: "application/pdf" };
  }

  // createImageBitmap decodifica HEIC en Safari y corrige la orientación EXIF.
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });

  const MAX = 2048; // no bajar: la factura de 60 ítems tiene letra diminuta
  const escala = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();

  let blob = await aJpeg(canvas, 0.85);
  if (blob.size > 2_500_000) blob = await aJpeg(canvas, 0.72);
  return { blob, mimeType: "image/jpeg" };
}
