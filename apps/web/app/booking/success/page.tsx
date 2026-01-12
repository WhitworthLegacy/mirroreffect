import { BookingSuccess } from "@/components/home/BookingSuccess";

export default function BookingSuccessPage() {
  return (
    <main className="relative min-h-screen romance-bg text-[#12130F]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 sparkle-field opacity-40"
      />
      <BookingSuccess />
    </main>
  );
}
