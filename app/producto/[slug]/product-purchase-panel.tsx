"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/catalog";
import { ProductGallery } from "./product-gallery";
import { addToCart } from "@/app/add-to-cart-button";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  // Normalización: nunca permitir image null
  const colorList = useMemo(() => {
    if (product.colors.length > 0) {
      return product.colors.map((c) => ({
        name: c.name,
        image: c.image ?? product.image ?? "/placeholder.png",
      }));
    }

    return [
      {
        name: "Único",
        image: product.image ?? "/placeholder.png",
      },
    ];
  }, [product]);

  const [quantities, setQuantities] = useState<Record<string, number>>(
    () => Object.fromEntries(colorList.map((c) => [c.name, 0])),
  );

  const totalSelected = useMemo(
    () => Object.values(quantities).reduce((sum, q) => sum + q, 0),
    [quantities],
  );

  function setColorQuantity(colorName: string, value: number) {
    setQuantities((prev) => ({
      ...prev,
      [colorName]: Math.max(0, Math.min(99, value)),
    }));
  }

  function openModal() {
    setQuantities(Object.fromEntries(colorList.map((c) => [c.name, 0])));
    setModalOpen(true);
  }

  function confirmAdd() {
    const entries = Object.entries(quantities).filter(([, qty]) => qty > 0);

    if (entries.length === 0) return;

    for (const [colorName, qty] of entries) {
      addToCart(product.slug, colorName, qty);
    }

    setModalOpen(false);
    router.push("/carrito");
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1fr] lg:items-start">
      <ProductGallery
        productName={product.name}
        images={product.gallery}
        colors={product.colors}
        index={index}
        onIndexChange={setIndex}
      />

      <div className="lg:sticky lg:top-28">
        <Link href="/coleccion" className="text-sm font-semibold text-[#d0513f]">
          Volver a coleccion
        </Link>

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-[#d0513f]">
          {product.category}
        </p>

        <h1 className="mt-4 text-5xl font-semibold leading-tight sm:text-6xl">
          {product.name}
        </h1>

        <div className="mt-5 flex flex-wrap gap-3 text-sm font-medium">
          <span className="border border-[#d9d3ca] bg-white px-4 py-2">
            {product.Talla}
          </span>
        </div>

        <p className="mt-8 text-xl font-bold text-[#d0513f]">
          {product.price}
        </p>

        <p className="mt-5 max-w-xl text-lg leading-8 text-[#6b6259]">
          {product.description}
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={openModal}
            className="bg-[#17130f] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#d0513f]"
          >
            Reservar look
          </button>

          <Link
            href="/lookbook"
            className="border border-[#17130f] px-5 py-3 text-center text-sm font-semibold transition hover:bg-[#17130f] hover:text-white"
          >
            Ver inspiracion
          </Link>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-white p-6 shadow-xl sm:rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-[#17130f]">
                  {product.name}
                </h3>
                <p className="mt-1 text-sm text-[#6b6259]">
                  Elige cuántas unidades de cada color
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Cerrar"
                className="text-2xl leading-none text-[#6b6259] hover:text-[#17130f]"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {colorList.map((color) => (
                <div
                  key={color.name}
                  className="flex items-center justify-between gap-4 border border-[#e2ddd5] p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-12 shrink-0 overflow-hidden bg-[#ece8df]">
                      <Image
                        src={color.image}
                        alt={color.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>

                    <span className="text-sm font-semibold text-[#17130f]">
                      {color.name}
                    </span>
                  </div>

                  <div className="flex items-center border border-[#cfc7bd]">
                    <button
                      type="button"
                      onClick={() =>
                        setColorQuantity(
                          color.name,
                          (quantities[color.name] ?? 0) - 1
                        )
                      }
                      className="h-9 w-9 text-lg font-semibold text-[#17130f] hover:bg-[#fbfaf7]"
                    >
                      −
                    </button>

                    <input
                      type="number"
                      value={quantities[color.name] ?? 0}
                      onChange={(e) =>
                        setColorQuantity(
                          color.name,
                          Number(e.target.value) || 0
                        )
                      }
                      className="h-9 w-12 border-none text-center text-sm font-semibold outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      style={{ MozAppearance: "textfield" }}
                      aria-label={`Cantidad en ${color.name}`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setColorQuantity(
                          color.name,
                          (quantities[color.name] ?? 0) + 1
                        )
                      }
                      className="h-9 w-9 text-lg font-semibold text-[#17130f] hover:bg-[#fbfaf7]"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#e2ddd5] pt-4">
              <span className="text-sm text-[#6b6259]">
                Total:{" "}
                <strong className="text-[#17130f]">
                  {totalSelected}
                </strong>{" "}
                unidades
              </span>

              <span className="text-lg font-bold text-[#d0513f]">
                {product.price} / ud
              </span>
            </div>

            <button
              type="button"
              onClick={confirmAdd}
              disabled={totalSelected === 0}
              className="mt-5 w-full bg-[#d0513f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#17130f] disabled:cursor-not-allowed disabled:bg-[#cfc7bd]"
            >
              Añadir al carrito
            </button>
          </div>
        </div>
      )}
    </div>
  );
}