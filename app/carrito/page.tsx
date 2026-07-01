import { PageHero, PageShell } from "../components";
import { products } from "@/lib/catalog";
import { CartClient } from "./cart-client";

export default function CartPage() {
  return (
    <PageShell headerTheme="light">
      <PageHero
        eyebrow="Carrito"
        title="Reserva tus looks"
        text="Revisa las prendas, deja tus datos y enviaremos la solicitud al servidor para preparar disponibilidad y respuesta."
        image="/fotos/CO1410.jpg"
      />
      <CartClient products={products} />
    </PageShell>
  );
}
