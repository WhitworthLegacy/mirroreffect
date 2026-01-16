import { KPICard } from '@/app/components/KPICard';
import { kpiData, caGeneratedData, eventsPerPackData } from '@/app/data/mockData';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw } from 'lucide-react';

export function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#12130F] mb-1">Dashboard</h1>
          <p className="text-sm text-[#717182]">CEO / Ops Overview</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border-2 border-[#C1950E] text-[#C1950E] rounded-md hover:bg-[#C1950E] hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="CA Total (Monthly)" value={kpiData.caTotal} />
        <KPICard title="CA Généré" value={kpiData.caGenere} />
        <KPICard title="Marge Brute Opé (Events)" value={kpiData.margeBruteOpe} />
        <KPICard title="Cashflow Net" value={kpiData.cashflowNet} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CA Generated Over Time */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="mb-6 text-[#12130F]">CA Généré Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={caGeneratedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ECECF0" />
              <XAxis 
                dataKey="month" 
                stroke="#717182"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#717182"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #CCCCCC',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => [`${value.toLocaleString('fr-FR')} €`, 'CA Généré']}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#C1950E" 
                strokeWidth={2}
                dot={{ fill: '#C1950E', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Events per Pack */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="mb-6 text-[#12130F]">Events per Pack</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={eventsPerPackData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ECECF0" />
              <XAxis 
                dataKey="month" 
                stroke="#717182"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#717182"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #CCCCCC',
                  borderRadius: '6px',
                }}
                formatter={(value: number) => [`${value} events`, 'Total']}
              />
              <Bar 
                dataKey="value" 
                fill="#C1950E"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
