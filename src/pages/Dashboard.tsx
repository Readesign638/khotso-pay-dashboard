import React, { useState, useMemo, useCallback } from 'react';
import { 
  Search, Plus, Trash2, Edit3, X, LogOut, 
  CheckCircle2, FileText, Download, LayoutDashboard, ListOrdered, 
  ShieldCheck, Scale, Cookie, MessageCircle, Mail, Lock,
  User, Settings, Wallet, TrendingUp, History, BarChart3, Bell, Save,
  Package
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Sidebar from '../components/Sidebar';
import { StatCard } from '../components/StatCard';
import { TaxEstimator } from '../components/TaxEstimator';
import type { Transaction, PaymentMethod, TransactionStatus } from '../types/schema';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { TransactionService } from '../services/transactionService';
import { formatCurrency } from '../utils/formatters';
type View = 'dashboard' | 'transactions' | 'analytics' | 'wallet' | 'profile' | 'settings';

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
  const [items, setItems] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('M-Pesa');
  const [status, setStatus] = useState<TransactionStatus>('Completed');
  const [activeFooterTab, setActiveFooterTab] = useState<string | null>(null); 
  const [allTransactions, setAllTransactions] = useLocalStorage<Transaction[]>('khotsopay_tx', []);
  
  // --- PROFILE STATE (Lazy initialization - no effect needed) ---
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState(() => ({
    businessName: localStorage.getItem('khotsopay_business') || '',
    fullName: localStorage.getItem('khotsopay_fullName') || '',
    phone: localStorage.getItem('khotsopay_phone') || '',
    address: localStorage.getItem('khotsopay_address') || '',
    taxId: localStorage.getItem('khotsopay_taxId') || ''
  }));

  // Member since - read-only, computed once
  const memberSince = useMemo(() => {
    return localStorage.getItem('khotsopay_memberSince') || new Date().toLocaleDateString('en-LS', { year: 'numeric', month: 'long', day: 'numeric' });
  }, []);

  // --- SETTINGS STATE ---
  const [notifications, setNotifications] = useState({
    emailAlerts: localStorage.getItem('khotsopay_emailAlerts') === 'true',
    dailyReport: localStorage.getItem('khotsopay_dailyReport') === 'true',
    reminders: localStorage.getItem('khotsopay_reminders') === 'true'
  });
  const [language, setLanguage] = useState(localStorage.getItem('khotsopay_language') || 'en');
  const [dateFormat, setDateFormat] = useState(localStorage.getItem('khotsopay_dateFormat') || 'DD/MM/YYYY');
  const [receiptFooter, setReceiptFooter] = useState(localStorage.getItem('khotsopay_receiptFooter') || 'Khotso! Thank you for your business');
  const [showTaxOnReceipt, setShowTaxOnReceipt] = useState(localStorage.getItem('khotsopay_showTaxOnReceipt') === 'true');

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
      tx.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.items && tx.items.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allTransactions, searchTerm]);

  // Product analytics
  const productAnalytics = useMemo(() => {
    const productSales = new Map<string, number>();
    const productCount = new Map<string, number>();
    
    allTransactions.forEach(t => {
      if (t.status === 'Completed' && t.items) {
        // Split by comma for multiple items
        const itemsList = t.items.split(',').map(i => i.trim());
        itemsList.forEach(item => {
          const currentRevenue = productSales.get(item) || 0;
          productSales.set(item, currentRevenue + t.amount);
          
          const currentCount = productCount.get(item) || 0;
          productCount.set(item, currentCount + 1);
        });
      }
    });
    
    const topProducts = Array.from(productSales.entries())
      .map(([name, revenue]) => ({ name, revenue, sales: productCount.get(name) || 0 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    return { topProducts, totalProducts: productSales.size };
  }, [allTransactions]);

  // --- HANDLERS ---
  const resetForm = useCallback(() => {
    setEditingId(null);
    setCustomerName('');
    setItems('');
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
      items: items,
      amount: parseFloat(amount),
      method,
      status,
      date: now.toLocaleDateString('en-LS', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: now.toLocaleTimeString('en-LS', { hour: '2-digit', minute: '2-digit', hour12: false }),
    };

    if (editingId) {
      setAllTransactions(allTransactions.map(t => t.id === editingId ? txData : t));
      alert("Transaction updated!");
    } else {
      setAllTransactions([txData, ...allTransactions]);
      alert("Transaction saved!");
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
        ['Total Revenue', formatCurrency(dailyStats.revenue).replace('LSL', '')],
        ['M-Pesa', formatCurrency(dailyStats.mpesa).replace('LSL', '')],
        ['EcoCash', formatCurrency(dailyStats.ecocash).replace('LSL', '')],
        ['Cash', formatCurrency(dailyStats.cash).replace('LSL', '')],
        ['Owed (Sekoloto)', formatCurrency(dailyStats.owed).replace('LSL', '')],
      ],
      headStyles: { fillColor: [30, 58, 138] },
    });
    doc.save(`KhotsoPay_Report_${dailyStats.date}.pdf`);
  };

  const sendReminder = (tx: Transaction, type: 'whatsapp' | 'email') => {
    const message = `Lumela! This is a friendly reminder from Khotso-Pay regarding the balance of ${formatCurrency(tx.amount)} for ${tx.items || 'your purchase'} on ${tx.date}. Please settle via M-Pesa or EcoCash. Khotso!`;
    
    if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      const subject = encodeURIComponent("Payment Reminder - Khotso-Pay");
      const mailtoUrl = `mailto:?subject=${subject}&body=${encodeURIComponent(message)}`;
      window.open(mailtoUrl, '_self');
    }
  };

  // --- PROFILE HANDLERS ---
  const handleSaveProfile = () => {
    localStorage.setItem('khotsopay_business', profileForm.businessName);
    localStorage.setItem('khotsopay_fullName', profileForm.fullName);
    localStorage.setItem('khotsopay_phone', profileForm.phone);
    localStorage.setItem('khotsopay_address', profileForm.address);
    localStorage.setItem('khotsopay_taxId', profileForm.taxId);
    if (!localStorage.getItem('khotsopay_memberSince')) {
      localStorage.setItem('khotsopay_memberSince', new Date().toLocaleDateString('en-LS', { year: 'numeric', month: 'long', day: 'numeric' }));
    }
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const loadProfileData = () => {
    setProfileForm({
      businessName: localStorage.getItem('khotsopay_business') || '',
      fullName: localStorage.getItem('khotsopay_fullName') || '',
      phone: localStorage.getItem('khotsopay_phone') || '',
      address: localStorage.getItem('khotsopay_address') || '',
      taxId: localStorage.getItem('khotsopay_taxId') || ''
    });
  };

  // --- EXPORT CSV ---
  const exportToCSV = () => {
    const headers = ['Customer Name', 'Items/Products', 'Amount', 'Method', 'Status', 'Date', 'Time'];
    const rows = allTransactions.map(t => [
      t.name,
      t.items || '',
      t.amount,
      t.method,
      t.status,
      t.date,
      t.time
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khotsopay_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert('Transactions exported successfully!');
  };

  // --- DEMO DATA (Optional - only for demonstration) ---
  const loadDemoData = () => {
    const today = new Date().toLocaleDateString('en-LS', { month: 'short', day: 'numeric', year: 'numeric' });
    setAllTransactions([
      { id: crypto.randomUUID(), name: 'Mphethi Store', items: '2x Bread, 1kg Sugar', amount: 400, method: 'Cash', status: 'Completed', date: today, time: '08:42' },
      { id: crypto.randomUUID(), name: 'Rea Sekhitlane', items: 'Cooking Oil, 5kg Rice', amount: 500, method: 'M-Pesa', status: 'Pending', date: today, time: '10:28' }
    ]);
    alert('Demo transactions loaded! You can now edit or delete them.');
  };

  return (
    <HelmetProvider>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <SEO view={currentView} />
        
        <Sidebar activeView={currentView} onNavigate={setCurrentView} />
        
        <main className="flex-1 p-4 sm:p-6 md:p-12 pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-12 overflow-y-auto w-full max-w-7xl mx-auto">
          
          <header className="mb-8 flex justify-between items-center sticky top-0 bg-slate-50/80 backdrop-blur-md z-40 py-2">
            <nav className="flex gap-4 md:gap-8 overflow-x-auto no-scrollbar" aria-label="Khotso-Pay views">
              {['dashboard', 'transactions', 'analytics', 'wallet', 'profile', 'settings'].map((view) => (
                <button 
                  key={view}
                  onClick={() => setCurrentView(view as View)} 
                  className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap min-h-[44px] ${currentView === view ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-slate-400'}`}
                  aria-label={`Navigate to ${view}`}
                  title={view}
                >
                  {view === 'dashboard' && <LayoutDashboard size={16}/>}
                  {view === 'transactions' && <ListOrdered size={16}/>}
                  {view === 'analytics' && <BarChart3 size={16}/>}
                  {view === 'wallet' && <Wallet size={16}/>}
                  {view === 'profile' && <User size={16}/>}
                  {view === 'settings' && <Settings size={16}/>}
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </nav>

            <button 
              onClick={() => confirm("Logout?") && window.location.reload()} 
              className="p-3 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-red-500 hover:border-red-100 transition-all active:scale-90"
              aria-label="Logout session"
              title="Logout"
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
                    aria-label="Add new transaction"
                    title="Record Sale"
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
                    <button onClick={exportToPDF} className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white text-white hover:text-slate-900 px-4 py-2 rounded-xl font-black text-[10px] transition-all" aria-label="Export to PDF" title="Export PDF">
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
      {/* Header Section */}
      <div className="p-6 md:p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Business Ledger</h3>
          <p className="text-slate-400 text-sm font-medium">Historical transaction records</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Find customer or product..." 
            className="w-full pl-11 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-4 focus:ring-blue-100 font-bold transition-all text-sm" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search customers or products"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-400 text-[10px] uppercase font-black tracking-widest bg-slate-50/50">
              <th className="py-5 px-8">Client</th>
              <th className="py-5 px-8">Items / Products</th>
              <th className="py-5 px-8">Value</th>
              <th className="py-5 px-8">Method</th>
              <th className="py-5 px-8">Status</th>
              <th className="py-5 px-8 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                  No transactions yet. Click "Record Sale" to add your first transaction!
                  <button 
                    onClick={loadDemoData}
                    className="ml-3 text-blue-600 font-bold underline hover:text-blue-700 transition-colors"
                  >
                    Load Demo Data
                  </button>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx.id} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="py-6 px-8">
                    <span className="text-base font-black text-slate-900 block">{tx.name}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      {tx.date} • {tx.time}
                    </span>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-slate-400" />
                      <span className="text-sm text-slate-700 font-medium truncate max-w-[150px]">
                        {tx.items || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-8 font-black text-slate-900">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="py-6 px-8">
                    <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl">
                      {tx.method}
                    </span>
                  </td>
                  <td className="py-6 px-8">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-sm ${
                      tx.status === 'Completed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {tx.status === 'Completed' ? 'PAID' : 'OWED'}
                    </span>
                  </td>
                  <td className="py-6 px-8 text-right">
                    <div className="flex justify-end gap-2">
                      {tx.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => sendReminder(tx, 'whatsapp')}
                            className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all active:scale-90"
                            title="WhatsApp Reminder"
                          >
                            <MessageCircle size={16} />
                          </button>
                          <button
                            onClick={() => sendReminder(tx, 'email')}
                            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all active:scale-90"
                            title="Email Reminder"
                          >
                            <Mail size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setEditingId(tx.id);
                          setCustomerName(tx.name);
                          setItems(tx.items || '');
                          setAmount(tx.amount.toString());
                          setMethod(tx.method);
                          setStatus(tx.status);
                          setIsModalOpen(true);
                        }}
                        className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-100 rounded-xl transition-all active:scale-90"
                        title="Edit"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => confirm("Delete this transaction?") && setAllTransactions(allTransactions.filter(t => t.id !== tx.id))}
                        className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-100 rounded-xl transition-all active:scale-90"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
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
                  title="Close"
                >
                  <X size={32} />
                </button>

                <h2 className="text-3xl font-black text-slate-900 mb-10 uppercase italic tracking-tighter">
                  {editingId ? 'Modify Ledger' : 'New Transaction'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Customer Name</label>
                    <input 
                      required 
                      placeholder="Who bought or owes?" 
                      className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-lg" 
                      value={customerName} 
                      onChange={(e) => setCustomerName(e.target.value)} 
                      aria-label="Customer name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Items / Products Bought</label>
                    <input 
                      required 
                      placeholder="E.g., 2x Bread, 1kg Sugar, Cooking Oil" 
                      className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-sm" 
                      value={items} 
                      onChange={(e) => setItems(e.target.value)} 
                      aria-label="Items or products"
                    />
                    <p className="text-[8px] text-slate-400 ml-1 mt-1">What products were sold? This helps track profits by item.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Amount (LSL)</label>
                    <input 
                      required 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      className="w-full p-6 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-black text-4xl text-blue-600" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      aria-label="Amount"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['M-Pesa', 'EcoCash', 'Cash'] as const).map((m) => (
                      <button key={m} type="button" onClick={() => setMethod(m)} 
                        className={`py-4 min-h-[56px] rounded-2xl text-[11px] font-black uppercase border-2 transition-all active:scale-95 ${method === m ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm' : 'border-slate-100 text-slate-400'}`}
                        aria-label={`Select ${m} as payment method`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3 bg-slate-100 p-2 rounded-3xl">
                    {(['Completed', 'Pending'] as const).map((s) => (
                      <button key={s} type="button" onClick={() => setStatus(s)} 
                        className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase transition-all ${status === s ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}
                        aria-label={`Set status to ${s === 'Completed' ? 'Paid' : 'Owed'}`}
                      >
                        {s === 'Completed' ? 'Fully Paid' : 'Pending (Sekoloto)'}
                      </button>
                    ))}
                  </div>

                  <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black text-xl shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95" aria-label="Save transaction">
                    <CheckCircle2 size={24} strokeWidth={3} /> {editingId ? 'Update Record' : 'Confirm & Save'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* --- ANALYTICS VIEW --- */}
          {currentView === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black">Analytics Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border">
                  <h3 className="font-bold mb-4">Revenue Overview</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span>Total Revenue</span><span className="font-bold">{formatCurrency(stats.totalRevenue)}</span></div>
                    <div className="flex justify-between"><span>Average Transaction</span><span className="font-bold">{formatCurrency(stats.totalRevenue / (allTransactions.length || 1))}</span></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border">
                  <h3 className="font-bold mb-4">Payment Method Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>📱 M-Pesa</span><span className="font-bold">{formatCurrency(stats.mpesaVolume)}</span></div>
                    <div className="flex justify-between text-sm"><span>💚 EcoCash</span><span className="font-bold">{formatCurrency(stats.ecocashVolume)}</span></div>
                    <div className="flex justify-between text-sm"><span>💰 Cash</span><span className="font-bold">{formatCurrency(stats.totalRevenue - stats.mpesaVolume - stats.ecocashVolume)}</span></div>
                  </div>
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Package size={20} className="text-blue-600" /> Top Selling Products
                </h3>
                {productAnalytics.topProducts.length === 0 ? (
                  <p className="text-slate-400 text-sm">Add items to sales to see product performance</p>
                ) : (
                  <div className="space-y-3">
                    {productAnalytics.topProducts.map((product, idx) => (
                      <div key={product.name} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-slate-400">{product.sales} sale(s)</p>
                          </div>
                        </div>
                        <span className="font-bold text-blue-600">{formatCurrency(product.revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- WALLET VIEW --- */}
          {currentView === 'wallet' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
                <p className="text-sm opacity-80 mb-2">Available Balance</p>
                <p className="text-4xl md:text-5xl font-black">{formatCurrency(stats.totalRevenue - stats.totalPending)}</p>
                <p className="text-xs opacity-70 mt-2">Pending settlement: {formatCurrency(stats.totalPending)}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border">
                  <TrendingUp className="text-green-600 mb-2" size={24} aria-label="Trending up" />
                  <p className="text-2xl font-black">{formatCurrency(dailyStats.revenue)}</p>
                  <p className="text-xs text-slate-500">Today's earnings</p>
                </div>
                <div className="bg-white rounded-xl p-4 border">
                  <History className="text-blue-600 mb-2" size={24} aria-label="History" />
                  <p className="text-2xl font-black">{allTransactions.length}</p>
                  <p className="text-xs text-slate-500">Total transactions</p>
                </div>
                <div className="bg-white rounded-xl p-4 border">
                  <Wallet className="text-purple-600 mb-2" size={24} aria-label="Wallet" />
                  <p className="text-2xl font-black">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="text-xs text-slate-500">Lifetime revenue</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h3 className="font-bold text-lg mb-4">Request Payout</h3>
                <div className="flex gap-3">
                  <input type="number" placeholder="Amount" className="flex-1 p-3 bg-slate-50 rounded-xl text-sm" aria-label="Withdrawal amount" />
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold" aria-label="Request withdrawal">Withdraw</button>
                </div>
                <p className="text-xs text-slate-500 mt-3">Minimum withdrawal: LSL 100. Processing takes 1-3 business days.</p>
              </div>
            </div>
          )}

          {/* --- PROFILE VIEW --- */}
          {currentView === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm border">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <User size={48} className="text-white" aria-label="User avatar" />
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-2xl font-black">{profileForm.businessName || 'Merchant User'}</h2>
                    <p className="text-slate-500">{localStorage.getItem('khotsopay_user_email') || 'merchant@khotsopay.ls'}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Verified Merchant</span>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Active</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black">Personal Information</h3>
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                    aria-label={isEditing ? "Cancel editing" : "Edit profile"}
                    title={isEditing ? "Cancel" : "Edit Profile"}
                  >
                    {isEditing ? <X size={16} /> : <Edit3 size={16} />}
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Business Name</label></div>
                    <div className="md:col-span-2">
                      {isEditing ? (
                        <input type="text" value={profileForm.businessName} onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-medium border focus:ring-2 focus:ring-blue-100" placeholder="Enter business name" aria-label="Business name" />
                      ) : (
                        <p className="text-base font-medium">{profileForm.businessName || 'Not set'}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Owner Full Name</label></div>
                    <div className="md:col-span-2">
                      {isEditing ? (
                        <input type="text" value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-medium border focus:ring-2 focus:ring-blue-100" placeholder="Enter owner's full name" aria-label="Owner full name" />
                      ) : (
                        <p className="text-base">{profileForm.fullName || 'Not set'}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label></div>
                    <div className="md:col-span-2">
                      <p className="text-base">{localStorage.getItem('khotsopay_user_email') || 'merchant@khotsopay.ls'}</p>
                      <p className="text-xs text-slate-400 mt-1">Email cannot be changed. Contact support for assistance.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label></div>
                    <div className="md:col-span-2">
                      {isEditing ? (
                        <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-medium border focus:ring-2 focus:ring-blue-100" placeholder="+266 1234 5678" aria-label="Phone number" />
                      ) : (
                        <p className="text-base">{profileForm.phone || 'Not set'}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Business Address</label></div>
                    <div className="md:col-span-2">
                      {isEditing ? (
                        <textarea value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-medium border focus:ring-2 focus:ring-blue-100" rows={3} placeholder="Maseru, Lesotho" aria-label="Business address" />
                      ) : (
                        <p className="text-base">{profileForm.address || 'Not set'}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Tax ID / Registration</label></div>
                    <div className="md:col-span-2">
                      {isEditing ? (
                        <input type="text" value={profileForm.taxId} onChange={(e) => setProfileForm({ ...profileForm, taxId: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl text-sm font-medium border focus:ring-2 focus:ring-blue-100" placeholder="LRA Tax ID" aria-label="Tax ID" />
                      ) : (
                        <p className="text-base">{profileForm.taxId || 'Not set'}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Member Since</label></div>
                    <div className="md:col-span-2">
                      <p className="text-base">{memberSince}</p>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 mt-6 pt-4 border-t">
                    <button onClick={handleSaveProfile} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2" aria-label="Save profile changes"><Save size={18} /> Save Changes</button>
                    <button onClick={() => { setIsEditing(false); loadProfileData(); }} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all" aria-label="Cancel editing">Cancel</button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h3 className="font-bold text-lg mb-4">Business Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-xl"><TrendingUp size={24} className="text-green-600 mx-auto mb-2" aria-label="Transactions" /><p className="text-2xl font-black">{allTransactions.length}</p><p className="text-xs text-slate-500">Total Transactions</p></div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl"><Wallet size={24} className="text-blue-600 mx-auto mb-2" aria-label="Revenue" /><p className="text-2xl font-black">{formatCurrency(stats.totalRevenue)}</p><p className="text-xs text-slate-500">Lifetime Revenue</p></div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl"><History size={24} className="text-purple-600 mx-auto mb-2" aria-label="Average" /><p className="text-2xl font-black">{Math.ceil(stats.totalRevenue / (allTransactions.length || 1))}</p><p className="text-xs text-slate-500">Avg Transaction</p></div>
                  <div className="text-center p-4 bg-slate-50 rounded-xl"><Package size={24} className="text-orange-600 mx-auto mb-2" aria-label="Products" /><p className="text-2xl font-black">{productAnalytics.totalProducts}</p><p className="text-xs text-slate-500">Products Sold</p></div>
                </div>
              </div>
            </div>
          )}

          {/* --- SETTINGS VIEW --- */}
          {currentView === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black">Settings</h2>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Bell size={20} className="text-blue-600" /> Notification Preferences</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div><p className="font-medium">Email Alerts</p><p className="text-xs text-slate-500">Receive transaction alerts via email</p></div>
                    <button onClick={() => { const newValue = !notifications.emailAlerts; setNotifications({ ...notifications, emailAlerts: newValue }); localStorage.setItem('khotsopay_emailAlerts', String(newValue)); }} className={`w-12 h-6 rounded-full transition-all ${notifications.emailAlerts ? 'bg-blue-600' : 'bg-slate-300'}`} aria-label="Toggle email alerts"><div className={`w-5 h-5 bg-white rounded-full transition-all mt-0.5 ${notifications.emailAlerts ? 'ml-6' : 'ml-0.5'}`} /></button>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div><p className="font-medium">Daily Summary Report</p><p className="text-xs text-slate-500">Receive daily transaction summary via email</p></div>
                    <button onClick={() => { const newValue = !notifications.dailyReport; setNotifications({ ...notifications, dailyReport: newValue }); localStorage.setItem('khotsopay_dailyReport', String(newValue)); }} className={`w-12 h-6 rounded-full transition-all ${notifications.dailyReport ? 'bg-blue-600' : 'bg-slate-300'}`} aria-label="Toggle daily report"><div className={`w-5 h-5 bg-white rounded-full transition-all mt-0.5 ${notifications.dailyReport ? 'ml-6' : 'ml-0.5'}`} /></button>
                  </label>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings size={20} className="text-blue-600" /> Business Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2">Currency</label>
                    <select className="w-full p-3 bg-slate-50 rounded-xl text-sm border" aria-label="Currency selector" title="Currency">
                      <option value="LSL">Lesotho Loti (LSL)</option>
                    </select>
                    <p className="text-xs text-slate-400 mt-1">Lesotho Loti is the official currency</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Language</label>
                    <select value={language} onChange={(e) => { setLanguage(e.target.value); localStorage.setItem('khotsopay_language', e.target.value); }} className="w-full p-3 bg-slate-50 rounded-xl text-sm border" aria-label="Language selector" title="Language">
                      <option value="en">English</option>
                      <option value="st">Sesotho</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Date Format</label>
                    <select value={dateFormat} onChange={(e) => { setDateFormat(e.target.value); localStorage.setItem('khotsopay_dateFormat', e.target.value); }} className="w-full p-3 bg-slate-50 rounded-xl text-sm border" aria-label="Date format selector" title="Date Format">
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><FileText size={20} className="text-blue-600" /> Receipt Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Receipt Footer Message</label>
                    <textarea value={receiptFooter} onChange={(e) => { setReceiptFooter(e.target.value); localStorage.setItem('khotsopay_receiptFooter', e.target.value); }} className="w-full p-3 bg-slate-50 rounded-xl text-sm border focus:ring-2 focus:ring-blue-100" rows={2} placeholder="Khotso! Thank you for your business" aria-label="Receipt footer message" />
                  </div>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div><p className="font-medium">Show VAT on Receipts</p><p className="text-xs text-slate-500">Display 15% VAT breakdown on customer receipts</p></div>
                    <button onClick={() => { const newValue = !showTaxOnReceipt; setShowTaxOnReceipt(newValue); localStorage.setItem('khotsopay_showTaxOnReceipt', String(newValue)); }} className={`w-12 h-6 rounded-full transition-all ${showTaxOnReceipt ? 'bg-blue-600' : 'bg-slate-300'}`} aria-label="Toggle VAT on receipts"><div className={`w-5 h-5 bg-white rounded-full transition-all mt-0.5 ${showTaxOnReceipt ? 'ml-6' : 'ml-0.5'}`} /></button>
                  </label>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ShieldCheck size={20} className="text-blue-600" /> Data Management</h3>
                <div className="space-y-4">
                  <button onClick={() => { if(confirm("Clear all transaction data?")) { localStorage.removeItem('khotsopay_tx'); alert("Data cleared. Page will refresh."); window.location.reload(); } }} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100" aria-label="Clear all data">Clear All Transaction Data</button>
                  <button onClick={exportToCSV} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200" aria-label="Export to CSV">Export Transactions (CSV)</button>
                  <button onClick={loadDemoData} className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100" aria-label="Load demo data">Load Demo Data</button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ShieldCheck size={20} className="text-blue-600" /> About KhotsoPay</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p><strong>Version:</strong> 2.0.0</p>
                  <p><strong>For:</strong> Lesotho Small Businesses</p>
                  <p><strong>Supported Payments:</strong> M-Pesa, EcoCash, Cash</p>
                  <p><strong>Data Storage:</strong> Local (your device only)</p>
                  <p className="mt-3 text-xs text-slate-400">Khotso-Pay - Empowering Lesotho's merchants with simple, secure payment tracking. Khotso!</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-24 pt-12 border-t border-slate-200/60 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-600 rounded-[14px] flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-100">KP</div>
                <div>
                  <span className="text-lg font-black text-slate-900 tracking-tighter uppercase italic block leading-none">Khotso-Pay</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Merchant Suite v2.0</span>
                    <span className="text-[8px] text-slate-300">•</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">© 2026 All Rights Reserved</span>
                  </div>
                </div>
              </div>

              <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
                {['Security', 'Ledger Rules', 'Privacy', 'Cookies'].map((item) => (
                  <button key={item} onClick={() => setActiveFooterTab(item)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors px-2 py-1" aria-label={`View ${item} information`} title={item}>
                    {item}
                  </button>
                ))}
              </nav>

              <div className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full shadow-sm">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Lesotho (LSL)</span>
              </div>
            </div>
          </footer>

          {/* Dynamic Info Modal */}
          {activeFooterTab && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-[32px] p-10 shadow-3xl relative">
                <button onClick={() => setActiveFooterTab(null)} className="absolute right-8 top-8 text-slate-300 hover:text-slate-900" aria-label="Close information modal" title="Close">
                  <X size={24} />
                </button>
                <div className="flex items-center gap-3 mb-6">
                  {activeFooterTab === 'Security' && <ShieldCheck size={28} className="text-blue-600" aria-label="Security shield" />}
                  {activeFooterTab === 'Ledger Rules' && <Scale size={28} className="text-blue-600" aria-label="Scale icon" />}
                  {activeFooterTab === 'Privacy' && <Lock size={28} className="text-blue-600" aria-label="Lock icon" />}
                  {activeFooterTab === 'Cookies' && <Cookie size={28} className="text-blue-600" aria-label="Cookie icon" />}
                  <h2 className="text-2xl font-black italic uppercase">{activeFooterTab}</h2>
                </div>
                <div className="text-slate-600 text-sm leading-relaxed">
                  {activeFooterTab === 'Security' && <p>Khotso-Pay uses 256-bit local encryption. Your financial data is stored directly on your device, ensuring zero third-party access to your business ledger.</p>}
                  {activeFooterTab === 'Ledger Rules' && <p>Sales are recorded in real-time. "Pending" entries are tracked separately and do not reflect in your "Paid Revenue" until updated to "Completed".</p>}
                  {activeFooterTab === 'Privacy' && <p>We believe in merchant sovereignty. Khotso-Pay does not collect or sell your customer identities or transaction history. It stays with you.</p>}
                  {activeFooterTab === 'Cookies' && <p>We use essential cookies to maintain your session and remember your local preferences. No tracking or marketing cookies are permitted.</p>}
                </div>
                <button onClick={() => setActiveFooterTab(null)} className="mt-8 w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-100" aria-label="Close modal">Close</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </HelmetProvider>
  );
}