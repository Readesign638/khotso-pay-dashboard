interface SidebarProps {
  onNavigate: (view: 'dashboard' | 'transactions' | 'analytics' | 'wallet') => void;
  activeView: string;
}

export default function Sidebar({ onNavigate, activeView }: SidebarProps) {
  const getLinkClass = (view: string) => 
    `flex items-center justify-center md:justify-start gap-3 p-3 md:p-4 rounded-2xl font-bold transition-all ${
      activeView === view 
        ? 'bg-blue-600 text-white shadow-lg' 
        : 'text-slate-400 hover:bg-slate-50'
    }`;

  return (
    /* MOBILE: fixed at bottom, full width, horizontal row
      DESKTOP (md:): fixed at left, 64px width, vertical column 
    */
    <aside className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 p-2 z-50 
                      md:relative md:w-64 md:h-screen md:border-r md:border-t-0 md:p-6 flex md:flex-col">
      
      <nav className="flex flex-row justify-around w-full md:flex-col md:space-y-4">
        
        <button onClick={() => onNavigate('dashboard')} className={getLinkClass('dashboard')}>
          <span className="text-xs md:text-base">Dashboard</span>
        </button>

        <button onClick={() => onNavigate('transactions')} className={getLinkClass('transactions')}>
          <span className="text-xs md:text-base">Transactions</span>
        </button>

        <button onClick={() => onNavigate('analytics')} className={getLinkClass('analytics')}>
          <span className="text-xs md:text-base">Analytics</span>
        </button>

        <button onClick={() => onNavigate('wallet')} className={getLinkClass('wallet')}>
          <span className="text-xs md:text-base">Wallet</span>
        </button>

      </nav>
    </aside>
  );
}