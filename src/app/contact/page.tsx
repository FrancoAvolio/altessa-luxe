"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';

const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? 'Pronto disponible';

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 1 &&
      form.email.trim().length > 3 &&
      form.message.trim().length > 10
    );
  }, [form]);

  const handleChange = (field: keyof FormState) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = event.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message = typeof data?.error === 'string' ? data.error : 'No pudimos enviar tu mensaje.';
        throw new Error(message);
      }

      setSuccess(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No pudimos enviar tu mensaje.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#050505] to-black text-white">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(213,170,59,0.08),_transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-1 text-xs uppercase tracking-[0.4em] text-gold/80">
                Contacto
              </span>
              <h1 className="mt-8 text-4xl font-semibold tracking-tight text-gold sm:text-5xl">
                Conecta con el universo Altessa
              </h1>
              <p className="mt-4 max-w-xl text-lg text-white/70">
                Compartinos tu consulta sobre piezas exclusivas, disponibilidad o servicios de postventa.
                Nuestro equipo responde en menos de 24 horas.
              </p>

              <div className="mt-12 grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-black/70 to-black/40 p-6 shadow-[0_0_40px_rgba(213,170,59,0.18)]">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-gold/90">Atencion personalizada</h3>
                  <p className="mt-3 text-sm text-white/70">
                    Lunes a sabados de 10 a 20 hs (GMT-3). Coordinamos encuentros privados en nuestro showroom.
                  </p>
                </div>
                <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-black/70 to-black/40 p-6 shadow-[0_0_40px_rgba(213,170,59,0.18)]">
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-gold/90">Linea directa</h3>
                  <p className="mt-3 text-sm text-white/70">
                    WhatsApp exclusivo {WHATSAPP_PHONE}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <form
                onSubmit={handleSubmit}
                className="relative rounded-3xl border border-gold/40 bg-black/70 p-8 shadow-[0_25px_80px_-40px_rgba(213,170,59,0.9)] backdrop-blur"
              >
                <div className="absolute inset-x-12 -top-3 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-xs uppercase tracking-[0.3em] text-gold/80">
                      Nombre completo
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange('name')}
                      placeholder="Ej. Franco Avolio"
                      className="mt-2 w-full rounded-xl border border-gold/40 bg-black px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="email" className="block text-xs uppercase tracking-[0.3em] text-gold/80">
                        Correo electronico
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange('email')}
                        placeholder="tu@correo.com"
                        className="mt-2 w-full rounded-xl border border-gold/40 bg-black px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-xs uppercase tracking-[0.3em] text-gold/80">
                        Telefono (opcional)
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange('phone')}
                        placeholder="+54 9 11 1234 5678"
                        className="mt-2 w-full rounded-xl border border-gold/40 bg-black px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-xs uppercase tracking-[0.3em] text-gold/80">
                      Asunto (opcional)
                    </label>
                    <input
                      id="subject"
                      type="text"
                      value={form.subject}
                      onChange={handleChange('subject')}
                      placeholder="Modelo, referencia o servicio"
                      className="mt-2 w-full rounded-xl border border-gold/40 bg-black px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-xs uppercase tracking-[0.3em] text-gold/80">
                      Mensaje
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={6}
                      value={form.message}
                      onChange={handleChange('message')}
                      placeholder="Contanos en detalle en que podemos ayudarte"
                      className="mt-2 w-full rounded-2xl border border-gold/40 bg-black px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                    <p className="mt-2 text-right text-[11px] text-white/40">
                      Minimo 10 caracteres. Maximo 2000 caracteres.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                      Recibimos tu mensaje. Te responderemos a la brevedad.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className="cursor-pointer group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full border border-gold/60 bg-gradient-to-r from-gold/90 via-gold to-gold/80 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_0_25px_rgba(213,170,59,0.4)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>{submitting ? 'Enviando...' : 'Enviar consulta'}</span>
                    <span className="absolute inset-0 -translate-x-full opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-20 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                  </button>

                  <p className="text-center text-[11px] text-white/30">
                    Enviando este formulario aceptas nuestra politica de privacidad y el uso de tus datos para responder tu consulta.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

