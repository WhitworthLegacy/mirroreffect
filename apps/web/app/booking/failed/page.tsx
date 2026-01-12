import { BookingFailed } from "@/components/home/BookingFailed";
import { Suspense } from "react";

export default function BookingFailedPage() {
  return (
    <main className="relative min-h-screen romance-bg text-[#12130F]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 sparkle-field opacity-40"
      />
      <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-[#666]">Chargement...</div>}>
        <BookingFailed />
      </Suspense>
    </main>
  );
}
