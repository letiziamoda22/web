// ──────────────────────────────────────────────────────────────────────────
// Catalogo generado a partir de public/fotos/ (codigos reales: AL233, MM239...)
// El archivo SIN "-1, -2, -3" es la foto principal. Los "-N" son fotos extra
// de esa misma prenda (galeria). Si alguna de esas fotos "-N" es en realidad
// OTRO COLOR de la prenda (no solo otro angulo), marcala en `colorNames` del
// producto correspondiente abajo, ej:
//
//   AL233: { ..., colorNames: { 1: "Azul", 3: "Verde" } }
//
// donde la key es el numero del archivo (AL233-1.png -> 1) y el value es el
// nombre del color que se mostrara como boton seleccionable. Las fotos que
// NO esten en colorNames se siguen viendo igual en la galeria, solo que no
// generan un boton de color.
//
// RELLENA los campos marcados "TODO" con el nombre, precio, categoria, etc.
// reales de cada prenda. El sitio funciona ya mismo con los placeholders.
// ──────────────────────────────────────────────────────────────────────────

export type ColorOption = {
  name: string;
  image: string;
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
  mood: string;
  fit: string;
  color: string;
  category: string;
  description: string;
};

type ProductMeta = {
  name: string;
  price: string;
  mood: string;
  fit: string;
  category: string;
  description: string;
  // numero de archivo ("-N") -> nombre de color, solo para los que son color real
  colorNames?: Record<number, string>;
};

// [codigo, extension del archivo principal, cantidad de fotos "-N" en /public/fotos]
const rawCodes: [string, string, number][] = [
  ["KU1085", "png", 2],
  ["KU1067","png", 6],
  ["KU2157","png", 2],
  ["KU2250","png", 4],
  ["KU986","png", 4],
  ["KU2147","png", 3],
  ["SE5046","png", 8],
  ["MC23702","png", 8],
  ["MI9219","png", 2],
  ["MI9185","png", 2],
  ["MI7090","png", 4],
  ["MI9198","png", 6],
  ["M6901","png", 4],
  ["M677431","png", 2],
  ["M661891","png", 2],
  ["M3537","png", 4],
  ["MI9108","png", 3],
  ["SE28949","png", 11],
  ["CY3575","png", 6],

  ["AL233", "png", 3],
  ["AL235", "png", 6],
  ["AL236", "png", 8],
  ["BC1624", "png", 0],
  ["CO1410", "jpg", 1],
  ["CO3051", "jpg", 4],
  ["CO7018", "png", 0],
  ["MA9012", "png", 4],
  ["MM239", "jpg", 9],
  ["MM245", "png", 1],
  ["MM2503", "png", 15],
  ["MM259", "png", 10],
  ["MM265", "png", 0],
  ["MM285", "png", 2],
  ["MM287", "jpg", 11],
  ["MM289", "png", 3],
  ["MM525", "png", 0],
  ["MM701", "png", 8],
  ["MM703", "png", 8],
  ["PL1549", "png", 1],
  ["PL1692", "png", 0],
  ["PL2006", "png", 0],
  ["PL2046", "png", 0],
  ["PL2054", "png", 0],
  ["PL2083", "png", 0],
  ["PL3018", "png", 2],
  ["RA10561", "png", 3],
  ["SA1250", "png", 0],
  ["SA25121", "jpg", 1],
  ["SA26257", "png", 3],
];

