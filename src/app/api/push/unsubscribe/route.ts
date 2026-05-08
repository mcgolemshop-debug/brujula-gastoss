import { NextResponse } from "next/server";
import { repo } from "@/lib/repositories";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await repo.users.current();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: { endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!body.endpoint) {
    return NextResponse.json({ error: "Endpoint requerido" }, { status: 400 });
  }

  try {
    await repo.pushSubs.unsubscribe(body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Error al eliminar",
      },
      { status: 500 }
    );
  }
}
