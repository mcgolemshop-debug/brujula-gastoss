import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { BrujulaIcon } from "@/components/brand/brujula-icon";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <>
      {/* Lado izquierdo · branding */}
      <aside className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-brand-gradient text-brand-cream">
        {/* Decoración de fondo: círculos sutiles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-gold/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-brand-gold/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(212,165,116,0.08),transparent_60%)]" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div className="flex items-center gap-3">
            <BrujulaIcon size={56} variant="default" />
            <div className="flex flex-col leading-none">
              <span className="font-serif text-3xl font-medium tracking-tight">Brújula</span>
              <span
                className="font-sans text-xs uppercase mt-1 text-brand-cream/70"
                style={{ letterSpacing: "0.5em" }}
              >
                Markets
              </span>
            </div>
          </div>

          <div className="space-y-6 max-w-lg">
            <h1 className="font-serif text-4xl xl:text-5xl font-medium leading-tight tracking-tight">
              Cada gasto,<br />
              <span className="text-brand-gold italic">en su lugar.</span>
            </h1>
            <p className="text-base xl:text-lg text-brand-cream/80 leading-relaxed">
              Sistema interno de control de gastos operativos de la oficina —
              registra compras, gestiona inventario, monitorea presupuestos en
              tiempo real con conversión $/Bs automática.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Stat label="Equipo" value="8" />
              <Stat label="Categorías" value="12" />
              <Stat label="Moneda" value="$ / Bs" />
            </div>
          </div>

          <p className="text-xs text-brand-cream/50 font-mono">
            v0.1.0 · Brújula Markets · Caracas, Venezuela
          </p>
        </div>
      </aside>

      {/* Lado derecho · formulario */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        {/* Logo móvil arriba */}
        <div className="lg:hidden mb-10 flex flex-col items-center gap-3">
          <BrujulaIcon size={56} />
          <div className="flex flex-col items-center leading-none">
            <span className="font-serif text-2xl font-medium tracking-tight">Brújula</span>
            <span
              className="font-sans text-[10px] uppercase mt-1 text-muted-foreground"
              style={{ letterSpacing: "0.5em" }}
            >
              Markets
            </span>
          </div>
        </div>

        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="font-serif text-3xl font-medium tracking-tight">
              Bienvenido de vuelta
            </h2>
            <p className="text-sm text-muted-foreground">
              Ingresa con tu correo de la oficina para continuar.
            </p>
          </div>

          <LoginForm />

          <p className="text-xs text-center text-muted-foreground">
            ¿Problemas para entrar? Contacta a Orlando para reactivar tu
            acceso.
          </p>
        </div>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-cream/5 border border-brand-cream/10 backdrop-blur-sm px-4 py-2.5 min-w-24">
      <div className="font-mono text-2xl font-semibold text-brand-gold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-brand-cream/60">{label}</div>
    </div>
  );
}
