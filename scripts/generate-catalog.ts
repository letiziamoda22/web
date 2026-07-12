import fs from "fs";
import path from "path";
import Papa from "papaparse";
import sharp from "sharp";

// ══════════════════════════════════════════════════════════════════════════
// MANUAL OVERRIDES — edita aquí cuando la detección automática falla
//
// Formato:
//   "CODIGO": { "Nombre Color CSV": índice_de_imagen }
//
// El índice de imagen es:
//   0  → foto principal  (CODIGO.webp)
//   1  → CODIGO-1.webp
//   2  → CODIGO-2.webp
//   ...
//
// El nombre del color debe coincidir EXACTAMENTE con el del CSV
// (capitalización incluida, tal como aparece en la columna Color).
//
// Ejemplo:
//   "KU986": { "Azul": 0, "Camel": 3, "Amarillo": 4 }
//
// Los códigos que NO están aquí siguen usando detección automática.
// ══════════════════════════════════════════════════════════════════════════
const MANUAL_COLOR_OVERRIDES: Record<string, Record<string, number | null>> = {
  // "KU986":   { "Azul": 0, "Camel": 3, "Amarillo": 4 },
  // "MM239":   { "Rojo": 1, "Azul": 4, "Verde": 7 },
  // "AL233":   { "Azul": 1, "Rojo": 2, "Verde": 3 },
  // "SE5046":  { "Beige": 0, "Chocolate": 3, "Granate": 5, "Verde": 7 },
  //
  // null = color sin foto propia (seleccionable pero no cambia galería):
  // "KU591":   { "Rosa Fuxia": null },
};

// ══════════════════════════════════════════════════════════════════════════

type PhotoInfo = {
  mainExt?: string;
  variants: Map<number, string>;
  extensions: Set<string>;
};

type CsvRow = {
  Nombre?: string;
  Referencia?: string;
  categoria?: string;
  Color?: string;
  Precio?: string;
};

type ColorMeta = {
  name: string;
  imageIndex: number | null;
  pct?: number;
};

type ProductMeta = {
  name: string;
  price: string;
  Talla: string;
  category: string;
  description: string;
  colorOptions: ColorMeta[];
};

type Rgb = [number, number, number];
type PaletteEntry = { rgb: Rgb; count: number };

const csvFile    = path.join(process.cwd(), "data", "KU.csv");
const fotosDir   = path.join(process.cwd(), "public", "fotos");
const outputFile = path.join(process.cwd(), "lib", "catalog.generated.ts");
const fileRegex  = /^([A-Za-z0-9]+(?:-[A-Za-z]+[A-Za-z0-9]*)*)(?:-(\d+))?\.([a-zA-Z0-9]+)$/;

// Puntuación máxima para considerar que una imagen coincide con un color.
// Si el mejor score supera este umbral → imageIndex: null (color sin foto)
const SCORE_MAX = 155;

const colorTargets: Array<[string, Rgb]> = [
  ["azul marino",    [24,  48,  96 ]],
  ["azul oscuro",    [24,  48,  96 ]],
  ["azul turquesa",  [30, 170, 185 ]],
  ["azul claro",     [95, 190, 220 ]],
  ["azul celeste",   [95, 190, 220 ]],
  ["celeste",        [105,200, 225 ]],
  ["verde agua",     [80, 185, 160 ]],
  ["verde oliva",    [95, 115,  55 ]],
  ["verde claro",    [115,185, 100 ]],
  ["amarillo limon", [225,215,  40 ]],
  ["rosa fuxia",     [205, 25, 110 ]],
  ["rosa palo",      [220,160, 155 ]],
  ["fuxia",          [205, 25, 110 ]],
  ["salmon",         [230,125, 105 ]],
  ["turquesa",       [30, 170, 185 ]],
  ["amarillo",       [225,190,  30 ]],
  ["naranja",        [225,105,  35 ]],
  ["morado",         [115, 65, 150 ]],
  ["granate",        [130,  20,  40 ]],
  ["teja",           [185,  75,  50 ]],
  ["chocolate",      [ 90,  45,  20 ]],
  ["marron",         [100,  65,  40 ]],
  ["camel",          [165, 115,  70 ]],
  ["beige",          [210, 185, 155 ]],
  ["blanco",         [238, 235, 225 ]],
  ["negro",          [ 25,  25,  25 ]],
  ["gris",           [135, 135, 130 ]],
  ["lila",           [170, 125, 200 ]],
  ["rojo",           [190,  40,  45 ]],
  ["rosa",           [220, 105, 155 ]],
  ["verde",          [ 55, 135,  80 ]],
  ["azul",           [ 40, 105, 185 ]],
];

