import { redirect } from "next/navigation";

export default function Home() {
  // Si hay sesión, el middleware deja pasar y redirigimos al dashboard.
  // Si no hay sesión, el middleware redirige a /login antes de llegar acá.
  redirect("/dashboard");
}
