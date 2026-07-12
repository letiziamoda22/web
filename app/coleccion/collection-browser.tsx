"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/catalog";
import { ProductCard } from "../components";

export function CollectionBrowser({
  products,
  categories,
}: {
  products: Product[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todo");
  const [selectedColor, setSelectedColor] = useState("Todo");

  const colorOptions = useMemo(() => {
    const colors = new Set<string>();

    products.forEach((product) => {
      product.colors.forEach((color) => {
        colors.add(color.name);
      });
    });

    return Array.from(colors).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      if (selectedCategory !== "Todo" && product.category !== selectedCategory) {
        return false;
      }

      if (selectedColor !== "Todo" && !product.colors.some((color) => color.name === selectedColor)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableValues = [
        product.code,
        product.name,
        product.category,
        product.description,
        product.Talla,
        ...product.colors.map((color) => color.name),
      ];

      return searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [products, query, selectedCategory, selectedColor]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor="product-search" className="sr-only">
          Buscar por código, color o tipo
        </label>
        <input
          id="product-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por código, color o tipo"
          className="w-full rounded-md border border-[#d9d3ca] bg-white px-4 py-3 text-sm text-[#17130f] shadow-sm outline-none transition focus:border-[#17130f] focus:ring-2 focus:ring-[#17130f]/10 sm:max-w-xl"
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="min-w-[160px] rounded-md border border-[#d9d3ca] bg-white px-4 py-3 text-sm text-[#17130f] outline-none transition focus:border-[#17130f] focus:ring-2 focus:ring-[#17130f]/10"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={selectedColor}
            onChange={(event) => setSelectedColor(event.target.value)}
            className="min-w-[160px] rounded-md border border-[#d9d3ca] bg-white px-4 py-3 text-sm text-[#17130f] outline-none transition focus:border-[#17130f] focus:ring-2 focus:ring-[#17130f]/10"
          >
            <option value="Todo">Todos los colores</option>
            {colorOptions.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[#7b7168]">
        <span>{filteredProducts.length} producto{filteredProducts.length === 1 ? "" : "s"}</span>
        {selectedCategory !== "Todo" && (
          <span className="rounded-full bg-[#f5f1ec] px-3 py-1">{selectedCategory}</span>
        )}
        {selectedColor !== "Todo" && (
          <span className="rounded-full bg-[#f5f1ec] px-3 py-1">{selectedColor}</span>
        )}
        {query && <span className="rounded-full bg-[#f5f1ec] px-3 py-1">"{query}"</span>}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#d9d3ca] bg-white/80 p-10 text-center text-sm text-[#62584f]">
          No se encontraron prendas con esos criterios. Ajusta el código, color o tipo para ver más resultados.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="opacity-0 animate-fade-up"
              style={{ animationDelay: `${0.25 + (index % 8) * 0.04}s` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
