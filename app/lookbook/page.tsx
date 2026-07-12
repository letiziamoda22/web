import Image from "next/image";
import Link from "next/link";
import { PageHero, PageShell } from "../components";
import { lookbookProducts, products } from "@/lib/catalog";

export default function LookbookPage() {
  const gridProducts = [...lookbookProducts, ...products.slice(8, 17)];

  return (
    <PageShell headerTheme="light">
      <PageHero
        eyebrow="Lookbook"
        title="Escenas de verano"
        text="Una lectura visual de la coleccion: piezas para boutique, playa, terraza, cena y paseos con mucho color."
        image="/fotos/MM245.png"
      />

      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {gridProducts.map((product, index) => (
            <Link
              key={`${product.id}-${index}`}
              href={`/producto/${product.slug}`}
              className={`group block opacity-0 animate-fade-up ${
                index % 5 === 0 ? "md:col-span-2" : ""
              }`}
              style={{ animationDelay: `${0.15 + index * 0.08}s` }}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#ece8df]">
                
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes={
                    index % 5 === 0
                      ? "(max-width: 768px) 100vw, 66vw"
                      : "(max-width: 768px) 100vw, 33vw"
                  }
                  className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                />

                <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(23,19,15,0.82),rgba(23,19,15,0))] p-5 pt-24 text-white transition duration-500 group-hover:translate-y-[-4px]">
                  <h2 className="text-2xl font-semibold">
                    {product.name}
                  </h2>
                </div>

              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
