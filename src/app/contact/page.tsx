import { Suspense } from "react";
import ContactClient from "./ContactClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ContactClient />
    </Suspense>
  );
}
