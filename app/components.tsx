"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Product } from "@/lib/catalog";
import { CartLink } from "./cart-link";
import { AccountButton } from "@/components/AuthButtons";

const navItems = [
  ["Coleccion", "/coleccion"],
  ["Lookbook", "/lookbook"],
  ["Contacto", "/contacto"],
];

type HeaderTheme = "dark" | "light";

export function SiteHeader({ theme = "dark" }: { theme?: HeaderTheme }) {
  const pathname = usePathname();
  const hideAuthControls = pathname === "/login" || pathname === "/registro";

  const isLight = theme === "light";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 border-b backdrop-blur-md transition-colors ${
        isLight
          ? "border-black/10 bg-white/80 text-[#17130f]"
          : "border-white/20 bg-[#17130f]/76 text-white"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        {/* Brand */}
        <Link href="/" className="text-base font-semibold uppercase tracking-[0.22em]">
          Tanna
        </Link>

        {/* Center nav */}
        <div
          className={`hidden items-center gap-7 text-sm md:flex ${
            isLight ? "text-[#17130f]/70" : "text-white/78"
          }`}
        >
          {navItems.map(([label, href]) => (
            <Link
              key={href}
              className={isLight ? "transition hover:text-[#17130f]" : "transition hover:text-white"}
              href={href}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right cluster (cart + auth) */}
        {!hideAuthControls && (
          <div className="flex items-center gap-3">
            <CartLink />
            <AccountButton theme={theme} />
          </div>
        )}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-[#17130f] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <p className="font-semibold uppercase tracking-[0.22em]">Tanna</p>
          <p className="mt-2 text-sm text-white/60">
            Moda bohemia sofisticada, curada para llevarse puesta.
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-white/68">
          {navItems.map(([label, href]) => (
            <Link key={href} className="hover:text-white" href={href}>
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-3 border-t border-white/15 pt-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Tanna Moda. Todos los derechos reservados.</p>
        <div className="flex flex-row gap-4">
        <Link href="/terminos" className="underline-offset-4 hover:text-white hover:underline">
          Términos y Condiciones
        </Link>
        <Link href="/privacidad" className="underline-offset-4 hover:text-white hover:underline">
          Politica de Privacidad
        </Link>
        </div>
      </div>
    </footer>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group border border-[#e2ddd5] bg-white shadow-[0_18px_60px_-45px_rgba(23,19,15,0.55)] transition duration-500 hover:-translate-y-2 hover:shadow-[0_24px_70px_-35px_rgba(23,19,15,0.55)]">
      <Link href={`/producto/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#ece8df]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        </div>
      </Link>
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="mt-1 text-sm text-[#7b7168]">{product.fit}</p>
          </div>
          <span className="text-sm font-bold text-[#d0513f]">{product.price}</span>
        </div>
        <p className="min-h-12 text-sm leading-6 text-[#62584f]">{product.description}</p>
        <Link
          href={`/producto/${product.slug}`}
          className="block w-full bg-[#17130f] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#d0513f]"
        >
          Ver look
        </Link>
      </div>
    </article>
  );
}

export function PageShell({
  children,
  headerTheme = "dark",
}: {
  children: React.ReactNode;
  headerTheme?: HeaderTheme;
}) {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#17130f] animate-fade-in">
      <SiteHeader theme={headerTheme} />
      {children}
      <SiteFooter />
    </main>
  );
}

export function PageHero({
  eyebrow,
  title,
  text,
  image,
}: {
  eyebrow: string;
  title: string;
  text: string;
  image: string;
}) {
  return (
    <section className="relative isolate h-[62svh] min-h-[520px] overflow-hidden bg-[#17130f] px-5 pb-12 pt-32 text-white sm:px-8 lg:pb-16">
      <Image src={image} alt="" fill priority sizes="100vw" className="object-cover opacity-[0.62] transition duration-700 hover:scale-[1.03]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,13,10,0.9),rgba(15,13,10,0.34))]" />
      <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9ee8dd]">{eyebrow}</p>
        <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] text-white sm:text-7xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/82">{text}</p>
      </div>
    </section>
  );
}