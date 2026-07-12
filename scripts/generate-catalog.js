/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * generate-catalog.js
 *
 * Lee data/KU.csv y public/fotos/ y genera lib/catalog.generated.ts.
 *
 * Uso:
 *   node scripts/generate-catalog.js
 *
 * Algoritmo de asignación color → imagen:
 *   1. Calcula paleta de cada imagen (análisis de píxeles con sharp).
 *   2. Puntúa cada par (color CSV, imagen) según distancia de color.
 *   3. Asignación voraz ordenada por puntuación: el mejor par sin conflicto
 *      se asigna primero.
 *   4. Si hay más colores que imágenes, los colores sin imagen propia
 *      comparten la imagen más cercana disponible.
 *   5. Si una imagen no existe en disco, se excluye sin romper el proceso.
 */

const fs   = require("fs");
const path = require("path");
const Papa = require("papaparse");
const sharp = require("sharp");

// ── Rutas ──────────────────────────────────────────────────────────────────
const csvFile    = path.join(process.cwd(), "data", "KU.csv");
const fotosDir   = path.join(process.cwd(), "public", "fotos");
const outputFile = path.join(process.cwd(), "lib", "catalog.generated.ts");

// ── Regex para detectar fotos ──────────────────────────────────────────────
// Acepta:  CODE.ext  y  CODE-N.ext
// No acepta nombres con guión en el código base (CODE-NAME.ext)
const fileRegex = /^([A-Za-z0-9]+(?:-[A-Za-z]+[A-Za-z0-9]*)*)(?:-(\d+))?\.([a-zA-Z0-9]+)$/;

// ── Tabla de colores de referencia (nombre normalizado → RGB) ──────────────
// Ordena de más específico a más genérico para evitar falsos positivos.
const colorTargets = [
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
function normalizeReference(reference) {
  return String(reference || "")
    .trim()
    .replace(/\.\w+$/, "");
}

function titleCase(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("es")
    .replace(/(^|\s)(\S)/g, (m) => m.toLocaleUpperCase("es"));
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatPrice(value) {
  const n = parseFloat(String(value || "").trim().replace(",", "."));
  return isNaN(n) ? "€0,00" : `€${n.toFixed(2).replace(".", ",")}`;
}

// Distancia euclidiana ponderada (percepción humana: verde pesa más)
function colorDistance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
}

function getColorTarget(colorName) {
  const norm = normalizeText(colorName);
  // Busca la coincidencia más larga primero (evita que "azul" coincida antes que "azul marino")
  const hit = colorTargets
    .filter(([name]) => norm.includes(name))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return hit ? hit[1] : null;
}

// ── Análisis de paleta de una imagen ──────────────────────────────────────
async function detectImagePalette(imagePath) {
  try {
    const size = 100;
    const base = sharp(imagePath).removeAlpha().raw();
    const meta = await sharp(imagePath).metadata();
    const width = meta.width ?? size;
    const height = meta.height ?? size;

    // crop centrado 100x100 (sin escalar): si la imagen es más pequeña, se recorta el área disponible
    const cropW = Math.min(size, width);
    const cropH = Math.min(size, height);
    const cropX = Math.max(0, Math.floor((width - cropW) / 2));
    const cropY = Math.max(0, Math.floor((height - cropH) / 2));

    const { data, info } = await sharp(imagePath)
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });


    const bins   = new Map();
    const minX = 0;
    const maxX = info.width;
    const minY = 0;
    const maxY = info.height;


    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        const off = (y * info.width + x) * info.channels;
        const r = data[off], g = data[off + 1], b = data[off + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max - min;
        const lit = (max + min) / 2;

        // Excluye píxeles muy claros (fondo blanco) y grises neutros
        if (lit > 242 || (sat < 12 && lit > 55 && lit < 215)) continue;

        const qr = Math.round(r / 24) * 24;
        const qg = Math.round(g / 24) * 24;
        const qb = Math.round(b / 24) * 24;
        const key = `${qr},${qg},${qb}`;
        const bin = bins.get(key) || { rgb: [qr, qg, qb], count: 0 };
        bin.count++;
        bins.set(key, bin);
      }
    }

    return Array.from(bins.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 24);
  } catch {
    return []; // imagen corrupta o no encontrada
  }
}

function scorePalette(palette, target) {
  if (!target || palette.length === 0) return Infinity;
  return Math.min(
    ...palette.map((e) => colorDistance(e.rgb, target) - Math.log(e.count + 1) * 8)
  );
}

// Convierte el score interno (distancia ponderada) a un % aproximado.
// Score menor => más parecido. Fórmula empírica para debug.
function scoreToSimilarityPct(score) {
  if (!isFinite(score)) return 0;
  const s = Math.max(0, Math.min(SCORE_FALLBACK, score));
  return Math.round((1 - s / SCORE_FALLBACK) * 100);
}


