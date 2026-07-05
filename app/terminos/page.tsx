import type { Metadata } from "next";
import { PageShell } from "@/app/components";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Tanna",
  description:
    "Términos y condiciones de uso del sitio web de Tanna, propiedad de Chayne Moda y Complementos S.L.",
};

const sections = [
  {
    title: "1. Información general e identificación del responsable",
    body: (
      <>
        <p>
          El presente sitio web{" "}
          <a
            href="https://tannamoda.com/"
            className="font-semibold text-[#d0513f] underline-offset-4 hover:underline"
          >
            https://tannamoda.com/
          </a>{" "}
          (en adelante, &ldquo;el Sitio Web&rdquo; o &ldquo;la Plataforma&rdquo;) es titularidad de:
        </p>
        <ul className="mt-4 space-y-1.5">
          <li>
            <span className="font-semibold text-[#17130f]">Razón social:</span> Chayne Moda y
            Complementos S.L.
          </li>
          <li>
            <span className="font-semibold text-[#17130f]">NIF/CIF:</span> B67759969
          </li>
          <li>
            <span className="font-semibold text-[#17130f]">Domicilio:</span> Calle Astorga,
            local 1, 28947, Fuenlabrada, Madrid, España
          </li>
          <li>
            <span className="font-semibold text-[#17130f]">Teléfono de contacto:</span> 683 495 396
          </li>
          <li>
            <span className="font-semibold text-[#17130f]">Email de contacto:</span>{" "}
            letiziamoda22@gmail.com
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "2. Objeto y ámbito de aplicación",
    body: (
      <>
        <p>
          Los presentes Términos y Condiciones (en adelante, &ldquo;los Términos&rdquo;) regulan
          el acceso, navegación y uso del Sitio Web, así como las condiciones que rigen la compra
          de productos a través de la Plataforma, por parte de empresas/profesionales (clientes
          mayoristas).
        </p>
        <p className="mt-4">
          El acceso y/o uso del Sitio Web, así como la realización de cualquier pedido,{" "}
          <span className="font-semibold text-[#17130f]">
            implica la aceptación plena y sin reservas de todos y cada uno de los presentes
            Términos
          </span>
          , en la versión publicada en el momento en que el usuario acceda al Sitio Web. Si el
          usuario no está de acuerdo con alguno de los términos aquí establecidos, deberá
          abstenerse de utilizar el Sitio Web y sus servicios.
        </p>
      </>
    ),
  },
  {
    title: "3. Usuarios y creación de cuenta",
    body: (
      <>
        <p>
          Para realizar pedidos y acceder a determinadas funcionalidades, el usuario deberá
          registrar una cuenta, proporcionando información veraz, exacta y actualizada,
          incluyendo (según corresponda):
        </p>
        <ul className="mt-4 list-disc space-y-1.5 pl-5">
          <li>Nombre y apellidos o nombre de la empresa</li>
          <li>Dirección de correo electrónico</li>
          <li>Número de teléfono</li>
          <li>Dirección física de envío</li>
          <li>NIF</li>
        </ul>
        <p className="mt-4">
          El usuario es el único responsable de la veracidad de los datos facilitados, así como
          de mantener la confidencialidad de sus credenciales de acceso. Chayne Moda y
          Complementos S.L. no se hace responsable de los perjuicios que puedan derivarse del uso
          indebido de la cuenta por parte de terceros, salvo negligencia propia.
        </p>
        <p className="mt-4">
          Está prohibido crear cuentas falsas, suplantar la identidad de terceros o utilizar la
          cuenta con fines fraudulentos.
        </p>
      </>
    ),
  },
  {
    title: "4. Datos recopilados y finalidad",
    body: (
      <>
        <p>
          Con el fin de prestar correctamente nuestros servicios, Chayne Moda y Complementos
          S.L. recopila y trata los siguientes datos:
        </p>
        <ul className="mt-4 list-disc space-y-1.5 pl-5">
          <li>
            <span className="font-semibold text-[#17130f]">Datos de cuenta:</span> email y
            teléfono, para la creación y gestión de la cuenta de usuario.
          </li>
          <li>
            <span className="font-semibold text-[#17130f]">Datos de envío:</span> dirección
            física, para la gestión y entrega de pedidos.
          </li>
          <li>
            <span className="font-semibold text-[#17130f]">Datos de facturación:</span> NIF y
            nombre de empresa.
          </li>
          <li>
            <span className="font-semibold text-[#17130f]">Datos de pago:</span> procesados
            directamente por nuestro proveedor de pagos <strong>Stripe</strong>; Chayne Moda y
            Complementos S.L. no almacena los datos completos de tarjetas de crédito/débito.
          </li>
          <li>
            <span className="font-semibold text-[#17130f]">Cookies:</span> utilizadas para
            mantener la sesión activa del usuario y mejorar la experiencia de navegación.
          </li>
        </ul>
        <p className="mt-4">
          Estos datos se recopilan únicamente con las finalidades de: gestionar pedidos, crear y
          administrar la cuenta de usuario, procesar pagos, y mantener la sesión iniciada durante
          la navegación.
        </p>
        <p className="mt-4">
          Para más información sobre el tratamiento de datos personales, plazos de conservación y
          derechos del usuario (acceso, rectificación, supresión, etc.), consulta nuestra{" "}
          <a className="font-semibold text-[#17130f] text-black-600 underline hover:text-blue-600"  href="/privacidad" >Política de Privacidad</a>, documento
          independiente y complementario a estos Términos.
        </p>
      </>
    ),
  },
  {
    title: "5. Cookies",
    body: (
      <p>
        El Sitio Web utiliza cookies técnicas necesarias para el correcto funcionamiento de la
        Plataforma, en particular para{" "}
        <span className="font-semibold text-[#17130f]">
          mantener la sesión del usuario activa
        </span>{" "}
        durante la navegación y el proceso de compra. Al navegar y utilizar el Sitio Web, el
        usuario acepta el uso de estas cookies. 
      </p>
    ),
  },
  {
    title: "6. Productos, precios y disponibilidad",
    body: (
      <>
        <p>
          Chayne Moda y Complementos S.L. se reserva el derecho de modificar en cualquier
          momento, sin previo aviso, los productos, precios, promociones y demás condiciones
          comerciales ofrecidas a través del Sitio Web, sin que ello afecte a los pedidos ya
          confirmados.
        </p>
        <p className="mt-4">
          Los precios mostrados incluyen los impuestos aplicables (IVA), salvo que se indique
          expresamente lo contrario, y no incluyen, salvo indicación en contra, los gastos de
          envío, que se mostrarán de forma desglosada antes de finalizar la compra.
        </p>
        <p className="mt-4">
          Chayne Moda y Complementos S.L. pondrá el máximo cuidado en la descripción y
          representación de los productos; no obstante, pueden existir pequeñas variaciones de
          color, tono o textura derivadas de la configuración del dispositivo del usuario.
        </p>
      </>
    ),
  },
  {
    title: "7. Imágenes y contenido generado por Inteligencia Artificial",
    body: (
      <>
        <p>
          El usuario reconoce y acepta que{" "}
          <span className="font-semibold text-[#17130f]">
            algunas de las imágenes de productos, modelos o ambientación mostradas en el Sitio
            Web pueden haber sido generadas total o parcialmente mediante herramientas de
            Inteligencia Artificial (IA)
          </span>
          , con fines ilustrativos, estéticos o de presentación comercial.
        </p>
        <p className="mt-4">
          Dichas imágenes pueden no representar de forma exacta el aspecto físico, color, textura
          o acabado real del producto. Chayne Moda y Complementos S.L. procurará que las imágenes
          generadas por IA reflejen con la mayor fidelidad posible las características reales del
          producto, pero no garantiza una correspondencia exacta. Ante cualquier duda sobre el
          aspecto real de un producto, el usuario puede contactar con nosotros a través de los
          canales indicados en estos Términos antes de realizar la compra.
        </p>
      </>
    ),
  },
  {
    title: "8. Proceso de pedido y formalización del contrato",
    body: (
      <>
        <p>
          El proceso de compra se realiza a través del Sitio Web, siguiendo los pasos indicados
          en cada momento (selección de producto, datos de envío, método de pago y confirmación).
          Una vez finalizado el pedido, el usuario recibirá una confirmación por correo
          electrónico. En caso de no presentar correo electronico se mandara un mensaje a traves
          de la plataforma whatsapp.
        </p>
        <p className="mt-4">
          El contrato de compraventa se entenderá formalizado en el momento en que Chayne Moda y
          Complementos S.L. confirme la aceptación del pedido, con independencia del momento en
          que se realice el cargo correspondiente.
        </p>
      </>
    ),
  },
  {
    title: "9. Métodos de pago",
    body: (
      <>
        <p>
          Los pagos realizados a través del Sitio Web se procesan mediante la pasarela de pago{" "}
          <strong>Stripe</strong>, proveedor especializado y seguro de procesamiento de pagos
          online. Al introducir sus datos de pago, el usuario acepta también las condiciones de
          uso del propio Stripe como procesador del pago.
        </p>
        <p className="mt-4">
          Chayne Moda y Complementos S.L. no tiene acceso ni almacena los datos completos de las
          tarjetas de pago del usuario; dicha información es tratada exclusivamente por Stripe
          conforme a los estándares de seguridad PCI-DSS.
        </p>
      </>
    ),
  },
  {
    title: "10. Envíos y entregas",
    body: (
      <>
        <p>
          Los plazos de entrega se informarán durante el proceso de compra y son orientativos,
          pudiendo variar en función de la disponibilidad del producto, la zona de destino y
          circunstancias logísticas ajenas a Chayne Moda y Complementos S.L.
        </p>
        <p className="mt-4">
          Es responsabilidad del usuario facilitar una dirección de envío correcta y completa.
          Chayne Moda y Complementos S.L. no se hace responsable de retrasos o incidencias
          derivadas de errores en los datos de envío facilitados por el usuario.
        </p>
      </>
    ),
  },
  {
    title: "11. Derecho de desistimiento",
    body: (
      <p>
        Chayne Moda y Complementos S.L. se rige exclusivamente por el actual Código de Comercio,
        lo cual indica que, en caso de defectos aparentes o taras visibles, la empresa tiene{" "}
        <span className="font-semibold text-[#17130f]">4 días naturales</span> desde la recepción
        para hacer una reclamación. En caso de vicios ocultos o defectos internos, la empresa
        tiene <span className="font-semibold text-[#17130f]">30 días naturales</span> para
        levantar una reclamación.
      </p>
    ),
  },
  {
    title: "12. Propiedad intelectual e industrial",
    body: (
      <>
        <p>
          Todos los contenidos del Sitio Web (textos, imágenes, logotipos, diseños, marcas,
          código fuente, etc.), salvo indicación contraria, son titularidad de Chayne Moda y
          Complementos S.L. o de terceros que han autorizado su uso, y están protegidos por la
          normativa de propiedad intelectual e industrial vigente.
        </p>
        <p className="mt-4">
          Queda prohibida la reproducción, distribución, comunicación pública o transformación
          total o parcial de los contenidos del Sitio Web sin autorización expresa de Chayne Moda
          y Complementos S.L.
        </p>
      </>
    ),
  },
  {
    title: "13. Responsabilidad",
    body: (
      <>
        <p>
          Chayne Moda y Complementos S.L. no garantiza la disponibilidad continua e
          ininterrumpida del Sitio Web, y no se hace responsable de los daños y perjuicios que
          puedan derivarse de interrupciones, fallos técnicos o errores en el acceso al mismo,
          salvo en los casos en que dicha responsabilidad no pueda excluirse conforme a la
          legislación aplicable.
        </p>
        <p className="mt-4">
          El usuario será responsable del mal uso que realice de los contenidos y servicios del
          Sitio Web, así como del uso de credenciales de acceso a su cuenta.
        </p>
      </>
    ),
  },
  {
    title: "14. Mediación y resolución de conflictos",
    body: (
      <>
        <p>
          En caso de surgir cualquier controversia o discrepancia derivada de la interpretación,
          aplicación o ejecución de estos Términos, o de la relación contractual entre el usuario
          y Chayne Moda y Complementos S.L., ambas partes se comprometen a intentar resolver el
          conflicto de forma amistosa mediante un proceso de{" "}
          <span className="font-semibold text-[#17130f]">mediación</span>, antes de acudir a la
          vía judicial.
        </p>
        <p className="mt-4">
          De no alcanzarse un acuerdo mediante mediación, las partes podrán acudir a la
          jurisdicción competente conforme al apartado siguiente.
        </p>
      </>
    ),
  },
  {
    title: "15. Legislación aplicable y jurisdicción",
    body: (
      <p>
        Los presentes Términos se rigen por la legislación española. Para la resolución de
        cualquier controversia que no pueda resolverse mediante mediación, y sin perjuicio de los
        derechos que la normativa de consumo reconozca a los usuarios consumidores (que podrán
        acudir a los juzgados de su domicilio), las partes se someten a los Juzgados y Tribunales
        que correspondan conforme a derecho.
      </p>
    ),
  },
  {
    title: "16. Modificación de los Términos",
    body: (
      <p>
        Chayne Moda y Complementos S.L. se reserva el derecho a modificar en cualquier momento
        los presentes Términos. Las modificaciones serán efectivas desde el momento de su
        publicación en el Sitio Web. Se recomienda al usuario revisar periódicamente este
        documento.
      </p>
    ),
  },
  {
    title: "17. Contacto",
    body: (
      <>
        <p>
          Para cualquier duda, consulta o reclamación relacionada con estos Términos, el usuario
          puede ponerse en contacto con Chayne Moda y Complementos S.L. a través de:
        </p>
        <ul className="mt-4 space-y-1.5">
          <li>
            <span className="font-semibold text-[#17130f]">Teléfono:</span> 683 495 396
          </li>
          <li>
            <span className="font-semibold text-[#17130f]">Email:</span> letiziamoda22@gmail.com
          </li>
          <li>
            <span className="font-semibold text-[#17130f]">Dirección postal:</span> Calle
            Astorga, local 1, 28947, Fuenlabrada, Madrid, España
          </li>
        </ul>
      </>
    ),
  },
];

export default function TerminosPage() {
  return (
    <PageShell headerTheme="light">
      <section className="bg-[#17130f] px-5 pb-14 pt-32 text-white sm:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9ee8dd]">
            Legal
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
            Términos y Condiciones
          </h1>
          <p className="mt-4 text-sm text-white/70">Última actualización: 22 de junio de 2026</p>
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