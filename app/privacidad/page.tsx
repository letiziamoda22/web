import type { Metadata } from "next";
import { PageShell } from "@/app/components";

export const metadata: Metadata = {
title: "Política de Privacidad | Tanna",
description:
"Política de privacidad del sitio web de Tanna, propiedad de Chayne Moda y Complementos S.L.",
};

const sections = [
{
title: "1. Responsable del tratamiento",
body: (
<> <p>
En cumplimiento del Reglamento (UE) 2016/679 (RGPD), se informa que los datos
personales recogidos a través del sitio web{" "} <a
         href="https://tannamoda.vercel.app/"
         className="font-semibold text-[#d0513f] underline-offset-4 hover:underline"
       >
https://tannamoda.vercel.app/ </a>{" "}
serán tratados por: </p> <ul className="mt-4 space-y-1.5"> <li><span className="font-semibold text-[#17130f]">Razón social:</span> Chayne Moda y Complementos S.L.</li> <li><span className="font-semibold text-[#17130f]">NIF/CIF:</span> B67759969</li> <li><span className="font-semibold text-[#17130f]">Domicilio:</span> Calle Astorga, local 1, 28947, Fuenlabrada, Madrid, España</li> <li><span className="font-semibold text-[#17130f]">Teléfono:</span> 683 495 396</li> <li><span className="font-semibold text-[#17130f]">Email:</span> [letiziamoda22@gmail.com](mailto:letiziamoda22@gmail.com)</li> </ul>
</>
),
},
{
title: "2. Datos personales recopilados",
body: (
<> <p>Recopilamos las siguientes categorías de datos:</p> <ul className="mt-4 list-disc space-y-1.5 pl-5"> <li>Datos identificativos (nombre o empresa)</li> <li>Datos de contacto (email, teléfono)</li> <li>Datos de envío (dirección)</li> <li>Datos de facturación (NIF)</li> <li>Credenciales de acceso</li> <li>Cookies técnicas de navegación</li> </ul> <p className="mt-4">
Los datos de pago son procesados por <strong>Stripe</strong>. No almacenamos datos completos de tarjetas. </p>
</>
),
},
{
title: "3. Finalidad del tratamiento",
body: ( <ul className="list-disc space-y-1.5 pl-5"> <li>Gestión de cuentas de usuario</li> <li>Procesamiento de pedidos</li> <li>Facturación</li> <li>Atención al cliente</li> <li>Seguridad y prevención de fraude</li> </ul>
),
},
{
title: "4. Base legal",
body: ( <ul className="list-disc space-y-1.5 pl-5"> <li>Ejecución de contrato</li> <li>Consentimiento del usuario</li> <li>Obligación legal</li> <li>Interés legítimo</li> </ul>
),
},
{
title: "5. Conservación de datos",
body: ( <p>
Los datos se conservarán mientras exista relación contractual y durante los plazos
legales aplicables, o hasta que el usuario solicite su supresión. </p>
),
},
{
title: "6. Destinatarios",
body: ( <ul className="list-disc space-y-1.5 pl-5"> <li>Proveedores logísticos</li> <li>Proveedores tecnológicos</li> <li>Pasarela de pago (Stripe)</li> <li>Administraciones públicas</li> </ul>
),
},
{
title: "7. Transferencias internacionales",
body: ( <p>
Algunos proveedores pueden operar fuera del Espacio Económico Europeo, aplicándose
garantías adecuadas conforme al RGPD. </p>
),
},
{
title: "8. Derechos del usuario",
body: (
<> <p>El usuario puede ejercer:</p> <ul className="mt-4 list-disc space-y-1.5 pl-5"> <li>Acceso</li> <li>Rectificación</li> <li>Supresión</li> <li>Limitación</li> <li>Portabilidad</li> <li>Oposición</li> </ul> <p className="mt-4">
Contacto: <strong>[letiziamoda22@gmail.com](mailto:letiziamoda22@gmail.com)</strong> </p>
</>
),
},
{
title: "9. Seguridad",
body: ( <p>
Se aplican medidas técnicas y organizativas adecuadas para garantizar la seguridad de los datos. </p>
),
},
{
title: "10. Cookies",
body: ( <p>
El Sitio Web utiliza cookies técnicas necesarias para el correcto funcionamiento y
mantenimiento de la sesión del usuario. </p>
),
},
{
title: "11. Menores",
body: ( <p>
El sitio está dirigido a profesionales. No está permitido el uso por menores de edad. </p>
),
},
{
title: "12. Modificaciones",
body: ( <p>
Esta política puede actualizarse en cualquier momento. Se recomienda revisarla periódicamente. </p>
),
},
{
title: "13. Contacto",
body: (
<> <p>Para cualquier consulta:</p> <ul className="mt-4 space-y-1.5"> <li><span className="font-semibold text-[#17130f]">Email:</span> [letiziamoda22@gmail.com](mailto:letiziamoda22@gmail.com)</li> <li><span className="font-semibold text-[#17130f]">Teléfono:</span> 683 495 396</li> <li><span className="font-semibold text-[#17130f]">Dirección:</span> Calle Astorga, local 1, Fuenlabrada, Madrid</li> </ul>
</>
),
},
];

export default function PrivacidadPage() {
return ( <PageShell headerTheme="light"> <section className="bg-[#17130f] px-5 pb-14 pt-32 text-white sm:px-8"> <div className="mx-auto max-w-4xl"> <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9ee8dd]">
Legal </p> <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
Política de Privacidad </h1> <p className="mt-4 text-sm text-white/70">
Última actualización: 30 de junio de 2026 </p> </div> </section>


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
