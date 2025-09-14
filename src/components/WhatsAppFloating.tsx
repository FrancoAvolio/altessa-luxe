"use client";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { FaWhatsapp } from "react-icons/fa";

export default function WhatsAppFloating() {
  const href = buildWhatsAppLink("Hola! Quisiera hacer una consulta.");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed z-50 right-4 bottom-4 md:right-6 md:bottom-6 flex items-center justify-center rounded-full shadow-lg"
      style={{ width: 56, height: 56, backgroundColor: "#25D366" }}
    >
      <FaWhatsapp size={28} color="#fff" />
    </a>
  );
}

