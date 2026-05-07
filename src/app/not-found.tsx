import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrujulaIcon } from "@/components/brand/brujula-icon";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative inline-block">
          <BrujulaIcon size={120} className="opacity-90" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-[10px] uppercase tracking-widest text-brand-cream/0">
              404
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Error 404
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight">
            Te perdiste en la travesía
          </h1>
          <p className="text-sm text-muted-foreground">
            La ruta que buscas no existe o fue movida. La brújula te lleva de
            vuelta al norte.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="accent" size="lg" className="gap-2">
            <Link href="/dashboard">
              <Compass className="h-4 w-4" />
              Volver al dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/gastos">
              <ArrowLeft className="h-4 w-4" />
              Lista de gastos
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
