import PaymentsList from "@/components/PaymentsList";
import { getPayments } from "@/lib/adminData";

export default async function PaymentsPage() {
  const { payments, error } = await getPayments();

  return (
    <main className="admin-page">
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 4 }}>Payments</h1>
        <p className="admin-muted">Paiements Mollie</p>
      </header>
      {error && (
        <div className="admin-card" style={{ marginBottom: 24, backgroundColor: "rgba(205, 27, 23, 0.05)", borderColor: "var(--fire-red)" }}>
          <p style={{ color: "var(--fire-red)", margin: 0 }}>{error}</p>
        </div>
      )}
      <PaymentsList payments={payments} />
    </main>
  );
}
