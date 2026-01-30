import { useState, useMemo } from 'react';
import { eventsData, Event } from '@/app/data/mockData';
import { Search, Eye } from 'lucide-react';
import { EventModal } from '@/app/components/EventModal';

export function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Event; direction: 'asc' | 'desc' } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const filteredAndSortedEvents = useMemo(() => {
    let result = [...eventsData];

    // Filter
    if (searchTerm) {
      result = result.filter((event) =>
        event.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.eventDetails.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [searchTerm, sortConfig]);

  const handleSort = (key: keyof Event) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[#12130F] mb-1">Events</h1>
        <p className="text-sm text-[#717182]">Manage all events and bookings</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717182]" />
          <input
            type="text"
            placeholder="Search by name, email, or event ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#CCCCCC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C1950E] focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8F8F8] sticky top-0">
              <tr>
                <th 
                  className="text-left px-6 py-4 text-sm text-[#12130F] cursor-pointer hover:bg-[#ECECF0]"
                  onClick={() => handleSort('dateEvent')}
                >
                  Date Event
                </th>
                <th 
                  className="text-left px-6 py-4 text-sm text-[#12130F] cursor-pointer hover:bg-[#ECECF0]"
                  onClick={() => handleSort('nom')}
                >
                  Nom
                </th>
                <th 
                  className="text-left px-6 py-4 text-sm text-[#12130F] cursor-pointer hover:bg-[#ECECF0]"
                  onClick={() => handleSort('pack')}
                >
                  Pack
                </th>
                <th className="text-left px-6 py-4 text-sm text-[#12130F]">
                  Lieu
                </th>
                <th className="text-left px-6 py-4 text-sm text-[#12130F]">
                  Commercial
                </th>
                <th 
                  className="text-left px-6 py-4 text-sm text-[#12130F] cursor-pointer hover:bg-[#ECECF0]"
                  onClick={() => handleSort('margeBrute')}
                >
                  Marge Brute
                </th>
                <th className="text-left px-6 py-4 text-sm text-[#12130F]">
                  Acompte
                </th>
                <th className="text-left px-6 py-4 text-sm text-[#12130F]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedEvents.map((event, index) => (
                <tr 
                  key={event.id}
                  className={`border-t border-[#ECECF0] hover:bg-[#F8F8F8] cursor-pointer ${
                    index % 2 === 1 ? 'bg-[#FAFAFA]' : ''
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <td className="px-6 py-4 text-sm text-[#12130F]">
                    {new Date(event.dateEvent).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#12130F]">
                    {event.nom}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                      event.pack === 'Premium' 
                        ? 'bg-[#C1950E] text-white'
                        : event.pack === 'Essentiel'
                        ? 'bg-[#4A4A4A] text-white'
                        : 'bg-[#CCCCCC] text-[#12130F]'
                    }`}>
                      {event.pack}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#12130F]">
                    {event.lieu}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#12130F]">
                    {event.commercial}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#12130F]">
                    {event.margeBrute.toLocaleString('fr-FR')} €
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${
                      event.acompteStatus === 'Payé'
                        ? 'border-[#C1950E] text-[#C1950E]'
                        : 'border-[#CD1B17] text-[#CD1B17]'
                    }`}>
                      {event.acompteStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      className="p-2 hover:bg-[#ECECF0] rounded-md transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                    >
                      <Eye className="w-4 h-4 text-[#717182]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedEvents.length === 0 && (
          <div className="text-center py-12 text-[#717182]">
            No events found matching your search.
          </div>
        )}
      </div>

      {/* Event Modal */}
      {selectedEvent && (
        <EventModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </div>
  );
}
