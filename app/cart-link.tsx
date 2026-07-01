"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredCart } from "./add-to-cart-button";

function getCartCount() {
  return getStoredCart().reduce((total, item) => total + item.quantity, 0);
}

export function CartLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function syncCount() {
      setCount(getCartCount());
    }

    syncCount();
    window.addEventListener("storage", syncCount);
    window.addEventListener("tanna-cart-updated", syncCount);

    return () => {
      window.removeEventListener("storage", syncCount);
      window.removeEventListener("tanna-cart-updated", syncCount);
    };
  }, []);

  return (
    <Link
      href="/carrito"
      className="border border-white/35 px-4 py-2 text-sm font-medium transition hover:border-white hover:bg-white hover:text-[#17130f]"
    >
      Carrito{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