// TODO: rellena nombre / precio / mood / fit / categoria / descripcion reales.
// Si una de las fotos "-N" es otro color, agrega colorNames como en el ejemplo de arriba.
const productMeta: Record<string, ProductMeta> = {
  KU1085: { name: "Vestido largo amarillo", price: "€12,00", mood: "", fit: "Free Size", category: "Vestido", description: "KU1085", colorNames: { 0: "Amarillo"} },
  KU1067: { name: "Vestido corto solido", price: "€10,00", mood: "", fit: "Free Size", category: "Vestido corto", description: "KU1067", colorNames: { 0: "Amarillo", 3: "azul", 5 : "azul oscuro" } },
  KU2157: { name: "Vestido corto bordeado", price: "€12,00", mood: "", fit: "Free Size", category: "Vestido", description: "KU2157", colorNames: { 0: "Blanco" } },
  KU2250: { name: "Vestido largo con flores", price: "€10,00", mood: "", fit: "Free Size", category: "Vestido corto", description: "KU2250", colorNames: { 0: "Amarillo", 3: "azul"} },
  KU986:  { name: "Vestido largo liso", price: "€10,00", mood: "", fit: "Free Size", category: "Vestido", description: "KU986", colorNames: { 0: "Azul", 3: "amarillo" } },
  KU2147 :{ name: "Vestido corto con bordeado", price: "€10,00", mood: "", fit: "Free Size", category: "Vestido corto", description: "KU2147", colorNames: { 0: "blanco"} },
  SE5046: { name: "Vestido largo con liso", price: "€9,80", mood: "", fit: "Free Size", category: "Vestido", description: "SE5046", colorNames: { 0: "camel",3:"marron",5:"Rojo",7:"Amarillo"} },
  MC23702:{ name: "Vestido largo por capas", price: "€13,50", mood: "", fit: "Free Size", category: "Vestido corto", description: "MC23702", colorNames: { 0: "Marron", 3: "Verde",5:"Naranja",7:"Morado" } },
  MI9219: { name: "Vestido largo multicolor por capas", price: "€9,00", mood: "", fit: "Free Size", category: "Vestido", description: "MI9219", colorNames: { 0: "Multicolor" } },
  MI9185: { name: "camisa de tirantes solida", price: "€9,00", mood: "", fit: "Free Size", category: "Vestido corto", description: "MI9185", colorNames: { 0:"beige" } },
  MI7090: { name: "camisa de tirantes por capas", price: "€7,50", mood: "", fit: "Free Size", category: "Vestido", description: "MI7090", colorNames: { 0: "beige", 3: "marron" } },
  MI9198: { name: "Falda de rallas por capas", price: "€15,90", mood: "", fit: "Free Size", category: "Vestido corto", description: "MI9198", colorNames: { 0: "Azul", 3: "verde",5:"Rosa" } },
  M6901:  { name: "Vestido largo aireado", price: "€18,90", mood: "", fit: "Free Size", category: "Vestido corto", description: "M6901", colorNames: { 0: "blanco", 3: "Morado" } },
  M677431:{ name: "Vestido largo solido", price: "€13,50", mood: "", fit: "Free Size", category: "Vestido", description: "M677431", colorNames: { 0: "Amarillo"} },
  M661891:{ name: "Vestido largo solido por capas", price: "€12,50", mood: "", fit: "Free Size", category: "Vestido corto", description: "M661891", colorNames: { 0: "Amarillo"} },
  M3537:  { name: "Vestido largo solido aireado", price: "€13,50", mood: "", fit: "Free Size", category: "Vestido", description: "M3537", colorNames: { 0: "blanco", 3: "Morado" } },
  MI9108: { name: "falda con flores", price: "€15,90", mood: "", fit: "Free Size", category: "Vestido corto", description: "MI9108", colorNames: { 0: "Multicolor"} },
  SE28949:{ name: "Vestido largo estilo acordeon", price: "€18,50", mood: "", fit: "Free Size", category: "Vestido", description: "SE28949", colorNames: { 0: "Verde ", 4: "Rojo",7:"Blanco",10:"Granate" } },
  CY3575: { name: "Vestido corto con estampado bicolor", price: "€14,90", mood: "", fit: "Free Size", category: "Vestido corto", description: "CY3575", colorNames: { 0: "Rojo", 3: "Blanco",5:"Azul" } },
  AL235:  { name: "Vestido semi-largo con estampado", price: "€16,90", mood: "", fit: "Free Size", category: "Vestido corto", description: "AL235", colorNames: { 1: "Azul", 2: "Verde",4: "Camel",5:"Rojo",6:"Negro" }},
  AL233:  { name: "Vestido corto de peces", price: "€12,50", mood: "", fit: "Free Size", category: "Vestido corto", description: "AL233", colorNames: { 1: "Azul",2: "Rojo", 3: "Verde" } },
  AL236:  { name: "Kaftan con estampado", price: "€15,90", mood: "", fit: "Free Size", category: "Vestido", description: "AL236", colorNames: { 1: "Azul", 2: "Rojo",3:"Camel",5:"Azul Marino",6:"Negro",7:"Rojo Estampado 2",8 :"Azul Estampado 2" } },
  BC1624: { name: "Vestido corto con rosas", price: "€12,90", mood:"", fit:"Free Size", category: "Vestido corto", description: "BC1624", colorNames: { 0: "Rosa" } },
  CO1410: { name: "Vestido con palmeras", price: "€49,00", mood:"", fit:"Free Size", category: "Vestido", description: "CO1410", colorNames: { 0: "Blanco" }},
  CO3051: { name: "Vestido con degradado", price: "€10,50", mood:"", fit:"Free Size", category: "Vestido", description: "CO3051", colorNames: { 1: "Azul",2: "Rojo", 3: "Naranja",4:"Verde" } },
  CO7018: { name: "Vestido corto colorido", price: "€19,50", mood:"", fit:"Free Size", category: "Vestido corto", description: "CO7018", colorNames: { 1: "Blanco" } },
  MA9012: { name: "Vestido de tirantes por capas", price: "€15,50", mood:"", fit:"Free Size", category: "Vestido", description: "MA9012", colorNames: { 1: "Rosa",2:"Verde agua",3:"Camel",4:"Amarillo" }},
  MM239:  { name: "Kimono con estampado", price: "€16,90", mood: "", fit: "Free Size", category: "Kimono", description: "MM239", colorNames: { 1: "Rojo", 4: "Azul",7:"Verde" }},
  MM245:  { name: "kaftan con flores", price: "€16,90", mood: "", fit: "Free Size", category: "Kimono", description: "MM245", colorNames: { 0: "Rojo", 1: "Azul" }},
  MM2503: { name: "conjunto de estampado por capas", price: "€13,90", mood:"", fit:"Free Size", category: "Vestido", description: "MM2503", colorNames: { 1: "Celeste", 4: "Azul",8:"Rojo",12:"Marron" } },
  MM259:  { name: "Vestido de tirantes con estampados", price: "€15,90", mood: "", fit: "Free Size", category: "Vestido", description: "MM259", colorNames: { 1: "Azul", 2: "Verde",3:"Verde Claro",4:"Rojo",5:"Rojo-Azul",6:"Rosa",7:"Azul Oscuro",8:"Azul Marino",9:"Azul Marino 2",10:"Camel"}},
  MM265:  { name: "Vestido con estapado multicolor", price: "€15,90", mood: "", fit: "Free Size", category: "Vestido", description: "MM265", colorNames: { 0: "Multicolor" } },
  MM285:  { name: "vestido corto con estampado", price: "€12,90", mood: "", fit: "Free Size", category: "Vestido", description: "MM285", colorNames: { 1: "Verde", 2: "Rojo" } },
  MM287:  { name: "Kimono con flores ", price: "€14,90", mood: "", fit: "Free Size", category: "Kimono", description: "MM287", colorNames: { 1: "Verde", 2: "Verde flores",5:"Rojo",8:"Azul claro",9:"Azul flores" } },
  MM289:  { name: "Kimono con estampado", price: "€15,90", mood: "", fit: "Free Size", category: "Vestido", description: "MM289", colorNames: { 0: "Verde", 1: "Azul" } },
  MM525:  { name: "Vestido por capas", price: "€22,50", mood: "", fit: "Free Size", category: "Vestido", description: "MM525", colorNames: { 0: "Blanco"} } ,
  MM701:  { name: "Falda con Estampado", price: "€15,90", mood: "", fit: "Free Size", category: "Falda", description: "MM701", colorNames: { 0: "Verde"}  },
  PL1549: { name: "falda ligera unicolor", price: "€12,50", mood:"", fit:"Free Size", category: "Falda", description: "PL1549", colorNames: { 0: "Azul", 1: "Gris"  } },
  MM703:  { name: "falda con estampado por capas", price: "€15,90", mood: "", fit: "Free Size", category: "Falda", description: "MM703", colorNames: { 1: "Celeste", 3: "Marron",5:"Rojo",7:"Azul"  }},
  PL1692: { name: "Blusa ligera ventilada", price: "€14,50 ", mood:"", fit: "Free Size", category: "Blusa", description: "PL1692", colorNames: { 0: "Azul"} } ,
  PL2006: { name: "blusa ligera solida", price: "€11,50", mood: "", fit:"Free Size", category: "Blusa", description: "PL2006", colorNames: { 0: "Verde" }  },
  PL2046: { name: "blusa ligera aireada", price: "€9,50", mood:  "", fit: "Free Size", category: "Blusa", description: "PL2046", colorNames: { 0: "Blanco" }  },
  PL2054: { name: "vestido largo con estampado", price: "€14,50", mood: "", fit:"Free Size", category: "Vestido", description: "PL2054", colorNames: { 0: "Morado" }  },
  PL2083: { name: "vestido con estampado", price: "€14,50", mood: "", fit:"Free Size", category: "Vestido", description: "PL2083", colorNames: { 0: "verde" }  },
  PL3018: { name: "chaleco corto unicolor", price: "€13,50", mood: "", fit:"Free Size", category: "Vestido corto", description: "PL3018", colorNames: { 1: "Azul", 2: "Rosa" } },
  RA10561:{ name: "vestido lago flores", price: "€12,50", mood: "", fit: "Free Size", category: "Vestido", description: "RA10561", colorNames: { 0: "Rosa", 1: "Azul",2:"Naranja",3:"Verde" } } ,
  SA1250: { name: "vestido de tirantes ventilado por capas", price: "€12,50", mood: "", fit: "Free Size", category: "Vestido", description: "SA1250", colorNames: { 0: "Blanco"}  },
  SA25121:{ name: "mono con estampado", price: "€9,80", mood:"", fit:"Free Size", category: "Mono", description: "SA25121", colorNames: { 1: "Azul" }  },
  SA26257:{ name: "Vestido de tirantes con naturaleza", price: "€13,95", mood: "", fit: "Free Size", category: "Vestido", description: "SA26257", colorNames: { 0: "Naranja", 1: "Rosa",2:"Verde",3:"Azul" }  }
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildGallery(code: string, mainExt: string, variantCount: number) {
  const gallery = [`/fotos/${code}.${mainExt}`];
  for (let i = 1; i <= variantCount; i++) {
    gallery.push(`/fotos/${code}-${i}.png`);
  }
  return gallery;
}

export const products: Product[] = rawCodes.map(([code, mainExt, variantCount], index) => {
  const meta = productMeta[code];
  const gallery = buildGallery(code, mainExt, variantCount);

  const colors: ColorOption[] = Object.entries(meta.colorNames ?? {}).map(([idxStr, colorName]) => {
    const idx = Number(idxStr);
    const image = idx === 0 ? gallery[0] : `/fotos/${code}-${idx}.png`;
    return { name: colorName, image };
  });

  const baseSlug = slugify(meta.name);

  return {
    id: String(index + 1).padStart(2, "0"),
    code,
    slug: baseSlug || code.toLowerCase(),
    name: meta.name,
    price: meta.price,
    image: gallery[0],
    gallery,
    colors,
    mood: meta.mood,
    fit: meta.fit,
    color: colors[0]?.name ?? "Por definir",
    category: meta.category,
    description: meta.description,
  };
});

export const featuredProducts = products.slice(0, 8);
export const newProducts = products.slice(8);
export const lookbookProducts = products.slice(-6);

export const categories = ["Todo", ...Array.from(new Set(products.map((product) => product.category)))];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}