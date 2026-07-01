import { PageHero, PageShell, ProductCard } from "../components";
import { categories, products } from "@/lib/catalog";

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

          {/* Categorias */}
          <div className="mb-8 flex gap-3 overflow-x-auto pb-2 text-sm font-medium opacity-0 animate-fade-up [animation-delay:0.1s]">
            {categories.map((category, i) => (
              <span
                key={category}
                className="shrink-0 border border-[#d9d3ca] bg-white px-4 py-2 opacity-0 animate-fade-up"
                style={{ animationDelay: `${0.15 + i * 0.05}s` }}
              >
                {category}
              </span>
            ))}
          </div>

          {/* Grid productos */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, i) => (
              <div
                key={product.id}
                className="opacity-0 animate-fade-up"
                style={{ animationDelay: `${0.25 + i * 0.08}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>

        </div>
      </section>
    </PageShell>
  );
}
