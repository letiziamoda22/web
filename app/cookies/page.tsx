import type { Metadata } from "next";
import { PageShell } from "@/app/components";

export const metadata: Metadata = {
  title: "Política de Cookies | Tanna",
  description:
    "Política de cookies del sitio web de Tanna, propiedad de Chayne Moda y Complementos S.L.",
};

const sections = [
  {
    title: "1. ¿Qué son las cookies?",
    body: (
      <p>
        Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando
        visitas un sitio web. Sirven para recordar preferencias, mantener la sesión activa y
        mejorar la experiencia de navegación.
      </p>
    ),
  },
  {
    title: "2. Cookies que utilizamos",
    body: (
      <>
        <p>En este sitio utilizamos únicamente cookies estrictamente necesarias para el correcto funcionamiento:</p>
        <ul className="mt-4 list-disc space-y-1.5 pl-5">
          <li>Cookies de sesión para mantener tu acceso durante la navegación.</li>
          <li>Cookies de carrito para conservar los productos seleccionados.</li>
          <li>Cookies técnicas de autenticación y seguridad para proteger el uso del sitio.</li>
        </ul>
      </>
    ),
  },
  {
    title: "3. Finalidad",
    body: (
      <p>
        Las cookies nos permiten ofrecer un funcionamiento correcto del sitio, gestionar el carrito,
        mantener la sesión activa y mejorar la experiencia de compra y navegación.
      </p>
    ),
  },
  {
    title: "4. Gestión de cookies",
    body: (
      <p>
        Al navegar por el sitio, aceptas el uso de las cookies necesarias para su correcto
        funcionamiento. Puedes desactivar las cookies desde la configuración de tu navegador,
        aunque algunas funciones del sitio podrían verse afectadas.
      </p>
    ),
  },
  {
    title: "5. Cookies de terceros",
    body: (
      <p>
        No utilizamos cookies de terceros para fines publicitarios o de analítica. El sitio solo
        emplea cookies necesarias para sesión, carrito y seguridad.
      </p>
    ),
  },
  {
    title: "6. Más información",
    body: (
      <p>
        Si tienes dudas sobre esta política o sobre el uso de cookies, puedes contactar con
        nosotros a través de los canales indicados en nuestra política de privacidad o en la
        sección de contacto del sitio.
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <PageShell headerTheme="light">
      <section className="bg-[#17130f] px-5 pb-14 pt-32 text-white sm:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9ee8dd]">
            Legal
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
            Política de Cookies
          </h1>
          <p className="mt-4 text-sm text-white/70">
            Última actualización: 2 de julio de 2026
          </p>
        </div>
      </section>

      <section className="bg-[#fbfaf7] px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-4xl space-y-12">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-semibold text-[#17130f] sm:text-2xl">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-[#62584f] sm:text-base sm:leading-8">
                {section.body}
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
