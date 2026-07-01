"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/catalog";

export type CartItem = {
  slug: string;
  color: string;
  quantity: number;
};

const CART_KEY = "tanna-cart";
let cachedRawCart = "";
let cachedCart: CartItem[] = [];

function readCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawCart = window.localStorage.getItem(CART_KEY) ?? "";

    if (rawCart === cachedRawCart) {
      return cachedCart;
    }

    const parsed = rawCart ? JSON.parse(rawCart) : [];

    if (!Array.isArray(parsed)) {
      cachedRawCart = rawCart;
      cachedCart = [];
      return [];
    }

    cachedRawCart = rawCart;
    cachedCart = parsed
      .filter((item) => typeof item?.slug === "string" && Number.isInteger(item?.quantity))
      .map((item) => ({
        slug: item.slug,
        color: typeof item.color === "string" ? item.color : "",
        quantity: Math.min(Math.max(item.quantity, 1), 99),
      }));

    return cachedCart;
  } catch {
    cachedRawCart = "";
    cachedCart = [];
    return [];
  }
}

function writeCart(cart: CartItem[]) {
  cachedCart = cart.map((item) => ({ ...item }));
  cachedRawCart = JSON.stringify(cachedCart);
  window.localStorage.setItem(CART_KEY, cachedRawCart);
  window.dispatchEvent(new CustomEvent("tanna-cart-updated"));
}

export function getStoredCart() {
  return readCart();
}

export function setStoredCart(cart: CartItem[]) {
  writeCart(cart);
}

export function clearStoredCart() {
  writeCart([]);
}

// Añade `quantity` unidades de un slug+color concretos. Si ya existe esa
// combinación en el carrito, suma la cantidad en vez de duplicar la línea.
export function addToCart(slug: string, color: string, quantity: number) {
  const cart = readCart();
  const existing = cart.find((item) => item.slug === slug && item.color === color);

  const nextCart = existing
    ? cart.map((item) =>
        item.slug === slug && item.color === color
          ? { ...item, quantity: Math.min(item.quantity + quantity, 99) }
          : item,
      )
    : [...cart, { slug, color, quantity: Math.min(Math.max(quantity, 1), 99) }];

  writeCart(nextCart);
}

export function AddToCartButton({
  product,
  color,
  quantity = 1,
  className,
  redirectToCart = false,
}: {
  product: Product;
  color: string;
  quantity?: number;
  className?: string;
  redirectToCart?: boolean;
}) {
  const router = useRouter();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addToCart(product.slug, color, quantity);
    setAdded(true);

    if (redirectToCart) {
      router.push("/carrito");
      return;
    }

    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={
        className ??
        "bg-[#17130f] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#d0513f]"
      }
    >
      {added ? "Anadido al carrito" : "Reservar look"}
    </button>
  );
}