"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { PageShell } from "../components";

type SubmitState =
  | { status: "idle"; message: string }
  | { status: "loading"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s()-]{7,}$/;

function isValidContact(value: string) {
  const trimmed = value.trim();
  return EMAIL_REGEX.test(trimmed) || PHONE_REGEX.test(trimmed);
}

export default function ContactPage() {
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
    message: "",
  });

  const [viewMode, setViewMode] = useState<"formulario" | "info">(
    "formulario"
  );

  const [contactValue, setContactValue] = useState("");
  const [contactTouched, setContactTouched] = useState(false);

  const contactHasError =
    contactTouched &&
    contactValue.trim() !== "" &&
    !isValidContact(contactValue);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const payload = {
      name: String(formData.get("name") ?? ""),
      contact: String(formData.get("contact") ?? ""),
      message: String(formData.get("message") ?? ""),
    };

    if (!isValidContact(payload.contact)) {
      setContactTouched(true);
      setSubmitState({
        status: "error",
        message:
          "Introduce un email o teléfono válido para poder contactarte.",
      });
      return;
    }

    setSubmitState({
      status: "loading",
      message: "Enviando solicitud...",
    });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await response.json();
      event.currentTarget.reset();

      setSubmitState({
        status: "success",
        message:
          "Solicitud enviada. Te respondemos pronto con disponibilidad y talla recomendada.",
      });
    } catch {
      setSubmitState({
        status: "error",
        message: "Ha ocurrido un error. Inténtalo de nuevo.",
      });
    }
  }

  return (
    <PageShell headerTheme="light">
      <section className="grid min-h-screen bg-white pt-20 lg:grid-cols-[1fr_1fr]">

        {/* LEFT: FORM */}
        <div className="flex items-center px-5 py-16 sm:px-8 opacity-0 animate-[fadeInLeft_0.9s_ease-out_forwards]">
          <div className="mx-auto max-w-xl w-full">

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d0513f]">
              Contacto
            </p>

            <h1 className="mt-5 text-5xl font-semibold leading-tight sm:text-6xl">
              Cuéntanos qué ocasión tienes en mente.
            </h1>

            <p className="mt-6 text-lg leading-8 text-[#6b6259]">
              Te respondemos con disponibilidad, talla recomendada y una
              selección corta para que decidir sea fácil.
            </p>

            <div className="mt-8 flex overflow-hidden rounded-lg border border-[#cfc7bd]">
              <button
                type="button"
                onClick={() => setViewMode("formulario")}
                className={`flex-1 py-3 text-sm font-semibold transition ${
                  viewMode === "formulario"
                    ? "bg-[#d0513f] text-white"
                    : "bg-white text-[#17130f]"
                }`}
              >
                Formulario
              </button>

              <button
                type="button"
                onClick={() => setViewMode("info")}
                className={`flex-1 py-3 text-sm font-semibold transition ${
                  viewMode === "info"
                    ? "bg-[#d0513f] text-white"
                    : "bg-white text-[#17130f]"
                }`}
              >
                Información directa
              </button>
            </div>

            {viewMode === "formulario" ? (
              <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
                <input
                  name="name"
                  required
                  minLength={2}
                  className="min-h-12 border border-[#cfc7bd] bg-[#fbfaf7] px-4 outline-none focus:border-[#d0513f]"
                  placeholder="Nombre"
                />

                <div>
                  <input
                    name="contact"
                    required
                    minLength={5}
                    value={contactValue}
                    onChange={(e) => setContactValue(e.target.value)}
                    onBlur={() => setContactTouched(true)}
                    aria-invalid={contactHasError}
                    className={`min-h-12 w-full border bg-[#fbfaf7] px-4 outline-none ${
                      contactHasError
                        ? "border-[#e07a5f] focus:border-[#e07a5f]"
                        : "border-[#cfc7bd] focus:border-[#d0513f]"
                    }`}
                    placeholder="Email o WhatsApp"
                  />

                  {contactHasError && (
                    <p className="mt-1 text-xs text-[#b42318]">
                      Introduce un email o teléfono válido.
                    </p>
                  )}
                </div>

                <textarea
                  name="message"
                  required
                  minLength={5}
                  className="min-h-36 border border-[#cfc7bd] bg-[#fbfaf7] px-4 py-3 outline-none focus:border-[#d0513f]"
                  placeholder="Ocasión, fecha, talla y colores que te apetecen"
                />

                {submitState.message && (
                  <p
                    className={`border px-4 py-3 text-sm ${
                      submitState.status === "success"
                        ? "border-[#9dcdb4] bg-[#f1faf5] text-[#1b5a3a]"
                        : submitState.status === "error"
                        ? "border-[#f2b6b6] bg-[#fff4f4] text-[#b42318]"
                        : "border-[#cfc7bd] bg-[#fbfaf7]"
                    }`}
                  >
                    {submitState.message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    submitState.status === "loading" ||
                    (contactTouched && !isValidContact(contactValue))
                  }
                  className="min-h-12 bg-[#d0513f] px-6 text-sm font-semibold text-white transition hover:bg-[#17130f] disabled:cursor-not-allowed disabled:bg-[#cfc7bd]"
                >
                  {submitState.status === "loading"
                    ? "Enviando..."
                    : "Enviar solicitud"}
                </button>
              </form>
            ) : (
              <div className="mt-8 space-y-8 animate-fade-up">
                <div className="rounded-lg border border-[#cfc7bd] bg-[#fbfaf7] p-6">
                  <h2 className="text-xl font-semibold">
                    Información de contacto
                  </h2>

                  <div className="mt-5 space-y-5 text-[#6b6259]">
                    <div>
                      <p className="font-semibold text-[#17130f]">Teléfono | +34683495396 </p>
                      <a href="tel:+34683495396" className="mt-2 inline-flex items-center gap-3 rounded border border-[#e2ddd5] bg-white px-3 py-2 text-[#d0513f] transition hover:border-[#d0513f] hover:bg-[#fff8f5]">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f7f3ee]">
                          <Image src="/SM/whatsapp.png" alt="WhatsApp" width={26} height={26} className="object-contain" />
                        </div>
                        <span className="font-semibold">WhatsApp</span>
                      </a>
                    </div>

                    <div>
                      <p className="font-semibold text-[#17130f]">Correo | letiziamoda22@gmail.com</p>
                      <a href="mailto:letiziamoda22@gmail.com" className="mt-2 inline-flex items-center gap-3 rounded border border-[#e2ddd5] bg-white px-3 py-2 text-[#d0513f] transition hover:border-[#d0513f] hover:bg-[#fff8f5]">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f7f3ee]">
                          <Image src="/SM/sobre.png" alt="Correo" width={26} height={26} className="object-contain" />
                        </div>
                        <span className="font-semibold">Correo</span>
                      </a>
                    </div>

                    <div>
                      <p className="font-semibold text-[#17130f]">Redes sociales</p>
                      <div className="mt-3 flex flex-col gap-2">
                        <a href="https://www.tiktok.com/@tanna.moda?is_from_webapp=1&sender_device=pc" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 rounded border border-[#e2ddd5] bg-white px-3 py-2 text-[#17130f] transition hover:border-[#d0513f] hover:bg-[#fff8f5]">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f7f3ee]">
                            <Image src="/SM/tik-tok.png" alt="TikTok" width={26} height={26} className="object-contain" />
                          </div>
                          <span className="font-semibold">TikTok</span>
                        </a>
                        <a href="https://www.instagram.com/tanna.moda.mayorista" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 rounded border border-[#e2ddd5] bg-white px-3 py-2 text-[#17130f] transition hover:border-[#d0513f] hover:bg-[#fff8f5]">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f7f3ee]">
                            <Image src="/SM/instagram.png" alt="Instagram" width={26} height={26} className="object-contain" />
                          </div>
                          <span className="font-semibold">Instagram</span>
                        </a>
                        <a href="https://www.facebook.com/profile.php?id=61590628979456" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 rounded border border-[#e2ddd5] bg-white px-3 py-2 text-[#17130f] transition hover:border-[#d0513f] hover:bg-[#fff8f5]">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f7f3ee]">
                            <Image src="/SM/facebook.png" alt="Facebook" width={26} height={26} className="object-contain" />
                          </div>
                          <span className="font-semibold">Facebook</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Link
              href="/coleccion"
              className="mt-6 inline-block text-sm font-semibold text-[#d0513f]"
            >
              Ver catálogo antes
            </Link>
          </div>
        </div>

        {/* RIGHT: IMAGE */}
        <div className="relative min-h-[520px] overflow-hidden bg-[#ece8df] opacity-0 animate-[fadeInRight_0.9s_ease-out_forwards]">
          <Image
            src="/fotos/MM245.png"
            alt="Vestido verde Tanna"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

      </section>
    </PageShell>
  );
}