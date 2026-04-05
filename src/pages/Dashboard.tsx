import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, Plus, Trash2, Edit3, X, LogOut, 
  CheckCircle2, FileText, Download, LayoutDashboard, ListOrdered, 
  AlertCircle, ShieldCheck, Scale, Cookie, MessageCircle, Mail, Lock // Combined here
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Helmet, HelmetProvider } from 'react-helmet-async';

// Internal Components & Types
import Sidebar from '../components/Sidebar';
import { StatCard } from '../components/StatCard';
import { TaxEstimator } from '../components/TaxEstimator';
import type { Transaction, PaymentMethod, TransactionStatus } from '../types/schema';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { TransactionService } from '../services/transactionService';
import { formatCurrency, getProviderLogo } from '../utils/formatters';
type View = 'dashboard' | 'transactions' | 'analytics' | 'wallet';

/**
 * SEO Component: Improves discoverability for Search Engines.
 */
const SEO = ({ view }: { view: string }) => {
  const title = `${view.charAt(0).toUpperCase() + view.slice(1)} | Khotso-Pay`;
  const description = "Manage your M-Pesa, EcoCash, and Cash transactions with Lesotho's premier merchant ledger.";
  
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#2563eb" />
    </Helmet>
  );
};

export default function Dashboard() {
  // --- STATE ---
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>(''); 
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [customerName, setCustomerName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('M-Pesa');
  const [status, setStatus] = useState<TransactionStatus>('Completed');
  const [activeFooterTab, setActiveFooterTab] = useState<string | null>(null); 
  const [allTransactions, setAllTransactions] = useLocalStorage<Transaction[]>('khotsopay_tx', []);
  
  // --- INITIALIZATION ---
  useEffect(() => {
    if (!allTransactions || allTransactions.length === 0) {
      const today = new Date().toLocaleDateString('en-LS', { month: 'short', day: 'numeric', year: 'numeric' });
      setAllTransactions([
        { id: '1', name: 'Mphethi Store', amount: 400, method: 'Cash', status: 'Completed', date: today, time: '08:42' },
        { id: '2', name: 'Rea Sekhitlane', amount: 500, method: 'M-Pesa', status: 'Pending', date: today, time: '10:28' }
      ]);
    }
  }, [allTransactions, setAllTransactions]);

  // --- MEMOIZED CALCULATIONS ---
  const dailyStats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-LS', { month: 'short', day: 'numeric', year: 'numeric' });
    const todaysTransactions = (allTransactions || []).filter(tx => tx.date === todayStr);
    
    return {
      revenue: todaysTransactions.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0),
      mpesa: todaysTransactions.filter(t => t.method === 'M-Pesa' && t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0),
      ecocash: todaysTransactions.filter(t => t.method === 'EcoCash' && t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0),
      cash: todaysTransactions.filter(t => t.method === 'Cash' && t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0),
      owed: todaysTransactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0),
      date: todayStr
    };
  }, [allTransactions]);

  const stats = useMemo(() => TransactionService.calculateDashboardStats(allTransactions || []), [allTransactions]);

  const filteredTransactions = useMemo(() => {
    return (allTransactions || []).filter((tx) =>
      tx.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.method.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allTransactions, searchTerm]);

  // --- HANDLERS ---
  const resetForm = useCallback(() => {
    setEditingId(null);
    setCustomerName('');
    setAmount('');
    setMethod('M-Pesa');
    setStatus('Completed');
    setIsModalOpen(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const txData: Transaction = {
      id: editingId || crypto.randomUUID(),
      name: customerName,
      amount: parseFloat(amount),
      method,
      status,
      date: now.toLocaleDateString('en-LS', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: now.toLocaleTimeString('en-LS', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };

    if (editingId) {
      setAllTransactions(allTransactions.map(t => t.id === editingId ? txData : t));
    } else {
      setAllTransactions([txData, ...allTransactions]);
    }
    resetForm();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text('KHOTSO-PAY DAILY CASH-UP', 14, 20);
    doc.text(`Date: ${dailyStats.date}`, 14, 28);
    autoTable(doc, {
      startY: 35,
      head: [['Category', 'Amount (LSL)']],
      body: [
        ['Total Revenue', formatCurrency(dailyStats.revenue)],
        ['M-Pesa', formatCurrency(dailyStats.mpesa)],
        ['EcoCash', formatCurrency(dailyStats.ecocash)],
        ['Cash', formatCurrency(dailyStats.cash)],
        ['Owed (Sekoloto)', formatCurrency(dailyStats.owed)],
      ],
      headStyles: { fillColor: [30, 58, 138] },
    });
    doc.save(`KhotsoPay_Report_${dailyStats.date}.pdf`);
  };
const sendReminder = (tx: Transaction, type: 'whatsapp' | 'email') => {
  const message = `Lumela! This is a friendly reminder from Khotso-Pay regarding the balance of ${formatCurrency(tx.amount)} for your transaction on ${tx.date}. Please settle via M-Pesa or EcoCash. Khotso!`;
  
  if (type === 'whatsapp') {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  } else {
    const subject = encodeURIComponent("Payment Reminder - Khotso-Pay");
    const mailtoUrl = `mailto:?subject=${subject}&body=${encodeURIComponent(message)}`;
    
    // Using window.open with '_self' triggers the mail client 
    // without triggering the "immutability" error or leaving the page.
    window.open(mailtoUrl, '_self');
  }
};
  return (
    <HelmetProvider>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <SEO view={currentView} />
        
        <Sidebar activeView={currentView} onNavigate={setCurrentView} />
        
        <main className="flex-1 p-4 sm:p-6 md:p-12 pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-12 overflow-y-auto w-full max-w-7xl mx-auto">
          
          {/* --- HEADER --- */}
          <header className="mb-8 flex justify-between items-center sticky top-0 bg-slate-50/80 backdrop-blur-md z-40 py-2">
            <nav className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar" aria-label="Khotso-Pay views">
              <button 
                onClick={() => setCurrentView('dashboard')} 
                className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] ${currentView === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-slate-400'}`}
              >
                <LayoutDashboard size={16}/> Summary
              </button>
              <button 
                onClick={() => setCurrentView('transactions')} 
                className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] ${currentView === 'transactions' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-slate-400'}`}
              >
                <ListOrdered size={16}/> Ledger
              </button>
            </nav>

            <button 
              onClick={() => confirm("Logout?") && window.location.reload()} 
              className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-red-500 hover:border-red-100 transition-all active:scale-90"
              aria-label="Logout session"
            >
              <LogOut size={20} />
            </button>
          </header>

          {/* --- DASHBOARD VIEW --- */}
          {currentView === 'dashboard' && (
            <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              <section className="relative overflow-hidden rounded-[32px] md:rounded-[48px] bg-white border border-slate-100 p-6 md:p-14 shadow-sm">
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Active Terminal • Lesotho</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
                      Lumela<span className="text-blue-600">!</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg max-w-sm">
                       Manage your <span className="text-slate-900 font-bold">business transactions</span> with ease.
                    </p>
                  </div>

                  <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }} 
                    className="group w-full lg:w-auto flex items-center justify-center gap-4 bg-blue-600 text-white px-10 py-6 rounded-[28px] font-black text-xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all duration-300"
                  >
                    <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                    <span className="uppercase italic tracking-tight">Record Sale</span>
                  </button>
                </div>
              </section>

              <article className="bg-slate-900 p-6 md:p-10 rounded-[32px] md:rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col gap-8">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/10 rounded-2xl border border-white/5"><FileText size={24} className="text-blue-400"/></div>
                      <div>
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cash-Up Summary</h2>
                        <p className="text-xl font-bold italic">{dailyStats.date}</p>
                      </div>
                    </div>
                    <button onClick={exportToPDF} className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white text-white hover:text-slate-900 px-4 py-2 rounded-xl font-black text-[10px] transition-all">
                      <Download size={14} /> EXPORT TO PDF
                    </button>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    {[
                      { label: 'Revenue', val: dailyStats.revenue, sub: 'Total Paid' },
                      { label: 'Digital', val: dailyStats.mpesa + dailyStats.ecocash, sub: 'Mobile Money' },
                      { label: 'Cash', val: dailyStats.cash, sub: 'On Hand' },
                      { label: 'Sekoloto', val: dailyStats.owed, sub: 'Pending', alert: true }
                    ].map((item) => (
                      <div key={item.label} className={`p-5 rounded-3xl border ${item.alert ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/5'}`}>
                        <p className={`text-[10px] font-black uppercase mb-1 ${item.alert ? 'text-amber-400' : 'text-slate-400'}`}>{item.label}</p>
                        <p className="text-2xl font-black">{formatCurrency(item.val)}</p>
                        <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter mt-1">{item.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard title="Total Volume" value={formatCurrency(stats.totalRevenue)} change="+8.4%" />
                <StatCard title="M-Pesa" value={formatCurrency(stats.mpesaVolume)} color="red" />
                <StatCard title="EcoCash" value={formatCurrency(stats.ecocashVolume)} color="purple" />
                <StatCard title="Outstanding" value={formatCurrency(stats.totalPending)} color="amber" />
              </div>
              
              <TaxEstimator totalRevenue={stats.totalRevenue} />
            </div>
          )}

          {/* --- TRANSACTIONS VIEW --- */}
          {currentView === 'transactions' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <section className="bg-white rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 md:p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Business Ledger</h3>
                    <p className="text-slate-400 text-sm font-medium">Historical transaction records</p>
                  </div>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      placeholder="Find customer..." 
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all text-sm" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400 text-[10px] uppercase font-black tracking-widest bg-slate-50/50">
                        <th className="py-5 px-8">Client</th>
                        <th className="py-5 px-8">Value</th>
                        <th className="py-5 px-8">Method</th>
                        <th className="py-5 px-8 text-right">Settings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
  {filteredTransactions.map((tx) => (
    <tr key={tx.id} className="group hover:bg-slate-50/80 transition-colors">
      {/* --- CLIENT COLUMN WITH REMINDERS --- */}
      <td className="py-6 px-8">
        <span className="text-base font-black text-slate-900 block">{tx.name}</span>
        <span className="text-[10px] text-slate-400 font-bold uppercase">
          {tx.date} • {tx.time}
        </span>

        {/* Reminders only show for 'Sekoloto' (Pending) status */}
        {tx.status === 'Pending' && (
          <div className="flex gap-2 mt-3 animate-in fade-in slide-in-from-left-2">
            <button
              onClick={() => sendReminder(tx, 'whatsapp')}
              className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all"
              aria-label="Remind via WhatsApp"
              title="Send WhatsApp Reminder"
            >
              <MessageCircle size={14} />
            </button>
            <button
              onClick={() => sendReminder(tx, 'email')}
              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
              aria-label="Remind via Email"
              title="Send Email Reminder"
            >
              <Mail size={14} />
            </button>
          </div>
        )}
      </td>

      {/* --- VALUE COLUMN --- */}
      <td className="py-6 px-8">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-blue-900">{formatCurrency(tx.amount)}</span>
          {tx.status === 'Pending' && (
            <span className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-full font-black flex items-center gap-1">
              <AlertCircle size={10} /> OWED
            </span>
          )}
        </div>
      </td>

      {/* --- METHOD COLUMN --- */}
      <td className="py-6 px-8">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 w-fit rounded-xl">
          <img 
            src={getProviderLogo(tx.method)} 
            alt="" 
            className="h-4 w-4 object-contain grayscale group-hover:grayscale-0 transition-all" 
          />
          <span className="text-[10px] font-black uppercase text-slate-600">{tx.method}</span>
        </div>
      </td>

      {/* --- SETTINGS/ACTIONS COLUMN --- */}
      <td className="py-6 px-8 text-right">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              setEditingId(tx.id);
              setCustomerName(tx.name);
              setAmount(tx.amount.toString());
              setMethod(tx.method);
              setStatus(tx.status);
              setIsModalOpen(true);
            }}
            className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
            aria-label={`Edit record for ${tx.name}`}
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => confirm(`Delete record?`) && setAllTransactions(allTransactions.filter(t => t.id !== tx.id))}
            className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-red-600 rounded-xl transition-all"
            aria-label={`Delete record for ${tx.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* --- SALE MODAL --- */}
          {isModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
              <div 
                role="dialog" aria-modal="true"
                className="bg-white w-full max-w-xl rounded-t-[40px] sm:rounded-[48px] p-8 md:p-14 shadow-3xl relative animate-in slide-in-from-bottom sm:zoom-in duration-300 max-h-[95vh] overflow-y-auto"
              >
                <button 
                  onClick={resetForm} 
                  className="absolute right-8 top-8 text-slate-300 hover:text-slate-900 transition-colors p-2" 
                  aria-label="Close modal"
                >
                  <X size={32} />
                </button>

                <h2 className="text-3xl font-black text-slate-900 mb-10 uppercase italic tracking-tighter">
                  {editingId ? 'Modify Ledger' : 'New Transaction'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Customer Name</label>
                    <input required placeholder="Client Identity" className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-lg" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Amount (LSL)</label>
                    <input required type="number" step="0.01" placeholder="0.00" className="w-full p-6 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-black text-4xl text-blue-600" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['M-Pesa', 'EcoCash', 'Cash'] as const).map((m) => (
                      <button key={m} type="button" onClick={() => setMethod(m)} 
                        className={`py-4 min-h-[56px] rounded-2xl text-[11px] font-black uppercase border-2 transition-all active:scale-95 ${method === m ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm' : 'border-slate-100 text-slate-400'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3 bg-slate-100 p-2 rounded-3xl">
                    {(['Completed', 'Pending'] as const).map((s) => (
                      <button key={s} type="button" onClick={() => setStatus(s)} 
                        className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase transition-all ${status === s ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
                      >
                        {s === 'Completed' ? 'Fully Paid' : 'Pending (Sekoloto)'}
                      </button>
                    ))}
                  </div>

                  <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black text-xl shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95">
                    <CheckCircle2 size={24} strokeWidth={3} /> {editingId ? 'Update Record' : 'Confirm & Save'}
                  </button>
                </form>
              </div>
            </div>
          )}

          <footer className="mt-24 pt-12 border-t border-slate-200/60 pb-12">
  <div className="flex flex-col md:flex-row justify-between items-center gap-10">
    
    {/* Brand & Copyright Stack */}
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 bg-blue-600 rounded-[14px] flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-100">
        KP
      </div>
      <div>
        <span className="text-lg font-black text-slate-900 tracking-tighter uppercase italic block leading-none">
          Khotso-Pay
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
            Merchant Suite v2.0
          </span>
          <span className="text-[8px] text-slate-300">•</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
            © 2026 All Rights Reserved
          </span>
        </div>
      </div>
    </div>

    {/* Navigation Links - Now including Cookies */}
    <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
      {['Security', 'Ledger Rules', 'Privacy', 'Cookies'].map((item) => (
        <button 
          key={item} 
          onClick={() => setActiveFooterTab(item)}
          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 rounded-lg px-2 py-1"
          aria-label={`View ${item} information`}
        >
          {item}
        </button>
      ))}
    </nav>

    {/* Regional Status Indicator */}
    <div className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full shadow-sm">
      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
      <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
        Lesotho (LSL)
      </span>
    </div>
  </div>
</footer> 
{/* --- DYNAMIC INFO MODAL --- */}
{activeFooterTab && (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
    <div className="bg-white w-full max-w-md rounded-[32px] p-10 shadow-3xl relative animate-in zoom-in-95 duration-300">
      
      {/* Close Button with A11y Fix */}
      <button 
        onClick={() => setActiveFooterTab(null)} 
        className="absolute right-8 top-8 text-slate-300 hover:text-slate-900 transition-colors p-2"
        aria-label="Close information modal"
      >
        <X size={24} />
      </button>

      {/* Dynamic Header Icons */}
      <div className="flex items-center gap-3 mb-6">
        {activeFooterTab === 'Security' && <ShieldCheck size={28} className="text-blue-600" />}
        {activeFooterTab === 'Ledger Rules' && <Scale size={28} className="text-blue-600" />}
        {activeFooterTab === 'Privacy' && <Lock size={28} className="text-blue-600" />}
        {activeFooterTab === 'Cookies' && <Cookie size={28} className="text-blue-600" />}
        <h2 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">
          {activeFooterTab}
        </h2>
      </div>

      {/* Dynamic Content Body */}
      <div className="text-slate-600 text-sm leading-relaxed space-y-4 font-medium">
        {activeFooterTab === 'Security' && (
          <p>Khotso-Pay uses 256-bit local encryption. Your financial data is stored directly on your device, ensuring zero third-party access to your business ledger.</p>
        )}
        {activeFooterTab === 'Ledger Rules' && (
          <p>Sales are recorded in real-time. "Pending" entries are tracked separately and do not reflect in your "Paid Revenue" until updated to "Completed".</p>
        )}
        {activeFooterTab === 'Privacy' && (
          <p>We believe in merchant sovereignty. Khotso-Pay does not collect or sell your customer identities or transaction history. It stays with you.</p>
        )}
        {activeFooterTab === 'Cookies' && (
          <p>We use essential cookies to maintain your session and remember your local preferences. No tracking or marketing cookies are permitted.</p>
        )}
      </div>

      <button 
        onClick={() => setActiveFooterTab(null)} 
        className="mt-8 w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all"
      >
        Close
      </button>
    </div>
  </div>
)}
</main>
      </div>
    </HelmetProvider>
  );
}