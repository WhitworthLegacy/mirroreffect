interface KPICardProps {
  title: string;
  value: number;
  subtitle?: string;
  format?: 'currency' | 'number';
}

export function KPICard({ title, value, subtitle = 'source: Google Sheets', format = 'currency' }: KPICardProps) {
  const formattedValue = format === 'currency' 
    ? `${value.toLocaleString('fr-FR')} €`
    : value.toLocaleString('fr-FR');

  return (
    <div className="bg-white rounded-lg p-6 border-l-4 border-[#C1950E] shadow-sm">
      <div className="space-y-2">
        <h3 className="text-sm text-[#717182] uppercase tracking-wide">{title}</h3>
        <div className="text-3xl text-[#12130F]">{formattedValue}</div>
        <p className="text-xs text-[#CCCCCC]">{subtitle}</p>
      </div>
    </div>
  );
}
