# Tanna Moda — Documentación Técnica Completa

**Empresa:** Chayne Moda y Complementos S.L. (NIF B67759969)  
**Dominio:** tannamoda.com
**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS · Neon PostgreSQL · Stripe · Vercel

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Variables de entorno](#2-variables-de-entorno)
3. [Base de datos (Neon PostgreSQL)](#3-base-de-datos-neon-postgresql)
4. [Autenticación](#4-autenticación)
5. [Catálogo de productos](#5-catálogo-de-productos)
6. [Carrito de compra](#6-carrito-de-compra)
7. [Checkout y Stripe](#7-checkout-y-stripe)
8. [Panel de administración](#8-panel-de-administración)
9. [Rutas y páginas](#9-rutas-y-páginas)
10. [Componentes compartidos](#10-componentes-compartidos)
11. [Flujo completo de un pedido](#11-flujo-completo-de-un-pedido)
12. [Seguridad](#12-seguridad)
13. [Despliegue y migraciones](#13-despliegue-y-migraciones)

---

## 1. Arquitectura general

```
tanna-web/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Layout raíz (AuthProvider, fuentes)
│   ├── page.tsx                # Home
│   ├── components.tsx          # SiteHeader, SiteFooter, ProductCard, PageShell, PageHero
│   ├── add-to-cart-button.tsx  # Lógica de carrito (localStorage)
│   ├── carrito/
│   │   ├── page.tsx
│   │   └── cart-client.tsx     # Formulario de checkout + carrito
│   ├── coleccion/
│   │   └── page.tsx
│   ├── producto/[slug]/
│   │   ├── page.tsx
│   │   ├── product-gallery.tsx
│   │   └── product-purchase-panel.tsx  # Modal de selección de color/cantidad
│   ├── login/page.tsx
│   ├── registro/page.tsx
│   ├── completar-perfil/page.tsx       # Para usuarios de Google sin NIF/teléfono
│   ├── cuenta/
│   │   ├── page.tsx                    # Perfil del usuario
│   │   ├── pedidos/page.tsx            # Historial de pedidos
│   │   └── seguridad/page.tsx          # Cambio de contraseña
│   ├── pedido/exito/page.tsx           # Página post-pago (solo informativa)
│   ├── terminos/page.tsx
│   ├── lookbook/page.tsx
│   ├── contacto/page.tsx
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── register/route.ts
│       │   ├── logout/route.ts
│       │   ├── me/route.ts
│       │   ├── google/route.ts
│       │   ├── google/callback/route.ts
│       │   ├── update-profile/route.ts
│       │   ├── change-password/route.ts
│       │   └── complete-profile/route.ts
│       ├── checkout/route.ts           # Crea pedido pendiente + sesión Stripe
│       ├── webhooks/stripe/route.ts    # Confirma pago desde Stripe
│       ├── orders/
│       │   └── mine/route.ts           # Pedidos del usuario logueado
│       └── admin/
│           ├── login/route.ts
│           ├── orders/route.ts
│           └── mayorista/route.ts
├── components/
│   ├── AuthButtons.tsx         # LoginButton, RegisterButton, GoogleButton, AccountButton
│   ├── CookieBanner.tsx
│   └── site.tsx                # Re-exporta desde app/components.tsx
├── context/
│   └── AuthContext.tsx         # Proveedor de sesión global (React Context)
├── lib/
│   ├── db.ts                   # Conexión compartida a Neon (sql)
│   ├── auth.ts                 # bcrypt, cookies de sesión, validaciones
│   ├── auth-db.ts              # CRUD de usuarios y sesiones en Neon
│   ├── orders-db.ts            # CRUD de pedidos individuales/autónomos
│   ├── mayorista-db.ts         # CRUD de pedidos de empresa/mayorista
│   ├── stripe.ts               # Cliente de Stripe (servidor)
│   └── catalog.ts              # Catálogo de productos (datos estáticos)
└── public/fotos/               # Imágenes de productos (PNG/JPG)
```

---

## 2. Variables de entorno

Deben estar en `.env.local` para desarrollo local y en **Vercel → Settings → Environment Variables** para producción.

```env
# Base de datos
DATABASE_URL=postgresql://...          # Connection string de Neon

# Auth Google OAuth
GOOGLE_CLIENT_ID=...                   # De Google Cloud Console
GOOGLE_CLIENT_SECRET=...               # De Google Cloud Console
GOOGLE_REDIRECT_URI=https://TU_DOMINIO/api/auth/google/callback

# Stripe
STRIPE_SECRET_KEY=sk_live_...          # sk_test_... para pruebas
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...   # pk_test_... para pruebas
STRIPE_WEBHOOK_SECRET=whsec_...        # Del Dashboard de Stripe → Webhooks

# URL del sitio (necesaria para las URLs de éxito/cancelación de Stripe)
NEXT_PUBLIC_SITE_URL=https://TU_DOMINIO

# Admin panel (contraseña del panel /admin)
ADMIN_PASSWORD=...
```

> ⚠️ Las variables `NEXT_PUBLIC_*` se incrustan en build time. Cualquier cambio requiere redeploy en Vercel.

> ⚠️ Nunca expongas `STRIPE_SECRET_KEY`, `DATABASE_URL`, `GOOGLE_CLIENT_SECRET` ni `STRIPE_WEBHOOK_SECRET` en el frontend.

---

## 3. Base de datos (Neon PostgreSQL)

### Conexión compartida — `lib/db.ts`

```ts
import { neon } from '@neondatabase/serverless';
export const sql = neon(process.env.DATABASE_URL!);
```

Todas las funciones de base de datos importan este `sql` en vez de crear conexiones individuales.

### Tablas

#### `users`
Almacena todos los usuarios registrados (email/password y Google OAuth).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | Identificador único |
| `email` | VARCHAR(255) UNIQUE | Email (siempre en minúsculas) |
| `password_hash` | VARCHAR(255) NULL | Hash bcrypt. NULL si es usuario de Google |
| `google_id` | VARCHAR(255) UNIQUE NULL | ID de Google OAuth |
| `name` | VARCHAR(255) | Nombre del usuario |
| `phone` | VARCHAR(20) NULL | Teléfono |
| `nif_dni` | VARCHAR(15) UNIQUE NULL | NIF/DNI (en mayúsculas) |
| `created_at` | TIMESTAMP | Fecha de registro |
| `failed_login_attempts` | INT | Contador de intentos fallidos |
| `locked_until` | TIMESTAMP NULL | Bloqueo temporal tras 5 intentos fallidos |
| `email_verified` | BOOLEAN | True si es usuario de Google |

#### `sessions`
Sesiones activas de usuarios logueados.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | VARCHAR(255) PK | Token de sesión (randomBytes(32) → hex, 256 bits) |
| `user_id` | INT FK → users | Usuario propietario |
| `expires_at` | TIMESTAMP | Expiración (30 días desde creación) |
| `created_at` | TIMESTAMP | Fecha de creación |

#### `orders`
Pedidos de clientes autónomos y pedidos anónimos (invitados).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `created_at` | TIMESTAMP | Fecha del pedido |
| `status` | VARCHAR | Estado logístico: `nuevo`, `procesando`, `completado`, `cancelado` |
| `source` | VARCHAR | Origen: `web` |
| `payment_status` | VARCHAR | Estado de pago: `pendiente`, `pagado` |
| `user_id` | INT FK NULL | NULL para pedidos anónimos |
| `stripe_session_id` | VARCHAR UNIQUE NULL | ID de sesión de Stripe |
| `stripe_payment_intent` | VARCHAR NULL | ID del PaymentIntent de Stripe |
| `billing_address` | TEXT NULL | Dirección de facturación |
| `billing_nif` | VARCHAR(15) NULL | NIF/DNI del comprador |
| `paid_at` | TIMESTAMP NULL | Fecha de confirmación del pago (webhook) |
| `customer_name` | VARCHAR | Nombre del cliente |
| `customer_email` | VARCHAR | Email del cliente |
| `customer_phone` | VARCHAR | Teléfono del cliente |
| `customer_notes` | TEXT | Notas adicionales (talla, fecha, etc.) |
| `items` | JSONB | Array de líneas del pedido (slug, name, color, qty, precio) |
| `total` | NUMERIC | Total final (incluye comisión 5% + entrega 15€) |

#### `mayorista`
Pedidos de empresas. Misma estructura que `orders` más:

| Columna extra | Tipo | Descripción |
|---|---|---|
| `custumer_nif` | VARCHAR | NIF/CIF de la empresa (typo original mantenido) |
| `custumer_address` | TEXT | Dirección fiscal de la empresa (typo original mantenido) |

> ⚠️ Hay un typo histórico en los nombres de columna (`custumer` en vez de `customer`) que se mantiene intencionalmente para no romper datos existentes.

### Script de inicialización — `lib/auth-db.ts → initAuthTables()`

```bash
npx tsx scripts/init-db.ts
```

Crea las tablas `users` y `sessions` si no existen (usa `CREATE TABLE IF NOT EXISTS`). Es idempotente — se puede ejecutar más de una vez sin romper datos.

### Migraciones manuales (SQL)

Si la base de datos ya existía y se han añadido columnas nuevas, ejecutar en el SQL editor de Neon:

```sql
-- Columnas de pago y usuario en orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent VARCHAR(255),
  ADD COLUMN IF NOT EXISTS billing_address TEXT,
  ADD COLUMN IF NOT EXISTS billing_nif VARCHAR(15),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Columnas de pago y usuario en mayorista
ALTER TABLE mayorista
  ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent VARCHAR(255),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Columnas de perfil en users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS nif_dni VARCHAR(15) UNIQUE;

-- Permitir user_id NULL en orders (para pedidos anónimos)
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
```

---

## 4. Autenticación

### Archivos implicados

- `lib/auth.ts` — Utilidades: hash de contraseña, cookies, validaciones
- `lib/auth-db.ts` — Acceso a Neon: usuarios y sesiones
- `context/AuthContext.tsx` — Estado global de sesión en React
- `components/AuthButtons.tsx` — Botones de UI
- `app/api/auth/` — Endpoints de la API

### Flujo de registro (email/password)

```
Usuario rellena /registro
  → POST /api/auth/register
  → Valida email, contraseña (min 8 chars, 1 mayúscula, 1 número), teléfono
  → Comprueba email y NIF no duplicados en users
  → bcrypt.hash(password, 12)
  → INSERT INTO users
  → Crea sesión en sessions (token de 256 bits, 30 días)
  → Setea cookie httpOnly session_id
  → Redirige a /
```

### Flujo de login (email/password)

```
Usuario rellena /login
  → POST /api/auth/login
  → getUserByEmail → verifica locked_until
  → bcrypt.compare(password, hash)
  → Si falla: registerFailedLogin() → bloqueo tras 5 intentos (15 min)
  → Si ok: resetFailedLogins() → crea sesión → cookie
```

### Flujo de Google OAuth

```
Clic en "Continuar con Google"
  → GET /api/auth/google
  → Genera state aleatorio (anti-CSRF) → guarda en cookie oauth_state
  → Redirige a accounts.google.com/o/oauth2/v2/auth

Google redirige a:
  → GET /api/auth/google/callback?code=...&state=...
  → Verifica state coincide con cookie oauth_state
  → Intercambia code por access_token con Google
  → Obtiene email, nombre, google_id del usuario
  → Si google_id ya existe: login normal
  → Si email existe pero sin google_id: linkGoogleAccount()
  → Si es nuevo: createUser() sin password_hash
  → Si le falta phone o nif_dni: redirige a /completar-perfil
  → Si tiene todo: redirige a /
```

### Cookie de sesión

```ts
{
  name: 'session_id',
  value: randomBytes(32).toString('hex'),  // 256 bits
  httpOnly: true,    // No accesible desde JS del navegador
  secure: true,      // Solo HTTPS en producción
  sameSite: 'lax',   // Protección CSRF
  maxAge: 30 días
}
```

### AuthContext

Envuelve toda la app en `app/layout.tsx`. Expone:

```ts
{
  user: {
    id: number;
    email: string;
    name: string;
    hasPassword: boolean;     // false si es usuario de Google puro
    phone: string | null;
    nifDni: string | null;
    needsProfileCompletion: boolean;  // true si falta phone o nifDni
  } | null,
  loading: boolean,
  refresh: () => Promise<void>,  // Refresca datos de /api/auth/me
  logout: () => Promise<void>    // POST /api/auth/logout + limpia estado
}
```

Llama a `GET /api/auth/me` al montar para verificar si hay sesión activa.

### Seguridad de cuentas

| Medida | Implementación |
|---|---|
| Hash de contraseña | bcrypt con 12 rounds |
| Bloqueo de cuenta | 5 intentos fallidos → 15 minutos bloqueado |
| Mensajes genéricos | "Credenciales incorrectas" (nunca revela si el email existe) |
| Session fixation | Se invalida la sesión anterior al hacer login |
| Sesiones revocables | DELETE FROM sessions → logout real en la BD |
| Cookie segura | httpOnly + secure + sameSite=lax |
| State CSRF | Token aleatorio en OAuth de Google |
| Limpieza de sesiones expiradas | `cleanExpiredSessions()` (llamar ocasionalmente) |
| Cambio de contraseña | Invalida todas las demás sesiones activas |

---

## 5. Catálogo de productos

### `lib/catalog.ts`

Datos completamente estáticos, no hay base de datos de productos. El catálogo se genera en build time a partir de arrays de códigos y metadatos.

### Estructura de un producto

```ts
type Product = {
  id: string;          // "01", "02"... índice con padding
  code: string;        // Código real: "MM239", "AL233"...
  slug: string;        // URL-friendly del nombre: "kimono-con-estampado"
  name: string;
  price: string;       // Formato: "€16,90" (string, se parsea con priceToNumber())
  image: string;       // Foto principal: "/fotos/MM239.jpg"
  gallery: string[];   // [foto principal, ...fotos extra]
  colors: ColorOption[]; // Solo las fotos marcadas como color real
  mood: string;
  fit: string;         // "Free Size"
  color: string;       // Color del primer colorOption
  category: string;    // "Vestido", "Kimono", "Falda", "Blusa", "Mono"
  description: string;
};

type ColorOption = {
  name: string;    // "Rojo", "Azul"...
  image: string;   // Ruta a la foto de ese color
};
```

### Sistema de colores en `colorNames`

Cada producto tiene un campo opcional `colorNames: Record<number, string>` donde la key es el índice de la foto en la galería y el value es el nombre del color:

```ts
AL233: {
  colorNames: { 1: "Azul", 2: "Rojo", 3: "Verde" }
  // Al233-1.png = color Azul
  // AL233-2.png = color Rojo
  // AL233-3.png = color Verde
}
```

- El índice `0` se refiere a la foto **principal** (`AL233.png`, sin guión).
- Los demás índices se refieren a las fotos `-N` (`AL233-1.png`, `AL233-2.png`...).
- Las fotos que NO están en `colorNames` aparecen en la galería como ángulos adicionales pero no generan botón de color seleccionable.

### Parseo de precio

```ts
function priceToNumber(price: string): number
// "€16,90"  → 16.90
// "€1.200,00" → 1200.00
```

Se usa en el carrito para calcular totales, nunca para almacenar — el precio siempre se guarda y muestra como el string original del catálogo.

### Colecciones exportadas

```ts
export const products           // Todos (50 productos aprox.)
export const featuredProducts   // Primeros 8 (home)
export const newProducts        // Del 9 en adelante
export const lookbookProducts   // Últimos 6
export const categories         // ["Todo", "Vestido", "Kimono"...]
export function getProduct(slug: string): Product | undefined
```

---

## 6. Carrito de compra

### Almacenamiento — localStorage

```ts
const CART_KEY = "tanna-cart";

type CartItem = {
  slug: string;
  color: string;   // Nombre del color, ej: "Rojo"
  quantity: number;
};
```

Cada combinación `slug + color` es una línea independiente. Si añades el mismo producto en el mismo color, se suma la cantidad. Si añades el mismo producto en color diferente, crea una nueva línea.

### API pública de `add-to-cart-button.tsx`

```ts
// Añade qty unidades de slug+color. Suma si ya existe, crea si no.
export function addToCart(slug: string, color: string, quantity: number): void

// Lectura/escritura directa (usada por cart-client.tsx)
export function getStoredCart(): CartItem[]
export function setStoredCart(cart: CartItem[]): void
export function clearStoredCart(): void
```

### Sincronización en tiempo real

El carrito dispara un CustomEvent `tanna-cart-updated` cada vez que se modifica. `CartLink` y `CartClient` escuchan este evento via `useSyncExternalStore` para re-renderizarse automáticamente sin necesidad de estado global.

### Modal de selección de color — `product-purchase-panel.tsx`

Al pulsar "Reservar look" en la página de producto, se abre un modal con:
- Miniatura de cada color disponible
- Selector de cantidad (`−` / input / `+`) por color
- Total de unidades seleccionadas
- Al confirmar: llama `addToCart()` una vez por cada color con cantidad > 0
- Redirige automáticamente al carrito

---

## 7. Checkout y Stripe

### Tipos de cliente

| Tipo | Requiere sesión | Datos del formulario | Tabla destino |
|---|---|---|---|
| **Anónimo** | No | Nombre, NIF/DNI, email (opcional), teléfono, dirección | `orders` |
| **Autónomo** | Sí | Dirección de facturación (el resto de la cuenta) | `orders` |
| **Empresa** | Sí | Dirección de facturación (nombre y NIF de la cuenta) | `mayorista` |

### Desglose de precio

```
Subtotal = suma(unitPrice × quantity) de todos los items
Comisión = subtotal × 5%
Entrega = 15€ (fijo si el carrito no está vacío)
Total = subtotal + comisión + entrega
```

Los tres conceptos se envían como líneas separadas a Stripe (cada ítem del carrito + "Infraestructura de pago (5%)" + "Entrega"), para que el recibo de Stripe coincida exactamente con lo que ve el cliente.

### Flujo de checkout

```
1. Cliente pulsa "Ir a pagar" en /carrito
   → POST /api/checkout con:
      { items, accountType, billingAddress, notes,
        paymentFee, deliveryFee,
        [guestName, guestEmail, guestPhone, guestNif]  // solo si anónimo
      }

2. /api/checkout:
   → Si no es anónimo: verifica sesión activa
   → Crea pedido en BD con payment_status = 'pendiente'
      → orders (autónomo/anónimo) o mayorista (empresa)
   → Guarda orderId generado por Neon
   → Crea Stripe Checkout Session con:
      - line_items (productos + comisión + entrega)
      - success_url: /pedido/exito?order_id={orderId}
      - cancel_url: /carrito
      - metadata: { orderId, table }
   → Devuelve { url: checkout_url }

3. Frontend redirige a checkout_url (página de Stripe)
   → Cliente introduce datos de tarjeta
   → Stripe procesa el pago

4. Stripe redirige al cliente a success_url
   → /pedido/exito?order_id=... (solo informativa, no confirma el pago)

5. Stripe llama al webhook (server-to-server):
   → POST /api/webhooks/stripe
   → Verifica firma con STRIPE_WEBHOOK_SECRET
   → Si event = 'checkout.session.completed':
      → Lee metadata.orderId y metadata.table
      → Actualiza el pedido:
         payment_status = 'pagado'
         stripe_session_id = session.id
         stripe_payment_intent = session.payment_intent
         paid_at = NOW()
```

### ⚠️ Regla crítica de seguridad

**Nunca confirmes un pedido porque el usuario llegó a `/pedido/exito`**. Esa URL es solo informativa. La única fuente de verdad es el webhook de Stripe. Si el webhook falla o no está configurado, el pedido se queda en `payment_status = 'pendiente'` aunque se haya cobrado el dinero.

### Webhook de Stripe

- **Endpoint:** `POST /api/webhooks/stripe`
- **Verificación:** `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)` — si la firma no coincide, rechaza con 400.
- **Importante:** usa `await req.text()` (no `req.json()`) porque Stripe necesita el body crudo para verificar la firma.

### Configuración del webhook en Stripe Dashboard

1. Dashboard → Desarrolladores → Webhooks → Añadir endpoint
2. URL: `https://TU_DOMINIO/api/webhooks/stripe`
3. Evento: `checkout.session.completed`
4. Copia el `whsec_...` → añádelo en Vercel como `STRIPE_WEBHOOK_SECRET`
5. Para pruebas locales: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

---

## 8. Panel de administración

### Acceso

- URL: `/admin`
- Autenticación: usuario/contraseña definida en variables de entorno (independiente del sistema de usuarios)
- La sesión se guarda en `sessionStorage` del navegador como `tanna-admin-authenticated = "true"`
- No usa cookies httpOnly (es un panel de uso interno, no expuesto a usuarios finales)

### Funcionalidades

- Tab **Individuales**: pedidos de la tabla `orders`
- Tab **Empresas**: pedidos de la tabla `mayorista`
- Filtro por estado de pago: Todos / Pendientes / Pagados
- Vista agrupada por cliente (un bloque por email, con todos sus pedidos y prendas acumuladas)
- Edición de pedido: cambiar `status` logístico y datos del cliente
- Eliminación de pedido
- Monitor de requests: muestra en tiempo real las peticiones API hechas desde el panel

### APIs del admin

| Método | Endpoint | Acción |
|---|---|---|
| GET | `/api/admin/orders` | Lista pedidos individuales agrupados por cliente |
| PUT | `/api/admin/orders` | Actualiza status/datos de un pedido individual |
| DELETE | `/api/admin/orders?id=...` | Elimina un pedido individual |
| GET | `/api/admin/mayorista` | Lista pedidos de empresa agrupados por cliente |
| PUT | `/api/admin/mayorista` | Actualiza un pedido de empresa |
| DELETE | `/api/admin/mayorista?id=...` | Elimina un pedido de empresa |

Todas las rutas verifican la cookie `tanna-admin-auth` con valor `"1"` antes de proceder.

### ⚠️ payment_status es de solo lectura en el admin

El campo `payment_status` (Pagado/Pendiente) **no es editable** desde el formulario del admin — solo lo modifica el webhook de Stripe. Esto evita marcar como pagado un pedido que no se ha cobrado.

---

## 9. Rutas y páginas

### Páginas públicas

| Ruta | Archivo | Descripción |
|---|---|---|
| `/` | `app/page.tsx` | Home con hero, productos destacados, lookbook |
| `/coleccion` | `app/coleccion/page.tsx` | Catálogo completo con filtro por categoría |
| `/producto/[slug]` | `app/producto/[slug]/page.tsx` | Ficha de producto con galería, modal de color y botón de compra |
| `/lookbook` | `app/lookbook/page.tsx` | Editorial de looks |
| `/contacto` | `app/contacto/page.tsx` | Formulario de contacto |
| `/terminos` | `app/terminos/page.tsx` | Términos y condiciones (Chayne Moda S.L.) |
| `/carrito` | `app/carrito/page.tsx` | Carrito + formulario de checkout |

### Páginas de autenticación (ocultan carrito y botones de login)

| Ruta | Descripción |
|---|---|
| `/login` | Inicio de sesión (email/password + Google) |
| `/registro` | Registro (email, contraseña, teléfono, NIF/DNI + Google) |
| `/completar-perfil` | Solo para usuarios de Google sin teléfono/NIF |

### Páginas protegidas (requieren sesión)

| Ruta | Descripción |
|---|---|
| `/cuenta` | Perfil: editar nombre, accesos a pedidos y seguridad |
| `/cuenta/pedidos` | Historial de pedidos del usuario |
| `/cuenta/seguridad` | Cambio de contraseña (solo usuarios con password, no Google) |
| `/pedido/exito` | Confirmación post-pago (informativa) |

### API Routes

Todas en `app/api/`. Las que acceden a datos del usuario verifican la sesión via `getSessionCookie()` → `getSession()`. Las rutas GET que devuelven datos del usuario llevan `export const dynamic = 'force-dynamic'` para evitar que Next.js las cachee entre usuarios.

---

## 10. Componentes compartidos

### `app/components.tsx` (exportados también desde `components/site.tsx`)

```tsx
// Header fijo con nav, carrito y botón de cuenta
// theme='dark' (texto blanco, fondo oscuro) | 'light' (texto negro, fondo blanco)
// Oculta carrito y botones en /login y /registro
<SiteHeader theme="dark" | "light" />

// Footer con nav, copyright, link a términos
<SiteFooter />

// Wrapper completo: SiteHeader + children + SiteFooter
<PageShell headerTheme="dark" | "light">
  {children}
</PageShell>

// Hero con imagen de fondo, eyebrow, título y texto
<PageHero eyebrow="..." title="..." text="..." image="/fotos/..." />

// Tarjeta de producto para grids de catálogo
<ProductCard product={product} />
```

### `components/AuthButtons.tsx`

```tsx
// Botón que lleva a /login
<LoginButton variant="dark" | "light" className="..." />

// Botón que lleva a /registro
<RegisterButton variant="dark" | "light" className="..." />

// Botón que redirige a /api/auth/google (inicio OAuth)
<GoogleButton />

// Botón inteligente: muestra Login+Registro si no hay sesión,
// o avatar+nombre del usuario si hay sesión (lleva a /cuenta)
// Respeta el tema (claro/oscuro) del header
<AccountButton theme="dark" | "light" />
```

### `context/AuthContext.tsx`

```tsx
// Proveer en app/layout.tsx
<AuthProvider>
  {children}
</AuthProvider>

// Consumir en cualquier componente cliente
const { user, loading, refresh, logout } = useAuth();
```

### `app/producto/[slug]/product-gallery.tsx`

Galería de imágenes con carrusel y botones de color. Recibe estado externo (`index`, `onIndexChange`) para que el componente padre (`product-purchase-panel.tsx`) pueda saber qué foto/color está visible en cada momento.

### `app/producto/[slug]/product-purchase-panel.tsx`

Componente cliente que integra galería + modal de selección de color/cantidad. Al pulsar "Reservar look" abre el modal con todos los colores disponibles. Al confirmar, llama a `addToCart()` por cada color seleccionado y redirige al carrito.

---

## 11. Flujo completo de un pedido

### Caso A: Usuario registrado (autónomo)

```
1. Navega al catálogo → abre ficha de producto
2. Pulsa "Reservar look" → modal con colores
3. Selecciona 5 Rojo + 2 Azul → "Añadir al carrito"
4. Va a /carrito → ve dos líneas (Rojo ×5, Azul ×2)
5. Selecciona "Autónomo" (ya tiene datos en la cuenta)
6. Rellena dirección de facturación + notas
7. Acepta Términos y Condiciones (checkbox obligatorio)
8. Pulsa "Ir a pagar"
9. POST /api/checkout → crea pedido en `orders` con status pendiente
10. Redirige a Stripe Checkout → paga con tarjeta
11. Stripe redirige a /pedido/exito
12. Stripe llama al webhook → pedido marcado como pagado en BD
```

### Caso B: Usuario anónimo (invitado)

Igual que A, pero:
- Selecciona "Anónimo" en el carrito
- Rellena nombre, NIF/DNI, teléfono, email (opcional), dirección
- No necesita cuenta

### Caso C: Empresa

Igual que A, pero:
- Selecciona "Empresa"
- Los datos fiscales (nombre, NIF/CIF) salen automáticamente de la cuenta
- El pedido va a la tabla `mayorista` en vez de `orders`

### Visibilidad en el admin

Una vez completado el webhook, el pedido aparece en `/admin`:
- En el tab correspondiente (Individuales o Empresas)
- Con badge verde "Pagado" y fecha del pago
- Con todas las líneas de items (nombre, color, cantidad, precio)
- Editable en status logístico (nuevo → procesando → completado)

---

## 12. Seguridad

### Autenticación y sesiones

- IDs de sesión: `randomBytes(32)` → 256 bits de entropía (prácticamente imposible de adivinar)
- Cookies `httpOnly` → inaccesibles desde JavaScript del navegador (protege de XSS)
- Cookies `secure` → solo HTTPS en producción
- Cookies `sameSite: lax` → protección básica CSRF
- Expiración: 30 días, verificada en BD en cada request (`expires_at > NOW()`)
- Logout real: borra la fila de `sessions` en BD, no solo la cookie
- Session fixation: se borra la sesión anterior al hacer un nuevo login
- Bloqueo por fuerza bruta: 5 intentos fallidos → 15 minutos de bloqueo

### Pagos

- Nunca se procesan datos de tarjeta en tu servidor — todo va a través de Stripe Checkout (PCI-DSS compliant)
- Confirmación de pago solo via webhook con verificación de firma HMAC (`STRIPE_WEBHOOK_SECRET`)
- Body del webhook leído como texto crudo (no JSON) para que la firma sea verificable
- `payment_status` no editable manualmente desde el admin

### API Routes

- Rutas de usuario verifican sesión en cada request (no se fían del estado del frontend)
- Rutas de admin verifican cookie `tanna-admin-auth` separada del sistema de usuarios
- `export const dynamic = 'force-dynamic'` en todas las rutas GET de datos personales (evita caché entre usuarios)
- Mensajes de error genéricos en login (nunca revelan si el email existe o no)

### GDPR / LOPD

- NIF/DNI es dato identificativo sensible — informado en `/terminos`
- Solo visible para el propio usuario en su perfil
- Solo accesible para el admin en el panel interno
- Contraseñas almacenadas con bcrypt (12 rounds) — nunca en texto plano

---

## 13. Despliegue y migraciones

### Primera vez (instalación nueva)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env.local con todas las variables

# 3. Crear tablas en Neon
npx tsx scripts/init-db.ts

# 4. Ejecutar migraciones adicionales (si la BD ya existía)
# → Copiar y ejecutar el SQL del apartado 3 en el editor de Neon

# 5. Arrancar en desarrollo
npm run dev

# 6. Build de producción
npm run build
```

### Despliegue en Vercel

1. Push a GitHub → Vercel detecta el cambio y despliega automáticamente
2. O desde el Dashboard: Deployments → Redeploy

### Migraciones cuando se añaden columnas nuevas

1. Ejecutar el `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` en el SQL editor de Neon
2. Actualizar los tipos TypeScript en `orders-db.ts` / `mayorista-db.ts`
3. Actualizar `rowToOrder()` para mapear la nueva columna
4. Hacer deploy

### Cambio de claves de Stripe (test → live o viceversa)

1. Cambiar en Vercel: `STRIPE_SECRET_KEY` y `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
2. Configurar/cambiar el webhook en Stripe Dashboard apuntando al dominio correcto
3. Actualizar `STRIPE_WEBHOOK_SECRET` en Vercel con el nuevo `whsec_`
4. **Redeploy** (obligatorio para que las variables `NEXT_PUBLIC_*` se reconstruyan)

### Tarjetas de prueba (solo modo test)

| Resultado | Número |
|---|---|
| Pago exitoso | `4242 4242 4242 4242` |
| Pago rechazado | `4000 0000 0000 0002` |
| Requiere 3D Secure | `4000 0027 6000 3184` |

Fecha: cualquier futura · CVC: cualquiera · CP: cualquiera

### Migrar a otra cuenta de Vercel

Ver la guía completa en el chat. Resumen de lo que cambia por dominio:
- `NEXT_PUBLIC_SITE_URL` en Vercel
- `GOOGLE_REDIRECT_URI` en Vercel + Google Cloud Console
- URL del webhook en Stripe Dashboard
- `STRIPE_WEBHOOK_SECRET` en Vercel (nuevo whsec_)

La base de datos Neon, claves de Stripe y Google Client ID/Secret **no cambian**.

---

*Documentación generada para Tanna Moda · Chayne Moda y Complementos S.L. · NIF B67759969*

---

## 14. Referencia detallada de `lib/auth-db.ts`

Todas las funciones usan el `sql` de `lib/db.ts`. Los emails siempre se guardan y buscan en minúsculas. Los NIF/DNI siempre en mayúsculas.

```ts
// Buscar usuario por email (login)
getUserByEmail(email: string): Promise<User | null>

// Buscar usuario por Google ID (login con Google)
getUserByGoogleId(googleId: string): Promise<User | null>

// Buscar usuario por ID (recuperar datos de sesión)
getUserById(id: number): Promise<User | null>

// Buscar usuario por NIF/DNI (evitar duplicados en registro)
getUserByNifDni(nifDni: string): Promise<User | null>

// Crear usuario nuevo (email/password o Google)
// phone y nifDni son null si es usuario de Google recién registrado
// googleId es null si es registro por email/password
// email_verified = true si viene de Google, false si es email/password
createUser(
  email: string,
  passwordHash: string | null,
  name: string,
  phone: string | null,
  nifDni: string | null,
  googleId: string | null
): Promise<User>

// Vincular cuenta de Google a usuario existente (ya tenía cuenta por email)
linkGoogleAccount(userId: number, googleId: string): Promise<void>

// Incrementar contador de intentos fallidos
// Si llega a 5: bloquea 15 minutos (locked_until = NOW() + 15 min)
registerFailedLogin(userId: number): Promise<void>

// Resetear contador tras login exitoso
resetFailedLogins(userId: number): Promise<void>

// Guardar nueva sesión
createSession(sessionId: string, userId: number, expiresAt: Date): Promise<void>

// Leer sesión activa (JOIN con users para devolver datos del usuario)
// Devuelve null si no existe o está expirada
getSession(sessionId: string): Promise<SessionWithUser | null>

// Borrar sesión específica (logout)
deleteSession(sessionId: string): Promise<void>

// Borrar todas las sesiones de un usuario (cambio de contraseña)
deleteAllUserSessions(userId: number): Promise<void>

// Borrar sesiones expiradas (mantenimiento)
cleanExpiredSessions(): Promise<void>

// Actualizar teléfono y NIF de un usuario (completar perfil Google)
updateUserProfile(userId: number, phone: string, nifDni: string): Promise<void>

// Inicializar tablas (solo primera vez o en entornos nuevos)
initAuthTables(): Promise<void>
```

### Interfaz `User`

```ts
interface User {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  nif_dni: string | null;
  password_hash: string | null;
  google_id: string | null;
  created_at: string;
  failed_login_attempts: number;
  locked_until: string | null;
  email_verified: boolean;
}
```

---

## 15. Referencia detallada de `lib/orders-db.ts`

### Tipos principales

```ts
type Order = {
  id: string;                    // UUID
  createdAt: string;             // ISO 8601
  status: string;                // 'nuevo' | 'procesando' | 'completado' | 'cancelado'
  source: string;                // 'web'
  paymentStatus: string;         // 'pendiente' | 'pagado'
  userId: number | null;         // null para pedidos anónimos
  stripeSessionId: string | null;
  stripePaymentIntent: string | null;
  billingAddress: string | null;
  billingNif: string | null;
  paidAt: string | null;
  customer: {
    name: string;
    email: string;
    phone: string;
    notes: string;
  };
  items: Array<{
    slug: string;
    name: string;
    color: string;               // Nombre del color seleccionado
    category: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  total: number;                 // Subtotal + comisión 5% + entrega 15€
};
```

### Funciones CRUD

```ts
// Lectura
readAllOrders(): Promise<Order[]>
getOrderById(id: string): Promise<Order | null>
getOrdersByUserId(userId: number): Promise<Order[]>
getOrdersGroupedByCustomer(): Promise<CustomerSection[]>

// Escritura
createPendingOrder(input: PendingOrderInput): Promise<string>  // devuelve el orderId
markOrderAsPaid(orderId, stripeSessionId, stripePaymentIntent): Promise<void>
updateOrder(id, fields): Promise<Order | null>
deleteOrder(id: string): Promise<boolean>
writeAllOrders(orders: Order[]): Promise<void>  // reemplaza toda la tabla (uso heredado)
```

### `CustomerSection` (para el panel admin)

```ts
type CustomerSection = {
  customer: { name: string; email: string; phone: string; };
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
  orders: Order[];
  items: Array<{ slug; name; category; unitPrice; quantity; lineTotal }>;
  // items: todas las prendas de todos los pedidos del cliente, cantidades sumadas
};
```

---

## 16. Referencia detallada de `lib/mayorista-db.ts`

Mismo patrón que `orders-db.ts` pero apunta a la tabla `mayorista` y el tipo `customer` incluye `nif` y `address`.

### Diferencias clave

```ts
// customer tiene campos extra
customer: {
  name: string;
  nif: string;      // NIF/CIF de la empresa
  email: string;
  address: string;  // Dirección fiscal
  phone: string;
  notes: string;
};

// PendingMayoristaOrderInput no tiene billingAddress/billingNif separados
// (address y nif van dentro de customer directamente)
type PendingMayoristaOrderInput = {
  userId: number;
  customer: MayoristaOrder["customer"];
  items: MayoristaOrder["items"];
  total: number;
};
```

### ⚠️ Typos históricos en columnas de Neon

Las columnas `custumer_nif` y `custumer_address` tienen un typo (`custumer` en vez de `customer`) que se arrastra desde la creación inicial de la tabla. **No corregir** sin hacer una migración de datos, porque cambiar el nombre de columna rompería todos los registros existentes. El código ya lo gestiona correctamente mapeando esos nombres en `rowToOrder()`.

### Funciones

```ts
readAllMayoristaOrders(): Promise<MayoristaOrder[]>
getMayoristaOrderById(id: string): Promise<MayoristaOrder | null>
getMayoristaOrdersByUserId(userId: number): Promise<MayoristaOrder[]>
getMayoristaOrdersGroupedByCustomer(): Promise<MayoristaCustomerSection[]>
createPendingMayoristaOrder(input): Promise<string>
markMayoristaOrderAsPaid(orderId, stripeSessionId, stripePaymentIntent): Promise<void>
updateMayoristaOrder(id, fields): Promise<MayoristaOrder | null>
deleteMayoristaOrder(id: string): Promise<boolean>
```

---

## 17. Referencia detallada de `lib/auth.ts`

Funciones de utilidad para autenticación, todas sin efectos secundarios en BD.

```ts
// Hash de contraseña (12 rounds de bcrypt)
hashPassword(password: string): Promise<string>

// Verificar contraseña contra hash almacenado
verifyPassword(password: string, hash: string): Promise<boolean>

// Generar token de sesión aleatorio (32 bytes → 64 chars hex)
generateSessionId(): string

// Validar formato de email básico
isValidEmail(email: string): boolean

// Contraseña fuerte: min 8 chars + 1 mayúscula + 1 número
isStrongPassword(password: string): boolean

// Teléfono español: 6/7/9 + 8 dígitos, con o sin +34
isValidPhone(phone: string): boolean

// Leer, escribir y borrar la cookie de sesión
setSessionCookie(sessionId: string): Promise<void>
getSessionCookie(): Promise<string | null>
clearSessionCookie(): Promise<void>

// Constantes
SESSION_COOKIE = 'session_id'
SESSION_DURATION = 30 días en ms
```

---

## 18. Sistema de temas del header

`SiteHeader` acepta un prop `theme: 'dark' | 'light'` que controla los colores de texto, borde y fondo:

| theme | Fondo | Texto | Borde |
|---|---|---|---|
| `dark` (default) | `bg-[#17130f]/76` (marrón oscuro) | `text-white` | `border-white/20` |
| `light` | `bg-white/80` | `text-[#17130f]` | `border-black/10` |

### Qué páginas usan cada tema

```
dark (default):
  / (home) — header sobre imagen oscura

light:
  /coleccion
  /producto/[slug]
  /carrito
  /login
  /registro
  /completar-perfil
  /cuenta (y subrutas)
  /pedido/exito
  /terminos
  /lookbook
  /contacto
```

Para aplicarlo, pasa el prop a `PageShell`:

```tsx
<PageShell headerTheme="light">
  {children}
</PageShell>
```

### Ocultado automático de controles en login/registro

`SiteHeader` lee `usePathname()` internamente:

```ts
const hideAuthControls = pathname === "/login" || pathname === "/registro";
```

Si `hideAuthControls` es `true`, no renderiza el cluster derecho (carrito + `AccountButton`). Solo queda visible el logo "Tanna" para que el usuario pueda volver al home.

---

## 19. `AccountButton` — lógica de estados

`AccountButton` es el componente principal del header derecho. Tiene tres estados visuales:

### Estado 1: Cargando

Mientras `useAuth()` está resolviendo la sesión (hidratación inicial):

```tsx
<div className="h-9 w-9 animate-pulse rounded-full" />
// Placeholder animado, no muestra nada real
```

### Estado 2: Sin sesión

```tsx
<LoginButton variant="light/dark" />
<RegisterButton variant="light/dark" />
// Los dos botones juntos
```

### Estado 3: Con sesión

```tsx
<button onClick={() => router.push('/cuenta')}>
  <span>{user.name[0].toUpperCase()}</span>  // Inicial del nombre
  <span>{user.name}</span>                   // Nombre completo (oculto en móvil)
</button>
// Clic lleva directo a /cuenta (sin dropdown)
```

### Variantes de color (para header oscuro vs claro)

`AccountButton` recibe `theme: 'dark' | 'light'` del `SiteHeader` y lo pasa a `LoginButton`/`RegisterButton`:

- `theme="dark"`: botones en texto blanco sobre fondo oscuro
- `theme="light"`: botones en texto oscuro sobre fondo blanco

---

## 20. `useSearchParams` y Suspense

Next.js App Router con Turbopack requiere que cualquier componente que use `useSearchParams()` esté envuelto en `<Suspense>` cuando la página puede ser prerenderizada estáticamente. El patrón correcto en este proyecto:

```tsx
// ✅ Correcto — separar en componente hijo + Suspense
'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function InnerComponent() {
  const params = useSearchParams();
  // ... usa params
}

export default function Page() {
  return (
    <PageShell headerTheme="light">
      <Suspense fallback={null}>
        <InnerComponent />
      </Suspense>
    </PageShell>
  );
}

// ❌ Incorrecto — rompe el build con error de prerender
'use client';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const params = useSearchParams(); // Error en build
  // ...
}
```

### Páginas que siguen este patrón

- `app/login/page.tsx` → `LoginForm` + `<Suspense>`
- `app/pedido/exito/page.tsx` → `ExitoContent` + `<Suspense>`

Si se añaden nuevas páginas que lean `?param=...` de la URL, aplicar el mismo patrón.

---

## 21. Gestión de errores comunes

### "Invalid API Key" de Stripe

**Causa:** `STRIPE_SECRET_KEY` está vacía, tiene espacios, o está truncada.
**Solución:** Copiar de nuevo del Dashboard de Stripe usando el botón de copiar (no selección manual), verificar que no haya espacios en `.env.local`, reiniciar el servidor.

### "Invalid URL: An explicit scheme must be provided" de Stripe

**Causa:** `NEXT_PUBLIC_SITE_URL` no está definida o es `undefined`.
**Solución:** Añadir `NEXT_PUBLIC_SITE_URL=http://localhost:3000` en `.env.local` (o la URL del dominio en Vercel), reiniciar servidor o hacer redeploy.

### "Tu tarjeta fue rechazada. La solicitud se hizo en modo activo con tarjeta de prueba"

**Causa:** Se está usando `sk_live_...` (modo producción) con tarjetas `4242 4242 4242 4242` (solo válidas en test).
**Solución:** Cambiar a `sk_test_...` y `pk_test_...` para pruebas.

### "useSearchParams() should be wrapped in a Suspense boundary"

**Causa:** Un componente usa `useSearchParams()` directamente en el componente exportado por defecto de una página.
**Solución:** Separar la lógica en un componente hijo y envolverlo en `<Suspense fallback={null}>`.

### "File 'app/.../page.js' is not a module"

**Causa:** Existe un archivo `page.js` vacío o inválido en una carpeta de ruta.
**Solución:** Borrar el archivo (o la carpeta si no se necesita), ejecutar `rmdir /s /q .next` y rebuild.

### El pedido se queda en `payment_status = 'pendiente'` aunque se cobró

**Causa:** El webhook de Stripe no está configurado, la URL es incorrecta, o `STRIPE_WEBHOOK_SECRET` no coincide.
**Solución:** Verificar en Stripe Dashboard → Webhooks → el endpoint tiene la URL correcta, el evento `checkout.session.completed` está seleccionado, y el `whsec_...` en Vercel es el mismo que muestra el Dashboard para ese endpoint.

### `getUserById is not a function` u otros errores de import

**Causa:** Se importa una función de `lib/orders-db.ts` que no fue añadida o que fue renombrada.
**Solución:** Verificar que la función existe y se exporta con `export async function nombreFuncion`.

---

## 22. Checklist de lanzamiento a producción

Antes de cambiar de modo test a modo live:

- [ ] Flujo completo probado con tarjetas de test (pago exitoso, carrito vacío, usuario sin sesión, etc.)
- [ ] Webhook de test funcionando (el pedido pasa a `payment_status = 'pagado'` tras el pago)
- [ ] Panel admin muestra pedidos pagados correctamente
- [ ] Google OAuth probado en el dominio de producción (no solo localhost)
- [ ] Verificación de cuenta Stripe completada (KYB para empresa en España)
- [ ] IBAN añadido en Stripe Dashboard para recibir payouts
- [ ] Cambiar `STRIPE_SECRET_KEY` → `sk_live_...`
- [ ] Cambiar `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
- [ ] Configurar nuevo webhook en Stripe Dashboard (modo live) con URL del dominio real
- [ ] Actualizar `STRIPE_WEBHOOK_SECRET` con el nuevo `whsec_` (modo live)
- [ ] Redeploy en Vercel tras cambiar todas las variables
- [ ] Probar un pago real pequeño para confirmar que todo funciona end-to-end
- [ ] Verificar que el pago aparece en Stripe Dashboard → Pagos (modo live)
- [ ] Verificar que el payout se programa correctamente hacia el IBAN configurado

---

## 23. Nomenclatura y convenciones del proyecto

### Nombres de archivos

- Componentes React: `kebab-case.tsx`
- Rutas de API: `route.ts` (nombre fijo de Next.js)
- Páginas: `page.tsx` (nombre fijo de Next.js)
- Librerías: `kebab-case.ts`

### Colores (Tailwind)

| Variable | Hex | Uso |
|---|---|---|
| `[#17130f]` | Marrón muy oscuro | Fondo header, botones primarios, texto principal |
| `[#d0513f]` | Terracota/rojo coral | Acento, precios, botones CTA, hover |
| `[#9ee8dd]` | Verde agua | Eyebrow labels (página hero) |
| `[#fbfaf7]` | Blanco cálido | Fondo de páginas |
| `[#ece8df]` | Beige claro | Fondo de imágenes de producto |
| `[#e2ddd5]` | Borde beige | Bordes de cards y separadores |
| `[#6b6259]` | Marrón medio | Texto secundario |
| `[#7b7168]` | Marrón grisáceo | Texto de metadatos (fit, categoría) |

### Estados de pedido

```
status (logístico, editable desde admin):
  'nuevo'       → pedido recién creado
  'procesando'  → en preparación
  'completado'  → enviado/entregado
  'cancelado'   → cancelado

paymentStatus (de pago, solo editable via webhook de Stripe):
  'pendiente'   → pago no confirmado
  'pagado'      → confirmado por Stripe
```

---

*Fin de la documentación técnica de Tanna Moda*
*Última actualización: Julio 2026*

---

## 24. Flujos de datos detallados por endpoint

### `POST /api/auth/register`

```
Entrada (JSON):
{
  name: string,
  email: string,
  password: string,
  phone: string,
  nifDni: string
}

Validaciones (en orden):
  1. Todos los campos presentes
  2. isValidEmail(email)
  3. isStrongPassword(password) — min 8, 1 mayúscula, 1 número
  4. isValidPhone(phone)
  5. getUserByEmail(email) → 409 si ya existe
  6. getUserByNifDni(nifDni) → 409 si ya existe

Proceso:
  1. Borra sesión anterior si existe (getSessionCookie → deleteSession)
  2. hashPassword(password) con bcrypt 12 rounds
  3. createUser(email, hash, name, phone, nifDni, null)
  4. generateSessionId() → createSession() → setSessionCookie()

Salida (200):
{ user: { id, email, name } }

Errores:
  400 → campos inválidos
  409 → email o NIF duplicado
  500 → error de servidor
```

### `POST /api/auth/login`

```
Entrada (JSON):
{ email: string, password: string }

Validaciones:
  1. Campos presentes
  2. getUserByEmail → 401 genérico si no existe
  3. password_hash presente → 401 si es usuario de Google puro
  4. locked_until > NOW() → 423 (cuenta bloqueada)
  5. verifyPassword → 401 si no coincide + registerFailedLogin()

Proceso:
  1. Borra sesión anterior si existe
  2. resetFailedLogins()
  3. generateSessionId() → createSession() → setSessionCookie()

Salida (200):
{ user: { id, email, name } }

Errores:
  400 → campos vacíos
  401 → credenciales incorrectas (mensaje genérico)
  423 → cuenta bloqueada temporalmente
```

### `GET /api/auth/me`

```
Headers: Cookie: session_id=...

Proceso:
  1. getSessionCookie()
  2. getSession(sessionId) → JOIN con users
  3. Calcula needsProfileCompletion = !phone || !nif_dni

Salida (200):
{
  user: {
    id, email, name,
    hasPassword: boolean,   // password_hash IS NOT NULL
    phone, nifDni,
    needsProfileCompletion: boolean
  }
}
// user: null si no hay sesión válida

Nota: export const dynamic = 'force-dynamic' — nunca cacheado
```

### `GET /api/auth/google`

```
Proceso:
  1. Genera state = randomBytes(16).toString('hex')
  2. Guarda state en cookie httpOnly 'oauth_state' (10 min)
  3. Redirige a:
     https://accounts.google.com/o/oauth2/v2/auth?
       client_id=GOOGLE_CLIENT_ID
       redirect_uri=GOOGLE_REDIRECT_URI
       response_type=code
       scope=openid email profile
       state={state}
       prompt=select_account   ← siempre muestra selector de cuenta
```

### `GET /api/auth/google/callback`

```
Query params: ?code=...&state=...

Validaciones:
  1. code y state presentes
  2. state === cookie oauth_state → 302 /login?error=oauth si no coincide

Proceso:
  1. POST a https://oauth2.googleapis.com/token con code
     → obtiene access_token
  2. GET https://www.googleapis.com/oauth2/v2/userinfo
     → obtiene { id, email, name }
  3. getUserByGoogleId(id) → si existe, login directo
  4. Si no: getUserByEmail(email)
     → si existe sin google_id: linkGoogleAccount() + login
     → si no existe: createUser() nuevo
  5. createSession() → setSessionCookie()
  6. Borra cookie oauth_state
  7. Si falta phone o nif_dni: redirige a /completar-perfil
     Si tiene todo: redirige a /

Errores → 302 /login?error=oauth
```

### `POST /api/checkout`

```
Entrada (JSON):
{
  items: Array<{ slug, name, color, category, unitPrice, quantity, lineTotal }>,
  accountType: 'anonimo' | 'autonomo' | 'empresa',
  billingAddress: string,
  notes?: string,
  paymentFee: number,     // subtotal × 0.05
  deliveryFee: number,    // 15
  // Solo si anonimo:
  guestName?: string,
  guestEmail?: string,    // opcional
  guestPhone?: string,
  guestNif?: string,
}

Validaciones:
  1. items no vacío
  2. billingAddress presente
  3. Si no es anónimo: sesión válida requerida
  4. Si empresa: userSession.nif_dni presente
  5. Si anónimo: guestName, guestPhone, guestNif presentes

Proceso:
  1. Calcula total = itemsTotal + paymentFee + deliveryFee
  2. Crea pedido pendiente en la tabla correcta:
     - empresa → mayorista (datos de userSession)
     - autonomo → orders (datos de userSession)
     - anonimo → orders con userId=null (datos del formulario)
  3. Construye line_items para Stripe:
     - Un item por cada prenda (name — color si aplica)
     - Item "Infraestructura de pago (5%)"
     - Item "Entrega"
  4. stripe.checkout.sessions.create({
       mode: 'payment',
       payment_method_types: ['card'],
       line_items,
       success_url: NEXT_PUBLIC_SITE_URL + /pedido/exito?order_id={orderId},
       cancel_url: NEXT_PUBLIC_SITE_URL + /carrito,
       customer_email: email del comprador (opcional en anónimo),
       metadata: { orderId, table: 'orders' | 'mayorista' }
     })

Salida (200):
{ url: 'https://checkout.stripe.com/...' }

Errores:
  400 → carrito vacío, falta dirección, faltan datos
  401 → sin sesión (no anónimo)
  500 → error de Stripe o BD
```

### `POST /api/webhooks/stripe`

```
Headers: stripe-signature: ...

Proceso:
  1. body = await req.text()  ← crudo, NO JSON
  2. stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
     → 400 si firma inválida
  3. Si event.type === 'checkout.session.completed':
     a. Lee session.metadata.orderId y session.metadata.table
     b. Si table === 'mayorista':
          markMayoristaOrderAsPaid(orderId, session.id, session.payment_intent)
        Si table === 'orders':
          markOrderAsPaid(orderId, session.id, session.payment_intent)

Salida (200):
{ received: true }

Nota: Este endpoint es la ÚNICA forma válida de marcar un pedido como pagado.
Nunca confiar en que el usuario llegó a /pedido/exito.
```

---

## 25. Guía de añadir un nuevo producto al catálogo

El catálogo es estático (no hay CMS ni base de datos de productos). Para añadir una prenda nueva:

### Paso 1: Añadir las fotos

Copiar las imágenes a `public/fotos/`:
- Foto principal: `CODIGO.png` (o `.jpg`)
- Fotos extra: `CODIGO-1.png`, `CODIGO-2.png`, etc.

### Paso 2: Añadir el código a `rawCodes` en `lib/catalog.ts`

```ts
const rawCodes: [string, string, number][] = [
  // ...existentes...
  ["NUEVOCOD", "png", 3],  // 3 = número de fotos extra (-1, -2, -3)
];
```

### Paso 3: Añadir metadatos en `productMeta`

```ts
const productMeta: Record<string, ProductMeta> = {
  // ...existentes...
  NUEVOCOD: {
    name: "Nombre de la prenda",
    price: "€14,90",
    mood: "",
    fit: "Free Size",
    category: "Vestido",  // Ver categorías existentes
    description: "Descripción breve",
    colorNames: {
      0: "Azul",     // foto principal = color Azul
      1: "Rojo",     // NUEVOCOD-1.png = color Rojo
      2: "Verde",    // NUEVOCOD-2.png = color Verde
      // NUEVOCOD-3.png no está en colorNames → aparece en galería como ángulo extra
    }
  }
};
```

### Notas sobre `colorNames`

- **Key `0`**: siempre la foto principal (`CODIGO.png`)
- **Keys 1, 2, 3...**: fotos extra (`CODIGO-1.png`, `CODIGO-2.png`...)
- Si una foto es otro ángulo del mismo color (no un color distinto), no la incluyas en `colorNames` — aparecerá en la galería sin generar botón de color
- Si todos los ángulos son del mismo color, puedes poner solo `{ 0: "Nombre del color" }`

### Paso 4: No hace falta rebuild explícito

Next.js regenera el catálogo en cada build porque `catalog.ts` es un módulo estático. Al hacer deploy a Vercel, el catálogo nuevo estará disponible automáticamente.

---

## 26. Guía de añadir una nueva categoría de producto

Las categorías se generan automáticamente a partir de los `category` de cada producto:

```ts
export const categories = [
  "Todo",
  ...Array.from(new Set(products.map((p) => p.category)))
];
```

Para añadir una categoría nueva, simplemente úsala en el campo `category` de cualquier producto en `productMeta`. Aparecerá automáticamente en los filtros de `/coleccion`.

Categorías actuales: `Vestido`, `Vestido corto`, `Kimono`, `Falda`, `Blusa`, `Mono`

---

## 27. Guía de añadir un nuevo campo al perfil de usuario

Ejemplo: añadir campo `city` (ciudad) al perfil.

### 1. SQL en Neon

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
```

### 2. Actualizar `lib/auth-db.ts`

```ts
// Añadir al interface User
export interface User {
  // ...existentes...
  city: string | null;
}

// Añadir a la función updateUserProfile (o crear una nueva)
export async function updateUserProfile(
  userId: number,
  phone: string,
  nifDni: string,
  city: string  // nuevo campo
) {
  await sql`
    UPDATE users SET phone = ${phone}, nif_dni = ${nifDni}, city = ${city}
    WHERE id = ${userId}
  `;
}
```

### 3. Actualizar `lib/auth-db.ts → getSession()`

```ts
export async function getSession(sessionId: string) {
  const rows = await sql`
    SELECT s.id, s.user_id, s.expires_at, u.email, u.name, u.email_verified,
           u.phone, u.nif_dni, u.city,       ← añadir aquí
           (u.password_hash IS NOT NULL) AS has_password
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.id = ${sessionId} AND s.expires_at > NOW()
  `;
  return rows[0] || null;
}
```

### 4. Actualizar `app/api/auth/me/route.ts`

```ts
return NextResponse.json({
  user: {
    // ...existentes...
    city: session.city,  // añadir
  },
});
```

### 5. Actualizar `context/AuthContext.tsx`

```ts
interface User {
  // ...existentes...
  city: string | null;
}
```

### 6. Añadir el campo al formulario de `/cuenta/page.tsx`

```tsx
const [city, setCity] = useState(user?.city || '');

// En el form:
<input
  value={city}
  onChange={(e) => setCity(e.target.value)}
  className="..."
  placeholder="Ciudad"
/>
```

---

## 28. Cómo funciona el sistema de slugs

Los slugs son los identificadores de URL de los productos (ej. `/producto/kimono-con-estampado`).

```ts
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")                    // Separar letras de sus acentos
    .replace(/[\u0300-\u036f]/g, "")    // Eliminar acentos: á→a, é→e...
    .replace(/[^a-z0-9]+/g, "-")        // Cualquier no-alfanumérico → guión
    .replace(/(^-|-$)/g, "");           // Quitar guiones al inicio/fin
}
```

Los slugs se generan en build time a partir del `name` del producto. Si dos productos tienen el mismo nombre (lo que no debería pasar), el segundo sobreescribirá al primero en `getProduct()` porque ambos tendrán el mismo slug.

**`generateStaticParams()`** en `app/producto/[slug]/page.tsx` genera las rutas estáticas para todos los productos en build time, haciendo que las páginas de producto sean rápidas (prerenderizadas).

---

## 29. Página de "Mis pedidos" — `app/cuenta/pedidos/page.tsx`

### Fuente de datos

Hace fetch a `GET /api/orders/mine`, que:

1. Lee la sesión del usuario
2. Llama en paralelo a `getOrdersByUserId(userId)` y `getMayoristaOrdersByUserId(userId)`
3. Mezcla ambos arrays y ordena por fecha descendente
4. Devuelve `{ orders: [...] }`

### Campos mostrados por pedido

- Fecha de creación (formateada con `toLocaleDateString()`)
- Badge de estado de pago (verde "Pagado" / naranja "Pendiente")
- Lista de items: `×{quantity} {name} ({color})`
- Total del pedido

### Quién ve qué

- El endpoint solo devuelve pedidos donde `user_id = session.user_id`
- Los pedidos anónimos (`user_id = NULL`) no aparecen en ningún historial de usuario

---

## 30. Estructura de `items` (JSONB en BD)

El campo `items` en `orders` y `mayorista` es un array JSON con esta estructura por elemento:

```json
[
  {
    "slug": "kimono-con-estampado",
    "name": "Kimono con estampado",
    "color": "Rojo",
    "category": "Kimono",
    "unitPrice": 16.90,
    "quantity": 5,
    "lineTotal": 84.50
  },
  {
    "slug": "kimono-con-estampado",
    "name": "Kimono con estampado",
    "color": "Azul",
    "category": "Kimono",
    "unitPrice": 16.90,
    "quantity": 2,
    "lineTotal": 33.80
  }
]
```

Notas:
- Mismo producto en colores distintos → dos líneas separadas
- `unitPrice` y `lineTotal` son el precio del producto **sin** comisión ni entrega (esos se suman al `total` del pedido)
- `total` en la fila del pedido sí incluye comisión (5%) + entrega (15€)
- Los precios se guardan como números (no strings) para poder hacer sumas en el admin

---

## 31. Panel admin — rutas API en detalle

### `GET /api/admin/orders`

```
Headers: Cookie: tanna-admin-auth=1

Proceso:
  1. isAuthenticated() → verifica cookie
  2. getOrdersGroupedByCustomer()
     → lee todos los pedidos ordenados por fecha DESC
     → agrupa por customer_email
     → por cada cliente: acumula orderCount, totalSpent, orders[], items[]
     → items[] suma cantidades de misma prenda (mismo slug) entre pedidos
  
Salida:
{ customers: CustomerSection[] }
```

### `PUT /api/admin/orders`

```
Entrada: { id: string, update: { status?, customer?: { name?, email?, phone?, notes? } } }

Proceso:
  1. isAuthenticated()
  2. getOrderById(id) → 404 si no existe
  3. updateOrder(id, fields)
     → UPDATE orders SET status, customer_name, email, phone, notes
     → NO toca payment_status, stripe_session_id, paid_at, items, total

Salida: { order: Order }
```

### `DELETE /api/admin/orders?id=...`

```
Proceso:
  1. isAuthenticated()
  2. deleteOrder(id) → DELETE FROM orders WHERE id = ?
  
Salida: { message: "Orden eliminada." }
Errores: 400 (sin id), 404 (no existe)
```

El mismo patrón aplica para `/api/admin/mayorista` pero usando las funciones de `mayorista-db.ts`.

---

## 32. Consideraciones de rendimiento

### Imágenes de producto

- Todas las imágenes usan `next/image` con `fill` + `sizes` optimizados
- Foto principal de cada página de producto: `priority={true}` para evitar LCP lento
- Galería: solo la primera foto tiene `priority`, el resto se carga lazy

### Catálogo estático

El array `products` se genera una sola vez en build time y se importa directamente. No hay consulta a base de datos para listar productos — todo es en memoria. Con ~50 productos esto es completamente viable y muy rápido.

### Consultas a Neon

- `readAllOrders()` y `readAllMayoristaOrders()` cargan todos los pedidos en memoria para agruparlos. Esto es eficiente con cientos o incluso miles de pedidos, pero si el volumen crece mucho (decenas de miles), habría que migrar la lógica de agrupación a SQL con `GROUP BY`.
- Las sesiones expiradas no se borran automáticamente — llamar `cleanExpiredSessions()` periódicamente (ej. con un cron de Vercel).

### Carrito en localStorage

Al estar en localStorage, el carrito:
- Persiste entre pestañas y recargas
- Se sincroniza entre pestañas abiertas del mismo navegador (via evento `storage`)
- Se limpia al llamar `clearStoredCart()` (tras pago exitoso)
- No requiere ninguna consulta al servidor para leer/escribir

---

## 33. Variables de contexto de sesión disponibles en el servidor

Cuando una ruta API llama a `getSession(sessionId)`, el objeto devuelto contiene:

```ts
{
  id: string,              // session token
  user_id: number,
  expires_at: string,
  email: string,
  name: string,
  email_verified: boolean,
  phone: string | null,
  nif_dni: string | null,
  has_password: boolean,   // (u.password_hash IS NOT NULL) calculado en SQL
}
```

Este objeto es suficiente para todas las operaciones del checkout sin necesidad de hacer una segunda consulta a `users`. Si en el futuro se necesitan más campos del usuario en el servidor, añadirlos al SELECT del `getSession()`.

---

## 34. Integración completa Google OAuth — Configuración en Google Cloud Console

### Crear el proyecto y credenciales

1. [console.cloud.google.com](https://console.cloud.google.com) → Nuevo proyecto
2. **APIs y servicios → Pantalla de consentimiento OAuth**
   - Tipo: **Externo**
   - Nombre app: "Tanna Moda"
   - Email soporte: el tuyo
   - Scopes: `openid`, `email`, `profile` (los básicos)
   - Estado: "En pruebas" para empezar (añadir emails de tester)
   - Para producción pública: solicitar verificación (puede tardar días)

3. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth**
   - Tipo: **Aplicación web**
   - **Orígenes autorizados:**
     ```
     http://localhost:3000
     https://TU_DOMINIO.vercel.app
     ```
   - **URIs de redirección autorizados:**
     ```
     http://localhost:3000/api/auth/google/callback
     https://TU_DOMINIO.vercel.app/api/auth/google/callback
     ```

4. Google genera `Client ID` (`...apps.googleusercontent.com`) y `Client Secret` (`GOCSPX-...`)

### Variables de entorno necesarias

```env
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI=https://TU_DOMINIO.vercel.app/api/auth/google/callback
# Para local:
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

En Vercel, tener dos versiones: una para Preview (con localhost o dominio de preview) y otra para Production.

---

## 35. Esquema visual del flujo de autenticación completo

```
                    REGISTRO
                       │
         ┌─────────────┼─────────────┐
         │                           │
    Email/Password              Google OAuth
         │                           │
         ▼                           ▼
  Valida campos         /api/auth/google
  Hash bcrypt           → redirect Google
  INSERT users          → callback con code
  CREATE session        → token exchange
  SET cookie            → getUserByGoogleId
         │               │
         │          ┌────┴────────┐
         │          │             │
         │     Ya existe     No existe
         │          │             │
         │    linkGoogle    createUser
         │    Account()    (sin hash)
         │          │             │
         │          └────┬────────┘
         │               │
         │          falta phone/NIF?
         │          ┌────┴────┐
         │          Sí        No
         │          │         │
         │    /completar-     /
         │      perfil
         │
         ▼
    SESIÓN ACTIVA
    Cookie: session_id (httpOnly, 30 días)
    Tabla sessions en Neon
         │
         ▼
    /api/auth/me (en cada carga de página)
    → devuelve user al AuthContext
    → AccountButton muestra avatar
         │
         ▼
    LOGOUT
    DELETE sessions WHERE id = ?
    DELETE cookie
    setUser(null) en AuthContext
```

---

*Fin de la documentación extendida de Tanna Moda*
*Secciones: 1-35 · Stack: Next.js 16 · Neon PostgreSQL · Stripe · Vercel*
*Empresa: Chayne Moda y Complementos S.L. · NIF B67759969*