// ── Utilidades ─────────────────────────────────────────────────────────────
function normalizeReference(reference: unknown) {
  return String(reference || "").trim().replace(/\.\w+$/, "");
}

function titleCase(value: unknown) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("es")
    .replace(/(^|\s)(\S)/g, (m) => m.toLocaleUpperCase("es"));
}

function normalizeText(value: unknown) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatPrice(value: unknown) {
  const n = parseFloat(String(value || "").trim().replace(",", "."));
  return isNaN(n) ? "€0,00" : `€${n.toFixed(2).replace(".", ",")}`;
}

function colorDistance(a: Rgb, b: Rgb) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
}

function getColorTarget(colorName: string): Rgb | undefined {
  const norm = normalizeText(colorName);
  const hit  = colorTargets
    .filter(([name]) => norm.includes(name))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return hit?.[1];
}

// ── Análisis de paleta ─────────────────────────────────────────────────────
async function detectImagePalette(imagePath: string): Promise<PaletteEntry[]> {
  try {
    const meta   = await sharp(imagePath).metadata();
    const width  = meta.width  ?? 100;
    const height = meta.height ?? 100;
    const cropW  = Math.min(100, width);
    const cropH  = Math.min(100, height);
    const cropX  = Math.max(0, Math.floor((width  - cropW) / 2));
    const cropY  = Math.max(0, Math.floor((height - cropH) / 2));

    const { data, info } = await sharp(imagePath)
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const bins = new Map<string, PaletteEntry>();

    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const off = (y * info.width + x) * info.channels;
        const r = data[off], g = data[off + 1], b = data[off + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max - min;
        const lit = (max + min) / 2;

        if (lit > 242 || (sat < 12 && lit > 55 && lit < 215)) continue;

        const qr  = Math.round(r / 24) * 24;
        const qg  = Math.round(g / 24) * 24;
        const qb  = Math.round(b / 24) * 24;
        const key = `${qr},${qg},${qb}`;
        const bin = bins.get(key) ?? { rgb: [qr, qg, qb] as Rgb, count: 0 };
        bin.count++;
        bins.set(key, bin);
      }
    }

    return Array.from(bins.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 24);
  } catch {
    return [];
  }
}

function scorePalette(palette: PaletteEntry[], target: Rgb | undefined): number {
  if (!target || palette.length === 0) return Infinity;
  return Math.min(
    ...palette.map((e) => colorDistance(e.rgb, target) - Math.log(e.count + 1) * 8)
  );
}

function scoreToSimilarityPct(score: number): number {
  if (!isFinite(score)) return 0;
  return Math.round((1 - Math.min(score, SCORE_MAX) / SCORE_MAX) * 100);
}

