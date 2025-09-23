"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { buildInstagramDmLink } from "@/lib/instagram";

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState<FormState>(() => ({
    name: "",
    email: "",
    phone: "",
    subject: searchParams.get("subject") ?? "",
    message: searchParams.get("message") ?? "",
  }));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const instagramDmLink = buildInstagramDmLink();

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 1 &&
      form.email.trim().length > 3 &&
      form.message.trim().length > 10
    );
  }, [form]);

  const handleChange =
    (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      if (error) setError("");
      if (success) setSuccess(false);
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message =
          typeof data?.error === "string"
            ? data.error
            : "No pudimos enviar tu mensaje.";
        throw new Error(message);
      }

      setSuccess(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No pudimos enviar tu mensaje.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const pageClasses = `contact-page min-h-screen ${
    isDark
      ? "bg-gradient-to-b from-black via-[#050505] to-black text-white"
      : "bg-white text-black"
  }`;

  const overlayClass = isDark
    ? "absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(213,170,59,0.08),_transparent_55%)] pointer-events-none"
    : "hidden";

  const mutedText = isDark ? "text-white/70" : "text-black/70";
  const helperTone = isDark ? "text-white/40" : "text-black/40";
  const footerTone = isDark ? "text-white/30" : "text-black/40";

  const cardClass = `rounded-2xl border p-6 shadow-[0_0_40px_rgba(213,170,59,0.18)] ${
    isDark
      ? "border-gold/30 bg-black/70 text-white"
      : "border-gold/10 bg-white text-black"
  }`;

  const formClass = `relative rounded-3xl border backdrop-blur shadow-[0_25px_80px_-40px_rgba(213,170,59,0.9)] ${
    isDark
      ? "border-gold/40 bg-black/70 text-white"
      : "border-gold/15 bg-white text-black"
  }`;

  const inputClass =
    "mt-2 w-full rounded-xl input-theme px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold";

  const textareaClass =
    "mt-2 w-full rounded-2xl input-theme px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold";

  const errorClass = isDark
    ? "rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200"
    : "rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-xs text-red-600";

  const successClass = isDark
    ? "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200"
    : "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700";

  const ghostBtn =
    "inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition hover:scale-[1.01]";
  const primaryLink =
    "inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gradient-to-r from-gold/90 via-gold to-gold/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] shadow-[0_0_20px_rgba(213,170,59,0.35)] hover:scale-[1.01]";

  return (
    <div className={pageClasses}>
      <div className="relative isolate overflow-hidden">
        <div className={overlayClass} />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Barra superior de navegación */}
          <div className="flex items-center justify-between gap-3 pt-8">
            <button
              type="button"
              onClick={() => router.back()}
              className={`${ghostBtn} ${isDark ? "text-white" : "text-black"} cursor-pointer`}
              aria-label="Volver atrás"
              title="Volver atrás"
            >
              ← Volver atrás
            </button>

            <Link
              href="/"
              className={`${primaryLink} ${isDark ? "text-white" : "text-black"} cursor-pointer`}
              aria-label="Ir al inicio"
              title="Ir al inicio"
            >
              Ir al inicio
            </Link>
          </div>

          {/* Contenido principal */}
          <div className="py-16">
            <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-1 text-xs uppercase tracking-[0.4em] text-gold/80">
                  Contacto
                </span>

                <h1 className="mt-8 text-4xl font-semibold tracking-tight text-gold sm:text-5xl">
                  Conecta con el universo Altessa
                </h1>

                <p className={`mt-4 max-w-xl text-lg ${mutedText}`}>
                  Compartinos tu consulta sobre piezas exclusivas,
                  disponibilidad o servicios de postventa. Nuestro equipo
                  responde en menos de 24 horas.
                </p>

                <div className="mt-12 grid gap-6 sm:grid-cols-2">
                  <div className={cardClass}>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-gold/90">
                      Atención personalizada
                    </h3>
                    <p className={`mt-3 text-sm ${mutedText}`}>
                      Lunes a sábados de 10 a 20 hs (GMT-3).
                    </p>
                  </div>

                  <div className={cardClass}>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-gold/90">
                      Línea directa
                    </h3>
                    <p className={`mt-3 text-sm ${mutedText}`}>
                      Escribinos por DM en{" "}
                      <a
                        href={instagramDmLink}
                        className="text-gold underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Instagram
                      </a>{" "}
                      o llená el formulario para coordinar.
                    </p>
                  </div>
                </div>

                <div className="mt-12 space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-gold/80">
                    Visitas
                  </h2>
                  <div className={cardClass}>
                    <p className={`text-sm ${mutedText}`}>
                      Solo con cita previa.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <form onSubmit={handleSubmit} className={`${formClass} p-8`}>
                  <div className="absolute inset-x-12 -top-3 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-xs uppercase tracking-[0.3em] text-gold/80"
                      >
                        Nombre completo
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange("name")}
                        placeholder="Ej. John Doe"
                        className={inputClass}
                      />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-xs uppercase tracking-[0.3em] text-gold/80"
                        >
                          Correo electrónico
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={handleChange("email")}
                          placeholder="tu@correo.com"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-xs uppercase tracking-[0.3em] text-gold/80"
                        >
                          Teléfono (opcional)
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          value={form.phone}
                          onChange={handleChange("phone")}
                          placeholder="+54 9 11 1234 5678"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-xs uppercase tracking-[0.3em] text-gold/80"
                      >
                        Asunto (opcional)
                      </label>
                      <input
                        id="subject"
                        type="text"
                        value={form.subject}
                        onChange={handleChange("subject")}
                        placeholder="Modelo, referencia o servicio"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-xs uppercase tracking-[0.3em] text-gold/80"
                      >
                        Mensaje
                      </label>
                      <textarea
                        id="message"
                        required
                        rows={6}
                        value={form.message}
                        onChange={handleChange("message")}
                        placeholder="Contanos en detalle en qué podemos ayudarte"
                        className={textareaClass}
                      />
                      <p
                        className={`mt-2 text-right text-[11px] ${helperTone}`}
                      >
                        Mínimo 10 caracteres. Máximo 2000 caracteres.
                      </p>
                    </div>

                    {error && <div className={errorClass}>{error}</div>}

                    {success && (
                      <div className={successClass}>
                        Recibimos tu mensaje. Te responderemos a la brevedad.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!canSubmit || submitting}
                      className={[
                        "cursor-pointer group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full border border-gold/60 bg-gradient-to-r from-gold/90 via-gold to-gold/80 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] shadow-[0_0_25px_rgba(213,170,59,0.4)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50",
                        isDark ? "text-white" : "text-black",
                      ].join(" ")}
                    >
                      <span>
                        {submitting ? "Enviando..." : "Enviar consulta"}
                      </span>
                      <span className="absolute inset-0 -translate-x-full opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    </button>

                    <p className={`text-center text-[11px] ${footerTone}`}>
                      Enviando este formulario aceptás nuestra política de
                      privacidad y el uso de tus datos para responder tu
                      consulta.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
          {/* /Contenido principal */}
        </div>
      </div>
    </div>
  );
}
