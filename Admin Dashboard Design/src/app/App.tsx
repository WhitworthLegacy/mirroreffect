import { useState } from 'react';
import { Sidebar } from '@/app/components/Sidebar';
import { DashboardPage } from '@/app/components/DashboardPage';
import { EventsPage } from '@/app/components/EventsPage';
import { AvailabilityPage } from '@/app/components/AvailabilityPage';
import { StudentsPage } from '@/app/components/StudentsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'events':
        return <EventsPage />;
      case 'availability':
        return <AvailabilityPage />;
      case 'students':
        return <StudentsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-20">
      {/* Header */}
      <header className="bg-[#12130F] border-b border-[rgba(204,204,204,0.1)] px-8 py-4">
        <h1 className="text-[#C1950E] tracking-wide">MirrorEffect</h1>
      </header>

      {/* Main Content */}
      <main className="p-8">
        {renderPage()}
      </main>

      {/* Bottom Navigation */}
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
    </div>
  );
}