// ── Asignación color → imagen (algoritmo mejorado) ─────────────────────────
//
// 1. Construye una matriz de puntuaciones (colores × imágenes).
// 2. Ordena todos los pares por puntuación ascendente.
// 3. Asignación voraz: toma el mejor par, marca color e imagen como usados.
// 4. Colores sin imagen propia (más colores que imágenes): comparte la imagen
//    más cercana de las ya asignadas.
// 5. Si la puntuación supera SCORE_FALLBACK (color y foto muy dispares),
//    comparte la imagen de posición más próxima en vez de asignar una foto
//    claramente incorrecta.
//
const SCORE_FALLBACK = 160; // distancia máxima antes de compartir imagen

async function assignColorsToImages(code, mainExt, variants, colorOptions) {
  if (colorOptions.length === 0) return [];

  // Construir lista de imágenes disponibles en disco
  const images = [
    { imageIndex: 0, file: path.join(fotosDir, `${code}.${mainExt}`) },
    ...variants.map((v, gi) => ({
      imageIndex: gi + 1,
      file: path.join(fotosDir, `${code}-${v.index}.${v.ext}`),
    })),
  ].filter((img) => fs.existsSync(img.file));

  if (images.length === 0) {
    // Sin fotos: devuelve todos los colores apuntando al índice 0 (placeholder)
    return colorOptions.map((c) => ({ name: c.name, imageIndex: 0 }));
  }

  // Extraer paletas de todas las imágenes disponibles
  const palettes = await Promise.all(
    images.map(async (img) => ({
      imageIndex: img.imageIndex,
      palette: await detectImagePalette(img.file),
    }))
  );

  // Construir matriz de puntuaciones [colorIdx][imageIdx] = score
  const targets = colorOptions.map((c) => getColorTarget(c.name));
  const scoreMatrix = colorOptions.map((_, ci) =>
    palettes.map((p) => ({
      colorIdx: ci,
      imageIdx: p.imageIndex,
      score: scorePalette(p.palette, targets[ci]),
    }))
  );

  // Aplanar y ordenar por puntuación ascendente
  const allPairs = scoreMatrix.flat().sort((a, b) => a.score - b.score);

  const assignedColor = new Set();
  const assignedImage = new Set();
    const result = new Array(colorOptions.length).fill(null);

    // Paso 1: asignación voraz (mejor par primero, sin repetir color ni imagen)

  for (const pair of allPairs) {
    if (assignedColor.has(pair.colorIdx)) continue;
    if (assignedImage.has(pair.imageIdx)) continue;
    if (!isFinite(pair.score)) continue;
    if (pair.score > SCORE_FALLBACK) break; // todos los pares restantes son malos

    result[pair.colorIdx] = {
      name: colorOptions[pair.colorIdx].name,
      imageIndex: pair.imageIdx,
      pct: scoreToSimilarityPct(pair.score),
    };

    assignedColor.add(pair.colorIdx);
    assignedImage.add(pair.imageIdx);
  }

  // Paso 2: colores sin imagen asignada (más colores que fotos, o scores malos)

  // Comparte la imagen con mejor puntuación para ese color (aunque ya esté usada)
  for (let ci = 0; ci < colorOptions.length; ci++) {
    if (result[ci] !== null) continue;

    const best = palettes
      .map((p) => ({ imageIndex: p.imageIndex, score: scorePalette(p.palette, targets[ci]) }))
      .sort((a, b) => a.score - b.score)[0];

    const imageIndex = best && isFinite(best.score) ? best.imageIndex : 0;
    result[ci] = {
      name: colorOptions[ci].name,
      imageIndex,
      pct: best && isFinite(best.score) ? scoreToSimilarityPct(best.score) : 0,
    };

  }

  return result;
}


// ── Leer fotos de public/fotos/ ────────────────────────────────────────────
function readPhotoInfo() {
  const codeInfo = new Map();

  for (const file of fs.readdirSync(fotosDir)) {
    const match = file.match(fileRegex);
    if (!match) continue;

    const [, code, idxStr, ext] = match;
    const info = codeInfo.get(code) || {
      mainExt: undefined,
      variants: new Map(),
      extensions: new Set(),
    };
    info.extensions.add(ext);

    if (idxStr === undefined) {
      // Foto principal: preferir webp sobre otros formatos
      if (!info.mainExt || ext === "webp") info.mainExt = ext;
    } else {
      const idx = Number(idxStr);
      if (!isNaN(idx)) {
        // Si ya hay esa variante, preferir webp
        if (!info.variants.has(idx) || ext === "webp") {
          info.variants.set(idx, ext);
        }
      }
    }

    codeInfo.set(code, info);
  }

  return codeInfo;
}

