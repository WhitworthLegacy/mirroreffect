import { useState } from 'react';
import { availabilityData, eventsData } from '@/app/data/mockData';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function AvailabilityPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // February 2026
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDateKey = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getEventsForDay = (dateKey: string) => {
    return eventsData.filter(event => event.dateEvent === dateKey);
  };

  const getCellColor = (eventCount: number) => {
    if (eventCount === 0) return 'bg-white';
    if (eventCount <= 1) return 'bg-green-50 border-green-200';
    if (eventCount <= 3) return 'bg-yellow-50 border-[#C1950E]';
    return 'bg-red-50 border-[#CD1B17]';
  };

  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[#12130F] mb-1">Availability Calendar</h1>
        <p className="text-sm text-[#717182]">View event availability and mirror capacity</p>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl text-[#12130F] capitalize">{monthName}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-[#F8F8F8] rounded-md transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#12130F]" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-[#F8F8F8] rounded-md transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[#12130F]" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
            <div key={day} className="text-center text-sm text-[#717182] py-2">
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Calendar days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = getDateKey(day);
            const eventCount = availabilityData[dateKey] || 0;
            const mirrorsRemaining = 4 - eventCount;
            const isSelected = selectedDay === dateKey;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(dateKey)}
                className={`
                  aspect-square border-2 rounded-lg p-2 transition-all
                  ${getCellColor(eventCount)}
                  ${isSelected ? 'ring-2 ring-[#C1950E]' : ''}
                  hover:shadow-md
                `}
              >
                <div className="flex flex-col h-full justify-between">
                  <span className="text-sm text-[#12130F]">{day}</span>
                  <div className="text-xs space-y-1">
                    {eventCount > 0 && (
                      <>
                        <div className="text-[#12130F]">{eventCount} event{eventCount > 1 ? 's' : ''}</div>
                        <div className={`${mirrorsRemaining === 0 ? 'text-[#CD1B17]' : 'text-[#717182]'}`}>
                          {mirrorsRemaining}/4 mirrors
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-[#ECECF0]">
          <h4 className="text-sm text-[#12130F] mb-3">Legend</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border-2 border-green-200 rounded"></div>
              <span className="text-[#717182]">0-1 events (Available)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-50 border-2 border-[#C1950E] rounded"></div>
              <span className="text-[#717182]">2-3 events (Warning)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border-2 border-[#CD1B17] rounded"></div>
              <span className="text-[#717182]">4 events (Blocked)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Events */}
      {selectedDay && selectedDayEvents.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-[#12130F] mb-4">
            Events on {new Date(selectedDay).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </h3>
          <div className="space-y-3">
            {selectedDayEvents.map((event) => (
              <div 
                key={event.id}
                className="flex items-center justify-between p-4 border border-[#ECECF0] rounded-lg hover:bg-[#F8F8F8] transition-colors"
              >
                <div className="flex-1">
                  <h4 className="text-sm text-[#12130F] mb-1">{event.nom}</h4>
                  <p className="text-xs text-[#717182]">{event.lieu}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                    event.pack === 'Premium' 
                      ? 'bg-[#C1950E] text-white'
                      : event.pack === 'Essentiel'
                      ? 'bg-[#4A4A4A] text-white'
                      : 'bg-[#CCCCCC] text-[#12130F]'
                  }`}>
                    {event.pack}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
