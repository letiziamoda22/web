"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/catalog";
import { clearStoredCart, getStoredCart, setStoredCart, type CartItem } from "../add-to-cart-button";
import { useAuth } from "@/context/AuthContext";

type SubmitState =
  | { status: "idle"; message: string }
  | { status: "loading"; message: string }
  | { status: "error"; message: string };

type CustomerType = "anonimo" | "autonomo" | "empresa";


const PAYMENT_FEE_RATE = 0.014;
const DELIVERY_FEE = 8.95;
const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_TIME = 5;

function priceToNumber(price: string) {
  const normalized = price
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.]/g, "");

  const value = Number(normalized);

  return Number.isFinite(value) ? value : 0;
}

function lineKey(slug: string, color: string) {
  return `${slug}__${color}`;
}

export function CartClient({ products }: { products: Product[] }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [customerType, setCustomerType] = useState<CustomerType>("anonimo");
  const [billingAddress, setBillingAddress] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestNif, setGuestNif] = useState("");
  const [notes, setNotes] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle", message: "" });

  const productMap = useMemo(() => new Map(products.map((product) => [product.slug, product])), [products]);
  const EMPTY_CART: CartItem[] = [];
  const getServerSnapshot = () => EMPTY_CART;
  const cart = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener("tanna-cart-updated", onStoreChange);

      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener("tanna-cart-updated", onStoreChange);
      };
    },
    getStoredCart,
    getServerSnapshot
  );

  const cartProducts = cart
    .map((item) => ({
      item,
      product: productMap.get(item.slug),
    }))
    .filter((entry): entry is { item: CartItem; product: Product } => Boolean(entry.product));

  const subtotal = Number(
    cartProducts.reduce(
      (sum, entry) => sum + priceToNumber(entry.product.price) * entry.item.quantity,
      0,
    ).toFixed(2)
  );

  const paymentFee = Number((subtotal * PAYMENT_FEE_RATE + 0.25).toFixed(2));
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const deliveryFee = cartProducts.length > 0 ? (isFreeShipping ? 0 : DELIVERY_FEE) : 0;
  const total = Number((subtotal + paymentFee + deliveryFee).toFixed(2));
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  function updateCart(nextCart: CartItem[]) {
    setStoredCart(nextCart);
  }

  function setQuantity(slug: string, color: string, quantity: number) {
    updateCart(
      cart
        .map((item) =>
          item.slug === slug && item.color === color
            ? { ...item, quantity: Math.min(Math.max(quantity, 1), 99) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(slug: string, color: string) {
    updateCart(cart.filter((item) => !(item.slug === slug && item.color === color)));
  }

  function switchCustomerType(type: CustomerType) {
    if (type === customerType) return;
    setCustomerType(type);
    setSubmitState({ status: "idle", message: "" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cartProducts.length === 0) {
      setSubmitState({ status: "error", message: "El carrito esta vacio." });
      return;
    }

    // El checkout anonimo no requiere sesion; autonomo y empresa si.
    if (customerType !== "anonimo" && !user) {
      router.push("/login?redirect=/carrito");
      return;
    }

    if (!billingAddress.trim()) {
      setSubmitState({ status: "error", message: "La direccion de facturacion es obligatoria." });
      return;
    }

    if (customerType === "empresa" && !user?.nifDni) {
      setSubmitState({ status: "error", message: "Tu cuenta no tiene NIF/CIF registrado. Completa tu perfil primero." });
      return;
    }

    if (customerType === "anonimo" && (!guestName.trim() || !guestPhone.trim() || !guestNif.trim())) {
      setSubmitState({ status: "error", message: "Completa nombre, telefono y NIF/DNI para continuar como anonimo." });
      return;
    }

    if (!acceptedTerms) {
      setSubmitState({ status: "error", message: "Debes aceptar los Términos y Condiciones para continuar." });
      return;
    }

    // Cada combinación slug+color va como una línea independiente en el pedido.
    const items = cartProducts.map(({ item, product }) => ({
      slug: item.slug,
      name: product.name,
      color: item.color,
      description: product.description,
      category: product.category,
      unitPrice: priceToNumber(product.price),
      quantity: item.quantity,
      lineTotal: priceToNumber(product.price) * item.quantity,
    }));

    setSubmitState({ status: "loading", message: "Redirigiendo al pago..." });

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          accountType: customerType,
          billingAddress,
          notes,
          paymentFee,
          deliveryFee,
          ...(customerType === "anonimo"
            ? { guestName, guestEmail, guestPhone, guestNif }
            : {}),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setSubmitState({ status: "error", message: data?.error ?? "No se pudo iniciar el pago." });
        return;
      }

      clearStoredCart();
      window.location.href = data.url;
    } catch {
      setSubmitState({ status: "error", message: "Error de conexion. Intenta de nuevo." });
    }
  }

  return (
    <section className="px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="space-y-4">
          {cartProducts.length === 0 ? (
            <div className="border border-[#e2ddd5] bg-white p-8">
              <h2 className="text-2xl font-semibold">Tu carrito esta vacio</h2>
              <p className="mt-3 leading-7 text-[#6b6259]">
                Abre una ficha de producto y pulsa Reservar look para preparar tu seleccion.
              </p>
              <Link
                href="/coleccion"
                className="mt-6 inline-block bg-[#17130f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#d0513f]"
              >
                Ver coleccion
              </Link>
            </div>
          ) : (
            cartProducts.map(({ item, product }) => {
              const colorOption = product.colors.find((c) => c.name === item.color);
              const lineImage = colorOption?.image ?? product.image;

              return (
                <article
                  key={lineKey(item.slug, item.color)}
                  className="grid gap-4 border border-[#e2ddd5] bg-white p-4 sm:grid-cols-[120px_1fr_auto]"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#ece8df] sm:w-[120px]">
                    <Image src={lineImage} alt={product.name} fill sizes="120px" className="object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d0513f]">
                      {product.category}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">{product.name}</h2>
                    {item.color && (
                      <p className="mt-1 text-sm font-semibold text-[#17130f]">Color: {item.color}</p>
                    )}
                    <p className="mt-2 text-sm text-[#6b6259]">{product.fit}</p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.slug, item.color)}
                      className="mt-5 text-sm font-semibold text-[#d0513f]"
                    >
                      Quitar
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <p className="font-bold text-[#d0513f]">{product.price}</p>
                    <div className="flex items-center border border-[#cfc7bd]">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            setQuantity(item.slug, item.color, 1);
                          } else {
                            const num = Number(value);
                            const validQuantity = Math.max(1, Math.min(99, num || 1));
                            setQuantity(item.slug, item.color, validQuantity);
                          }
                        }}
                        className="h-10 w-full border-none text-center text-sm font-semibold outline-none [&::-webkit-outer-spin-button]:-webkit-appearance-none [&::-webkit-inner-spin-button]:-webkit-appearance-none"
                        style={{ MozAppearance: "textfield" }}
                        aria-label={`Cantidad de ${product.name} en ${item.color}`}
                      />
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <form
          key={customerType}
          onSubmit={handleSubmit}
          className="border border-[#e2ddd5] bg-white p-6 lg:sticky lg:top-28"
        >
          <div className="flex items-end justify-between gap-6 border-b border-[#e2ddd5] pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d0513f]">
                Resumen
              </p>
              <h2 className="mt-2 text-2xl font-semibold">Confirmar pedido</h2>
            </div>
            <p className="text-2xl font-bold text-[#d0513f]">€{total}</p>
          </div>

          <div className="mt-4 space-y-1 border-b border-[#e2ddd5] pb-4 text-xs text-[#6b6259]">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Gastos de gestion (1,4% + 0.25€)</span>
              <span>€{paymentFee.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Entrega</span>
              <span>{deliveryFee === 0 ? "Gratis" : `€${deliveryFee.toFixed(2)}`}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tiempo estimado de entrega</span>
              <span>{SHIPPING_TIME} Dias</span>
            </div>
          </div>

          {cartProducts.length > 0 && (
            <div
              className={`mt-4 rounded-md border px-3 py-3 text-sm ${
                isFreeShipping
                  ? "border-[#4f9b63] bg-[#f3fbf5] text-[#2d6b42]"
                  : "border-[#efb3a8] bg-[#fff4f1] text-[#a13a28]"
              }`}
            >
              {isFreeShipping ? (
                <p>
                  <strong>¡Envío gratis!</strong> Ya cumples con el pedido mínimo de 500€.
                </p>
              ) : (
                <p>
                  <strong>Faltan {remainingForFreeShipping.toFixed(2)}€</strong> para disfrutar del envío gratis con pedidos de 500€ o más.
                </p>
              )}
            </div>
          )}

          {customerType !== "anonimo" && !authLoading && !user && (
            <div className="mt-5 border border-[#efb3a8] bg-[#fff4f1] px-4 py-3 text-sm text-[#a13a28]">
              Debes <Link href="/login?redirect=/carrito" className="font-semibold underline">iniciar sesion</Link> para pagar tu pedido, o elige la opcion Anonimo.
            </div>
          )}

          <div className="mt-5 grid grid-cols-3 gap-2 border-b border-[#e2ddd5] pb-5">
            <button
              type="button"
              onClick={() => switchCustomerType("anonimo")}
              className={`min-h-11 text-sm font-semibold transition ${
                customerType === "anonimo"
                  ? "bg-[#17130f] text-white"
                  : "border border-[#cfc7bd] bg-white text-[#17130f] hover:bg-[#fbfaf7]"
              }`}
            >
              Anonimo
            </button>
            <button
              type="button"
              onClick={() => switchCustomerType("autonomo")}
              className={`min-h-11 text-sm font-semibold transition ${
                customerType === "autonomo"
                  ? "bg-[#17130f] text-white"
                  : "border border-[#cfc7bd] bg-white text-[#17130f] hover:bg-[#fbfaf7]"
              }`}
            >
              Autonomo
            </button>
            <button
              type="button"
              onClick={() => switchCustomerType("empresa")}
              className={`min-h-11 text-sm font-semibold transition ${
                customerType === "empresa"
                  ? "bg-[#17130f] text-white"
                  : "border border-[#cfc7bd] bg-white text-[#17130f] hover:bg-[#fbfaf7]"
              }`}
            >
              Empresa
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            {customerType !== "anonimo" && user && (
              <div className="border border-[#e2ddd5] bg-[#fbfaf7] px-4 py-3 text-sm text-[#6b6259]">
                <p>Comprando como <strong>{user.name}</strong></p>
                {customerType === "empresa" && (
                  <p>NIF/CIF: <strong>{user.nifDni ?? "No registrado"}</strong></p>
                )}
                <p className="mt-1 text-xs text-[#9a9189]">Email de la cuenta (no necesitas rellenarlo): {user.email}</p>
              </div>
            )}

            {customerType === "anonimo" && (
              <>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  minLength={2}
                  className="min-h-12 border border-[#cfc7bd] bg-[#fbfaf7] px-4 outline-none focus:border-[#d0513f]"
                  placeholder="Nombre completo"
                />
                <input
                  value={guestNif}
                  onChange={(e) => setGuestNif(e.target.value.toUpperCase())}
                  required
                  minLength={9}
                  className="min-h-12 border border-[#cfc7bd] bg-[#fbfaf7] px-4 outline-none focus:border-[#d0513f]"
                  placeholder="NIF / DNI"
                />
                <input
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  type="email"
                  className="min-h-12 border border-[#cfc7bd] bg-[#fbfaf7] px-4 outline-none focus:border-[#d0513f]"
                  placeholder="Email (opcional)"
                />
                <input
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  type="tel"
                  required
                  minLength={6}
                  className="min-h-12 border border-[#cfc7bd] bg-[#fbfaf7] px-4 outline-none focus:border-[#d0513f]"
                  placeholder="Telefono"
                />
              </>
            )}

            <input
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              required
              minLength={5}
              className="min-h-12 border border-[#cfc7bd] bg-[#fbfaf7] px-4 outline-none focus:border-[#d0513f]"
              placeholder="Direccion de facturacion"
            />

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-28 border border-[#cfc7bd] bg-[#fbfaf7] px-4 py-3 outline-none focus:border-[#d0513f]"
              placeholder="Talla, fecha, ciudad o cualquier detalle"
            />

            <label className="flex items-start gap-3 text-sm text-[#6b6259]">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#d0513f]"
              />
              <span>
                He leído y acepto los{" "}
                <Link href="/terminos" target="_blank" className="font-semibold text-[#d0513f] underline">
                  Términos y Condiciones
                </Link>{" "}
                de Tanna Moda.
              </span>
            </label>
          </div>

          {submitState.message && (
            <p
              className={`mt-5 border px-4 py-3 text-sm ${
                submitState.status === "error"
                  ? "border-[#efb3a8] bg-[#fff4f1] text-[#a13a28]"
                  : "border-[#d9d3ca] bg-[#fbfaf7] text-[#6b6259]"
              }`}
            >
              {submitState.message}
            </p>
          )}

          <button
            type="submit"
            disabled={submitState.status === "loading" || cartProducts.length === 0 || authLoading || !acceptedTerms}
            className="mt-6 min-h-12 w-full bg-[#d0513f] px-6 text-sm font-semibold text-white transition hover:bg-[#17130f] disabled:cursor-not-allowed disabled:bg-[#cfc7bd]"
          >
            {submitState.status === "loading"
              ? "Redirigiendo..."
              : customerType === "anonimo"
                ? "Ir a pagar"
                : user
                  ? "Ir a pagar"
                  : "Inicia sesion para pagar"}
          </button>
        </form>
      </div>
    </section>
  );
}