// ── Asignación color → imagen ───────────────────────────────────────────────
async function detectColorImageIndexes(
  code: string,
  mainExt: string,
  variants: Array<{ index: number; ext: string }>,
  colorOptions: ColorMeta[]
): Promise<ColorMeta[]> {
  // ── MANUAL OVERRIDE: si el código tiene entrada, usarla directamente ──────
  const manualMap = MANUAL_COLOR_OVERRIDES[code];
  if (manualMap) {
    console.log(`  📌 ${code.padEnd(12)} override manual aplicado`);
    return colorOptions.map((c) => ({
      name:       c.name,
      imageIndex: c.name in manualMap ? manualMap[c.name] : null,
      pct:        c.name in manualMap ? 100 : 0,
    }));
  }

  // ── DETECCIÓN AUTOMÁTICA ──────────────────────────────────────────────────
  if (colorOptions.length === 0) return [];

  const images = [
    { imageIndex: 0, file: path.join(fotosDir, `${code}.${mainExt}`) },
    ...variants.map((v, gi) => ({
      imageIndex: gi + 1,
      file: path.join(fotosDir, `${code}-${v.index}.${v.ext}`),
    })),
  ].filter((img) => fs.existsSync(img.file));

  if (images.length === 0) {
    return colorOptions.map((c) => ({ name: c.name, imageIndex: null, pct: 0 }));
  }

  const palettes = await Promise.all(
    images.map(async (img) => ({
      imageIndex: img.imageIndex,
      palette:    await detectImagePalette(img.file),
    }))
  );

  const targets = colorOptions.map((c) => getColorTarget(c.name));

  // Matriz de scores
  const scoreMatrix = colorOptions.map((_, ci) =>
    palettes.map((p) => ({
      colorIdx: ci,
      imageIdx: p.imageIndex,
      score:    scorePalette(p.palette, targets[ci]),
    }))
  );

  const allPairs = scoreMatrix.flat().sort((a, b) => a.score - b.score);

  const assignedColor = new Set<number>();
  const assignedImage = new Set<number>();
  const result        = new Array<ColorMeta | null>(colorOptions.length).fill(null);

  // Paso 1: asignación voraz — solo pares por debajo del umbral
  for (const pair of allPairs) {
    if (pair.score > SCORE_MAX)           break;
    if (assignedColor.has(pair.colorIdx)) continue;
    if (assignedImage.has(pair.imageIdx)) continue;

    result[pair.colorIdx] = {
      name:       colorOptions[pair.colorIdx].name,
      imageIndex: pair.imageIdx,
      pct:        scoreToSimilarityPct(pair.score),
    };
    assignedColor.add(pair.colorIdx);
    assignedImage.add(pair.imageIdx);
  }

  // Paso 2: colores sin imagen asignada
  for (let ci = 0; ci < colorOptions.length; ci++) {
    if (result[ci] !== null) continue;

    const freeImages = palettes.filter((p) => !assignedImage.has(p.imageIndex));

    if (freeImages.length > 0) {
      // Hay imágenes libres: asigna la más cercana aunque supere el umbral
      const best = freeImages
        .map((p) => ({ imageIndex: p.imageIndex, score: scorePalette(p.palette, targets[ci]) }))
        .sort((a, b) => a.score - b.score)[0];

      result[ci] = {
        name:       colorOptions[ci].name,
        imageIndex: best.imageIndex,
        pct:        scoreToSimilarityPct(best.score),
      };
      assignedImage.add(best.imageIndex);
    } else {
      // No quedan imágenes libres y el color no coincidía → null
      result[ci] = { name: colorOptions[ci].name, imageIndex: null, pct: 0 };
    }
  }

  return result as ColorMeta[];
}

// ── Leer fotos ─────────────────────────────────────────────────────────────
function readPhotoInfo() {
  const codeInfo = new Map<string, PhotoInfo>();

  for (const file of fs.readdirSync(fotosDir)) {
    const match = file.match(fileRegex);
    if (!match) continue;

    const [, code, idxStr, ext] = match;
    const info = codeInfo.get(code) ?? {
      variants:   new Map<number, string>(),
      extensions: new Set<string>(),
    };
    info.extensions.add(ext);

    if (idxStr === undefined) {
      if (!info.mainExt || ext === "webp") info.mainExt = ext;
    } else {
      const idx = Number(idxStr);
      if (!isNaN(idx) && (!info.variants.has(idx) || ext === "webp")) {
        info.variants.set(idx, ext);
      }
    }

    codeInfo.set(code, info);
  }

  return codeInfo;
}

