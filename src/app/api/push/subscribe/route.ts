import { NextResponse } from "next/server";
import { repo } from "@/lib/repositories";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await repo.users.current();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
    user_agent?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json(
      { error: "Datos de suscripción incompletos" },
      { status: 400 }
    );
  }

  try {
    await repo.pushSubs.subscribe({
      usuario_id: user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth_secret: body.keys.auth,
      user_agent: body.user_agent,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Error guardando suscripción",
      },
      { status: 500 }
    );
  }
}
