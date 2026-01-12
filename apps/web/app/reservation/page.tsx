import { ReservationFlow } from "@/components/home/ReservationFlow";

export default function ReservationPage() {
  return (
    <main className="relative min-h-screen flow-shell text-[#12130F]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 sparkle-field opacity-40"
      />
      <ReservationFlow />
    </main>
  );
}
