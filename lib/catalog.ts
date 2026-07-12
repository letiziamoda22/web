import { productMetaOverrides, rawCodes } from "./catalog.generated";

export type ColorOption = {
  name: string;
  image: string | null; // null = color seleccionable pero sin foto propia
};

export type Product = {
  id: string;
  code: string;
  slug: string;
  name: string;
  price: string;
  image: string;
  gallery: string[];
  colors: ColorOption[];
  Talla: string;
  color: string;
  category: string;
  description: string;
};

type ProductMeta = {
  name: string;
  price: string;
  Talla: string;
  category: string;
  description: string;
  colorOptions?: ReadonlyArray<{
    name: string;
    imageIndex: number | null;
  }>;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildGallery(
  code: string,
  mainExt: string,
  variants: ReadonlyArray<{ index: number; ext: string }>
): string[] {
  return [
    `/fotos/${code}.${mainExt}`,
    ...variants.map((v) => `/fotos/${code}-${v.index}.${v.ext}`),
  ];
}

export const products: Product[] = rawCodes.map(({ code, mainExt, variants }, index) => {
  const meta    = productMetaOverrides[code as keyof typeof productMetaOverrides] as ProductMeta;
  const gallery = buildGallery(code, mainExt, variants);

  // Deduplicamos: si dos colores apuntan a la misma imagen, solo aparece el primero.
  // Los colores con imageIndex null (sin foto) siempre se incluyen.
  const seenIndexes = new Set<number>();
  const colors: ColorOption[] = (meta.colorOptions ?? [])
    .map((c) => ({
      name:  c.name,
      image: c.imageIndex === null ? null : (gallery[c.imageIndex] ?? null),
    }))
    .filter((c) => {
      if (c.image === null) return true; // siempre incluir colores sin foto
      const idx = gallery.indexOf(c.image);
      if (seenIndexes.has(idx)) return false;
      seenIndexes.add(idx);
      return true;
    });

  const slugBase = meta.description !== code ? meta.description : meta.name;
  const slug     = slugify(slugBase) || code.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    id:          String(index + 1).padStart(2, "0"),
    code,
    slug,
    name:        meta.name,
    price:       meta.price,
    image:       gallery[0],
    gallery,
    colors,
    Talla:       meta.Talla,
    color:       colors[0]?.name ?? "Por definir",
    category:    meta.category,
    description: meta.description,
  };
});

export const featuredProducts = products.slice(0, 8);
export const newProducts      = products.slice(8);
export const lookbookProducts = products.slice(-6);

export const categories = [
  "Todo",
  ...Array.from(new Set(products.map((p) => p.category))).sort(),
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
