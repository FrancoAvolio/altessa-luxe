"use client";

import { buildInstagramDmLink } from "@/lib/instagram";
import { FaInstagram } from "react-icons/fa";

export default function InstagramFloating() {
  const href = buildInstagramDmLink();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram"
      className="fixed z-50 right-4 bottom-4 md:right-6 md:bottom-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] shadow-lg"
    >
      <FaInstagram size={28} color="#fff" />
    </a>
  );
}
