interface SidebarProps {
  onNavigate: (view: 'dashboard' | 'transactions' | 'analytics' | 'wallet') => void;
  activeView: string;
}

export default function Sidebar({ onNavigate, activeView }: SidebarProps) {
  // Use these classes to show which tab is "Active"
  const getLinkClass = (view: string) => 
    `flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${
      activeView === view 
        ? 'bg-blue-600 text-white shadow-lg' 
        : 'text-slate-400 hover:bg-slate-50'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-100 p-6 flex flex-col h-screen">
      <nav className="space-y-4">
        <button onClick={() => onNavigate('dashboard')} className={getLinkClass('dashboard')}>
          Dashboard
        </button>
        <button onClick={() => onNavigate('transactions')} className={getLinkClass('transactions')}>
          Transactions
        </button>
        {/* Add more buttons here... */}
      </nav>
    </aside>
  );
}