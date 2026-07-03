import { PageHero, PageShell } from "../components";
import { categories, products } from "@/lib/catalog";
import { CollectionBrowser } from "./collection-browser";

export default function CollectionPage() {
  return (
    <PageShell headerTheme="light">
      <PageHero
        eyebrow="Catalogo completo"
        title="Todas las prendas Tanna"
        text="Vestidos, sets, faldas, camiseros y kimonos reunidos en una coleccion pensada para viajar ligera y vestir con presencia."
        image="/fotos/MM245.png"
      />

      <section className="px-5 py-12 sm:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <CollectionBrowser products={products} categories={categories} />
        </div>
      </section>
    </PageShell>
  );
}
