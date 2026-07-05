/**
 * convert-to-webp.mjs
 *
 * Convierte todas las imágenes PNG y JPG de public/fotos/ a WebP.
 * Las originales se mantienen intactas — solo se añaden los .webp al lado.
 *
 * Uso:
 *   node scripts/convert-to-webp.mjs
 *
 * Opciones:
 *   --quality=85     Calidad WebP (1-100, default 85)
 *   --delete-originals  Borra los PNG/JPG originales tras convertir
 *   --force          Reconvierte aunque el .webp ya exista
 *
 * Ejemplos:
 *   node scripts/convert-to-webp.mjs
 *   node scripts/convert-to-webp.mjs --quality=90
 *   node scripts/convert-to-webp.mjs --delete-originals
 *   node scripts/convert-to-webp.mjs --force --quality=80
 *
 * Requisitos:
 *   sharp  (ya viene incluido con Next.js — no necesitas instalarlo)
 *   Si por algún motivo no está: npm install sharp
 */

import { readdir, stat, unlink } from "fs/promises";
import { join, extname, basename } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// ------------------------------------------------------------------
// Argumentos de línea de comandos
// ------------------------------------------------------------------
const args = process.argv.slice(2);

function getArg(name, defaultValue) {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  if (match) return match.split("=")[1];
  return defaultValue;
}

const QUALITY = Number(getArg("quality", "85"));
const DELETE_ORIGINALS = args.includes("--delete-originals");
const FORCE = args.includes("--force");

// ------------------------------------------------------------------
// Carpeta de imágenes (relativa a la raíz del proyecto)
// ------------------------------------------------------------------
const INPUT_DIR = join(process.cwd(), "public", "fotos");
const EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);

// ------------------------------------------------------------------
// Utilidades de consola con color
// ------------------------------------------------------------------
const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

function log(icon, color, msg) {
  console.log(`${color}${icon}${C.reset} ${msg}`);
}

// ------------------------------------------------------------------
// Función principal
// ------------------------------------------------------------------
async function main() {
  // Cargar sharp (viene con Next.js)
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.error(
      `${C.red}✖ No se encontró 'sharp'. Instálalo con: npm install sharp${C.reset}`
    );
    process.exit(1);
  }

  console.log(`\n${C.bold}Tanna Moda — Conversor PNG/JPG → WebP${C.reset}`);
  console.log(`${C.dim}Carpeta: ${INPUT_DIR}${C.reset}`);
  console.log(`${C.dim}Calidad: ${QUALITY} | Borrar originales: ${DELETE_ORIGINALS} | Forzar: ${FORCE}${C.reset}\n`);

  // Verificar que la carpeta existe
  try {
    await stat(INPUT_DIR);
  } catch {
    console.error(`${C.red}✖ No se encontró la carpeta: ${INPUT_DIR}${C.reset}`);
    console.error(`  Asegúrate de ejecutar el script desde la raíz del proyecto.`);
    process.exit(1);
  }

  // Listar archivos
  const entries = await readdir(INPUT_DIR);
  const images = entries.filter((f) => EXTENSIONS.has(extname(f).toLowerCase()));

  if (images.length === 0) {
    log("⚠", C.yellow, "No se encontraron imágenes PNG/JPG en la carpeta.");
    return;
  }

  console.log(`Encontradas ${C.bold}${images.length}${C.reset} imágenes.\n`);

  // Estadísticas
  let converted = 0;
  let skipped = 0;
  let errors = 0;
  let savedBytes = 0;

  for (const filename of images) {
    const inputPath = join(INPUT_DIR, filename);
    const webpName = basename(filename, extname(filename)) + ".webp";
    const outputPath = join(INPUT_DIR, webpName);

    // Si ya existe el .webp y no se fuerza, saltar
    try {
      await stat(outputPath);
      if (!FORCE) {
        log("·", C.dim, `${filename} → ya existe (usa --force para reconvertir)`);
        skipped++;
        continue;
      }
    } catch {
      // No existe, continuar con la conversión
    }

    try {
      // Tamaño original
      const originalStat = await stat(inputPath);
      const originalSize = originalStat.size;

      // Convertir
      await sharp(inputPath)
        .webp({ quality: QUALITY, effort: 6 })
        .toFile(outputPath);

      // Tamaño resultante
      const webpStat = await stat(outputPath);
      const webpSize = webpStat.size;
      const saved = originalSize - webpSize;
      const savedPct = ((saved / originalSize) * 100).toFixed(1);
      savedBytes += Math.max(0, saved);

      const sizeInfo =
        saved > 0
          ? `${C.green}−${formatBytes(saved)} (${savedPct}%)${C.reset}`
          : `${C.yellow}+${formatBytes(Math.abs(saved))} (más pesado)${C.reset}`;

      log("✔", C.green, `${filename} → ${webpName}  ${sizeInfo}`);
      converted++;

      // Borrar original si se pidió
      if (DELETE_ORIGINALS) {
        await unlink(inputPath);
        log("🗑", C.dim, `  Eliminado: ${filename}`);
      }
    } catch (err) {
      log("✖", C.red, `Error convirtiendo ${filename}: ${err.message}`);
      errors++;
    }
  }

  // Resumen final
  console.log(`\n${C.bold}─── Resumen ───────────────────────────────${C.reset}`);
  console.log(`${C.green}✔ Convertidas:${C.reset}   ${converted}`);
  console.log(`${C.dim}· Saltadas:${C.reset}      ${skipped}`);
  if (errors > 0) console.log(`${C.red}✖ Errores:${C.reset}       ${errors}`);
  if (savedBytes > 0) {
    console.log(`${C.cyan}↓ Espacio ahorrado: ${formatBytes(savedBytes)}${C.reset}`);
  }
  console.log();

  if (DELETE_ORIGINALS && converted > 0) {
    console.log(
      `${C.yellow}⚠ Los originales PNG/JPG han sido eliminados.${C.reset}`
    );
    console.log(
      `  Recuerda actualizar las extensiones en catalog.ts si es necesario.`
    );
  } else if (converted > 0) {
    console.log(`${C.dim}Los originales PNG/JPG se han mantenido intactos.${C.reset}`);
  }
}

// ------------------------------------------------------------------
// Utilidad: formatear bytes legibles
// ------------------------------------------------------------------
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

main().catch((err) => {
  console.error(`\n${C.red}Error fatal:${C.reset}`, err.message);
  process.exit(1);
});
