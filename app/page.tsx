import Image from "next/image";
import Link from "next/link";
import { PageShell, ProductCard } from "./components";
import { featuredProducts, lookbookProducts, products } from "@/lib/catalog";


const occasions = [
  "Cena frente al mar",
  "Paseo de ciudad",
  "Invitada relajada",
  "Maleta capsula",
  "Tarde de terraza",
  "Escapada premium",
];

export default function Home() {
  return (
    <PageShell headerTheme="light">
      <section className="relative isolate min-h-[92svh] overflow-hidden bg-[#17130f] text-white">
        <Image
          src="/fotos/MM245.png"
          alt="Vestido estampado Tanna frente a escaparates de lujo"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[48%_30%] opacity-80"
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,13,10,0.88)_0%,rgba(15,13,10,0.55)_42%,rgba(15,13,10,0.14)_100%)]" />

        <div className="relative mx-auto flex min-h-[92svh] max-w-7xl flex-col justify-end px-5 pb-14 pt-28 sm:px-8 lg:pb-20">
          
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.34em] text-[#9ee8dd] opacity-0 animate-fade-up [animation-delay:0.1s]">
            Boutique resort edit
          </p>

          <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] text-white sm:text-7xl lg:text-7xl opacity-0 animate-fade-up [animation-delay:0.25s]">
            TANNA
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/82 sm:text-xl opacity-0 animate-fade-up [animation-delay:0.4s]">
            Moda bohemia pulida para dias de sol, cenas largas y maletas que
            merecen algo mas que basicos.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 opacity-0 animate-fade-up [animation-delay:0.55s]">
            <Link
              href="/coleccion"
              className="bg-white px-5 py-3 text-sm font-semibold text-[#17130f] transition hover:bg-[#9ee8dd]"
            >
              Ver coleccion
            </Link>

            <Link
              href="/lookbook"
              className="border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Inspiracion
            </Link>
          </div>

        </div>
      </section>

      <section className="bg-[#fbfaf7] px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto pb-2 text-sm font-medium text-[#17130f]">
          {occasions.map((occasion) => (
            <span key={occasion} className="shrink-0 border border-[#d9d3ca] bg-white px-4 py-2">
              {occasion}
            </span>
          ))}
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d0513f]">
                Nueva coleccion
              </p>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
                Vestidos y sets con alma de vacaciones.
              </h2>
            </div>
            <div className="max-w-2xl text-base leading-8 text-[#6b6259] lg:justify-self-end">
              <p>
                El catalogo ahora reune todas las prendas disponibles: piezas
                fotogenicas que trabajan bien solas y elevan lo que ya tienes.
              </p>
              <Link href="/coleccion" className="mt-4 inline-block font-semibold text-[#d0513f]">
                Ver las {products.length} prendas
              </Link>
            </div>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      </section>

      

      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d0513f]">
                Lookbook
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
                Como se siente puesto.
              </h2>
            </div>
            <Link href="/lookbook" className="text-sm font-semibold text-[#d0513f]">
              Abrir lookbook completo
            </Link>
          </div>



          <div className="grid gap-5 md:grid-cols-3">
          {lookbookProducts.slice(0, 3).map((product) => (
            <Link
              key={product.id}
              href={`/producto/${product.slug}`}
              className="group block"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#ece8df]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.04]"
                />

                {/* Overlay editorial claro (optimizado para texto negro) */}
                <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(236,232,223,0.95),rgba(236,232,223,0))] p-5 pt-24 text-black">
                  <p className="text-sm uppercase tracking-[0.24em] text-black/60">
                    {product.mood}
                  </p>

                  <h3 className="mt-3 text-2xl font-semibold leading-tight">
                    {product.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>



        </div>
      </section>

      <section className="border-y border-[#e2ddd5] bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_1.1fr] md:items-center">
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Quieres que elijamos tres looks para tu proxima ocasion?
          </h2>
          <form className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              className="min-h-12 border border-[#cfc7bd] bg-[#fbfaf7] px-4 text-base outline-none transition placeholder:text-[#81776e] focus:border-[#d0513f]"
            />
            <button className="min-h-12 bg-[#d0513f] px-6 text-sm font-semibold text-white transition hover:bg-[#17130f]">
              Pedir seleccion
            </button>
          </form>
        </div>
      </section>
    </PageShell>
  );
}
