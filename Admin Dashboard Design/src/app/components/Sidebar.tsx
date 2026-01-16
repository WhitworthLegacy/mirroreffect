import { 
  LayoutDashboard, 
  Calendar, 
  CalendarClock, 
  Users,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'availability', label: 'Availability', icon: CalendarClock },
    { id: 'students', label: 'Students', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#12130F] border-t border-[rgba(204,204,204,0.1)] z-50">
      <div className="max-w-screen-2xl mx-auto px-4">
        <ul className="flex items-center justify-around">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <li key={item.id} className="flex-1">
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`
                    w-full flex flex-col items-center gap-1 px-4 py-3 transition-all
                    ${isActive 
                      ? 'text-[#C1950E] border-t-2 border-[#C1950E]' 
                      : 'text-[#F8F8F8] hover:text-[#C1950E]'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                  <span className="text-xs">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}