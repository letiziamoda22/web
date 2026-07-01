"use client";

import Image from "next/image";
import type { ColorOption } from "@/lib/catalog";

export function ProductGallery({
  productName,
  images,
  colors,
  index,
  onIndexChange,
}: {
  productName: string;
  images: string[];
  colors: ColorOption[];
  index: number;
  onIndexChange: (index: number) => void;
}) {
  const goTo = (newIndex: number) => {
    const total = images.length;
    onIndexChange(((newIndex % total) + total) % total);
  };

  const selectColor = (image: string) => {
    const found = images.indexOf(image);
    if (found !== -1) onIndexChange(found);
  };

  return (
    <div>
      <div className="group relative aspect-[3/4] overflow-hidden bg-[#ece8df]">
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((image, i) => (
            <div key={image} className="relative h-full w-full shrink-0">
              <Image
                src={image}
                alt={productName}
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white opacity-50 transition hover:opacity-100"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="drop-shadow-sm">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white opacity-50 transition hover:opacity-100"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="drop-shadow-sm">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      {colors.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {colors.map((option) => {
            const active = images[index] === option.image;
            return (
              <button
                key={option.image}
                type="button"
                onClick={() => selectColor(option.image)}
                className={`border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "border-[#17130f] bg-[#17130f] text-white"
                    : "border-[#d9d3ca] bg-white hover:border-[#17130f]"
                }`}
              >
                {option.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}