// ── Leer CSV ───────────────────────────────────────────────────────────────
function readCsvMeta() {
  const csv    = fs.readFileSync(csvFile, "utf8");
  const parsed = Papa.parse<CsvRow>(csv, {
    delimiter:       ";",
    header:          true,
    skipEmptyLines:  true,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    throw new Error(
      `No se pudo leer ${csvFile}: ` + parsed.errors.map((e) => e.message).join("; ")
    );
  }

  const metaByCode = new Map<string, ProductMeta>();

  for (const row of parsed.data) {
    const code = normalizeReference(row.Referencia);
    if (!code) continue;

    const category = titleCase(row.categoria) || "Sin categoria";
    const csvName  = titleCase(row.Nombre);
    const color    = titleCase(row.Color);
    const price    = formatPrice(row.Precio);

    const meta =
      metaByCode.get(code) ??
      ({
        name:         [category, csvName].filter(Boolean).join(" "),
        price,
        Talla:        "Free Size",
        category,
        description:  code,
        colorOptions: [],
      } satisfies ProductMeta);

    if (meta.price === "€0,00" && price !== "€0,00") meta.price = price;

    if (color && !meta.colorOptions.some((c) => c.name === color)) {
      meta.colorOptions.push({ name: color, imageIndex: meta.colorOptions.length });
    }

    metaByCode.set(code, meta);
  }

  return metaByCode;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n📸 Leyendo fotos de public/fotos/...");
  const photoInfo = readPhotoInfo();
  console.log(`   ${photoInfo.size} códigos con fotos.`);

  console.log("📄 Leyendo data/KU.csv...");
  const csvMeta = readCsvMeta();
  console.log(`   ${csvMeta.size} productos en el CSV.`);

  const codes   = Array.from(csvMeta.keys())
    .filter((code) => photoInfo.has(code))
    .sort((a, b) => a.localeCompare(b));

  const skipped = Array.from(csvMeta.keys()).filter((c) => !photoInfo.has(c));
  if (skipped.length > 0) {
    console.log(`\n⚠  Sin fotos (ignorados): ${skipped.join(", ")}`);
  }

  const manualCount = Object.keys(MANUAL_COLOR_OVERRIDES).length;
  if (manualCount > 0) {
    console.log(`\n📌 ${manualCount} override(s) manuales activos.`);
  }

  console.log(`\n🎨 Analizando ${codes.length} productos...\n`);

  const rawCodes: Array<{ code: string; mainExt: string; variants: Array<{ index: number; ext: string }> }> = [];
  const productMetaOverrides: Record<string, unknown> = {};
  let nullCount = 0;

  for (const code of codes) {
    const info = photoInfo.get(code)!;
    const meta = csvMeta.get(code)!;

    const mainExt  = info.mainExt ?? Array.from(info.extensions)[0] ?? "webp";
    const variants = Array.from(info.variants.entries())
      .sort(([a], [b]) => a - b)
      .map(([index, ext]) => ({ index, ext }));

    const colorOptions = await detectColorImageIndexes(
      code,
      mainExt,
      variants,
      meta.colorOptions
    );

    const isManual = !!MANUAL_COLOR_OVERRIDES[code];
    const hasNulls = colorOptions.some((c) => c.imageIndex === null);
    if (hasNulls) nullCount++;

    if (!isManual) {
      const summary = colorOptions
        .map((c) =>
          c.imageIndex === null
            ? `${c.name}→[❌]`
            : `${c.name}→[${c.imageIndex}](${c.pct}%)`
        )
        .join(", ");
      console.log(`  ${hasNulls ? "⚠" : "✔"} ${code.padEnd(12)} ${summary}`);
    }

    rawCodes.push({ code, mainExt, variants });
    productMetaOverrides[code] = { ...meta, colorOptions };
  }

  const contents = `// Generado por scripts/generate-catalog.ts — no edites directamente.
// Para actualizar: npx tsx scripts/generate-catalog.ts

export const rawCodes = ${JSON.stringify(rawCodes, null, 2)} as const;

export const productMetaOverrides = ${JSON.stringify(productMetaOverrides, null, 2)} as const;
`;

  fs.writeFileSync(outputFile, contents, "utf8");

  console.log(`\n✅ ${outputFile} generado con ${rawCodes.length} productos.`);
  if (nullCount > 0) {
    console.log(`⚠  ${nullCount} producto(s) con algún color sin foto asignada.`);
    console.log(`   Añádelos a MANUAL_COLOR_OVERRIDES si quieres asignarlos a mano.`);
  }
  console.log();
}

main().catch((err: unknown) => {
  console.error("\n❌ Error:", err);
  process.exit(1);
});
