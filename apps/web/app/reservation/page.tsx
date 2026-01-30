import { ReservationFlow } from "@/components/home/ReservationFlow";
import { Suspense } from "react";

export default function ReservationPage() {
  return (
    <main className="relative min-h-screen flow-shell text-[#12130F]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 sparkle-field opacity-40"
      />
      <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-[#666]">Chargement...</div>}>
        <ReservationFlow />
      </Suspense>
    </main>
  );
}