// ── Leer CSV ───────────────────────────────────────────────────────────────
function readCsvMeta() {
  const csv = fs.readFileSync(csvFile, "utf8");
  const parsed = Papa.parse(csv, {
    delimiter: ";",
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    throw new Error(
      `No se pudo leer ${csvFile}: ` + parsed.errors.map((e) => e.message).join("; ")
    );
  }

  const metaByCode = new Map();

  for (const row of parsed.data) {
    const code = normalizeReference(row.Referencia);
    if (!code) continue;

    const category = titleCase(row.categoria || row.Categoria || row.CATEGORIA || "") || "Sin categoria";
    const csvName  = titleCase(row.Nombre || row.NOMBRE || "");
    const color    = titleCase(row.Color  || row.COLOR  || "");
    const price    = formatPrice(row.Precio || row["Precio A"] || row.PRECIO || "");

    if (!metaByCode.has(code)) {
      metaByCode.set(code, {
        name:         [category, csvName].filter(Boolean).join(" "),
        price,
        Talla:        "Free Size",
        category,
        description:  code,
        colorOptions: [],
      });
    }

    const meta = metaByCode.get(code);

    // Actualiza precio si faltaba
    if (meta.price === "€0,00" && price !== "€0,00") meta.price = price;

    // Añade el color si no está ya (sin duplicados)
    if (color && !meta.colorOptions.some((c) => c.name === color)) {
      meta.colorOptions.push({ name: color, imageIndex: meta.colorOptions.length });
    }
  }

  return metaByCode;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n📸 Leyendo fotos de public/fotos/...");
  const photoInfo = readPhotoInfo();
  console.log(`   ${photoInfo.size} códigos con fotos encontrados.`);

  console.log("📄 Leyendo data/KU.csv...");
  const csvMeta = readCsvMeta();
  console.log(`   ${csvMeta.size} productos en el CSV.`);

  // Solo procesa productos que tienen TANTO fotos COMO entrada en el CSV
  const codes = Array.from(csvMeta.keys())
    .filter((code) => photoInfo.has(code))
    .sort((a, b) => a.localeCompare(b));

  const skipped = Array.from(csvMeta.keys()).filter((c) => !photoInfo.has(c));
  if (skipped.length > 0) {
    console.log(`\n⚠ ${skipped.length} productos en CSV sin fotos (ignorados):`);
    console.log("  " + skipped.join(", "));
  }

  console.log(`\n🎨 Analizando colores de ${codes.length} productos...\n`);

  const rawCodes = [];
  const productMetaOverrides = {};
  let warnings = 0;

  for (const code of codes) {
    const info = photoInfo.get(code);
    const meta = csvMeta.get(code);

    const mainExt  = info.mainExt || Array.from(info.extensions)[0] || "webp";
    const variants = Array.from(info.variants.entries())
      .sort(([a], [b]) => a - b)
      .map(([index, ext]) => ({ index, ext }));

    const totalImages = 1 + variants.length;
    const totalColors = meta.colorOptions.length;

    // Detectar posibles problemas
    if (totalColors > totalImages) {
      console.log(
        `  ⚠ ${code}: ${totalColors} colores pero solo ${totalImages} foto(s) → se compartirán imágenes`
      );
      warnings++;
    }

    const colorOptions = await assignColorsToImages(
      code,
      mainExt,
      variants,
      meta.colorOptions
    );

    // Log del resultado con % de similitud aproximado
    const colorSummary = colorOptions
      .map((c) => `${c.name}→[${c.imageIndex}] (${c.pct ?? 0}%)`)
      .join(", ");


    console.log(`  ✔ ${code.padEnd(12)} ${colorSummary}`);






    rawCodes.push({ code, mainExt, variants });
    productMetaOverrides[code] = { ...meta, colorOptions };
  }

  // Generar el archivo TypeScript
  const contents = `// Este archivo es generado por scripts/generate-catalog.js
// No lo edites directamente — ejecuta: node scripts/generate-catalog.js

export const rawCodes = ${JSON.stringify(rawCodes, null, 2)} as const;

export const productMetaOverrides = ${JSON.stringify(productMetaOverrides, null, 2)} as const;
`;

  fs.writeFileSync(outputFile, contents, "utf8");

  console.log(`\n✅ Generado: ${outputFile}`);
  console.log(`   ${rawCodes.length} productos con fotos + CSV.`);
  if (warnings > 0) {
    console.log(`   ${warnings} advertencias de colores compartidos (revisa el log de arriba).`);
  }
  console.log();
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message || err);
  process.exit(1);
});