export function getWhatsAppPhone(): string {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "1171466601";
  return raw.replace(/\D/g, "");
}

export function buildWhatsAppLink(message?: string): string {
  const phone = getWhatsAppPhone();
  const base = `https://wa.me/${phone}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

