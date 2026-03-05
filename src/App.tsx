import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  Database, 
  Package, 
  ArrowLeftRight, 
  BarChart3, 
  Store as StoreIcon, 
  Users, 
  Settings as SettingsIcon, 
  LogOut, 
  Search, 
  Bell, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Trash2, 
  CheckCircle2,
  ChevronRight,
  Filter,
  Download,
  AlertTriangle,
  Phone,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Store, Perfume, CartItem, Transaction, StockMatrixItem, User, StockTransfer } from './types';

// --- Components ---

const SidebarLink = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-all duration-300 border-l-4 ${
      active 
        ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500 text-amber-500' 
        : 'border-transparent text-gray-400 hover:bg-gray-800/50 hover:text-white'
    }`}
  >
    <Icon size={18} />
    <span className="font-medium">{label}</span>
  </button>
);

const Card = ({ children, className = "", ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

const StatCard = ({ label, value, subValue, icon: Icon, colorClass }: any) => (
  <Card className="p-4 sm:p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs sm:text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-xl sm:text-2xl font-serif font-bold text-gray-900">{value}</p>
        {subValue && (
          <p className={`text-[10px] sm:text-xs mt-2 flex items-center gap-1 ${subValue.startsWith('+') ? 'text-green-600' : 'text-gray-400'}`}>
            {subValue}
          </p>
        )}
      </div>
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white shadow-sm ${colorClass}`}>
        <Icon size={20} className="sm:w-6 sm:h-6" />
      </div>
    </div>
  </Card>
);

// --- Main App ---

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<number>(1);
  const [perfumes, setPerfumes] = useState<Perfume[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedPerfumeForMl, setSelectedPerfumeForMl] = useState<Perfume | null>(null);
  const [mlAmount, setMlAmount] = useState(10);
  const [stockMatrix, setStockMatrix] = useState<StockMatrixItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPerfumeModalOpen, setIsPerfumeModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPerfume, setEditingPerfume] = useState<Perfume | null>(null);
  const [transferForm, setTransferForm] = useState({ from: 1, to: 2, perfumeId: 1, qty: 100 });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const askConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  useEffect(() => {
    fetchStores();
    fetchPerfumes();
    fetchStockMatrix();
    fetchTransactions();
    fetchUsers();
    fetchTransfers();
  }, [activeStoreId]);

  const fetchStores = async () => {
    const res = await fetch('/api/stores');
    const data = await res.json();
    setStores(data.stores);
  };

  const fetchPerfumes = async () => {
    const res = await fetch(`/api/perfumes?store_id=${activeStoreId}`);
    const data = await res.json();
    setPerfumes(data.perfumes);
  };

  const fetchStockMatrix = async () => {
    const res = await fetch('/api/stock-matrix');
    const data = await res.json();
    setStockMatrix(data.perfumes);
  };

  const fetchTransactions = async () => {
    const res = await fetch(`/api/reports/sales?store_id=${activeStoreId}`);
    const data = await res.json();
    setTransactions(data.transactions);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users);
  };

  const fetchTransfers = async () => {
    const res = await fetch('/api/stock-transfers');
    const data = await res.json();
    setTransfers(data.transfers);
  };

  const activeStore = stores.find(s => s.id === activeStoreId);

  // --- Cart Logic ---

  const addToCart = (perfume: Perfume, ml: number) => {
    const existing = cart.find(item => item.id === perfume.id);
    if (existing) {
      setCart(cart.map(item => item.id === perfume.id ? { ...item, ml: item.ml + ml } : item));
    } else {
      setCart([...cart, { ...perfume, ml }]);
    }
    setSelectedPerfumeForMl(null);
    setMlAmount(10);
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.ml * item.price), 0);
  const discountAmount = discountType === 'percent' ? (subtotal * discount / 100) : discount;
  const total = Math.max(0, subtotal - discountAmount);
  const change = paymentAmount ? Math.max(0, parseFloat(paymentAmount) - total) : 0;

  const handleCheckout = async () => {
    const checkoutData = {
      store_id: activeStoreId,
      total_amount: total,
      discount_amount: discountAmount,
      payment_amount: parseFloat(paymentAmount),
      items: cart.map(item => ({
        perfume_id: item.id,
        name: item.name,
        qty_ml: item.ml,
        price_per_ml: item.price
      }))
    };

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutData)
    });
    if (res.ok) {
      const result = await res.json();
      setLastTransaction({
        ...checkoutData,
        id: result.transaction_id,
        created_at: new Date().toISOString(),
        change: parseFloat(paymentAmount) - total,
        store_name: activeStore?.name
      });
      setCart([]);
      setDiscount(0);
      setPaymentAmount('');
      fetchPerfumes();
      fetchTransactions();
      fetchStockMatrix();
      setIsReceiptModalOpen(true);
    }
  };

  const handleSavePerfume = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    const method = editingPerfume ? 'PUT' : 'POST';
    const url = editingPerfume ? `/api/perfumes/${editingPerfume.id}` : '/api/perfumes';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      setIsPerfumeModalOpen(false);
      setEditingPerfume(null);
      fetchPerfumes();
      fetchStockMatrix();
    } else {
      const errorData = await res.json();
      alert(errorData.error || 'Terjadi kesalahan saat menyimpan parfum.');
    }
  };

  const handleDeletePerfume = (id: number) => {
    askConfirmation('Hapus Parfum', 'Apakah Anda yakin ingin menghapus parfum ini? Data stok di semua cabang juga akan dihapus.', async () => {
      const res = await fetch(`/api/perfumes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPerfumes();
        fetchStockMatrix();
      }
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    });
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    const method = editingStore ? 'PUT' : 'POST';
    const url = editingStore ? `/api/stores/${editingStore.id}` : '/api/stores';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      setIsStoreModalOpen(false);
      setEditingStore(null);
      fetchStores();
    } else {
      const errorData = await res.json();
      alert(errorData.error || 'Terjadi kesalahan saat menyimpan toko.');
    }
  };

  const handleDeleteStore = (id: number) => {
    askConfirmation('Hapus Toko', 'Apakah Anda yakin ingin menghapus toko ini? Semua data transaksi dan stok di toko ini akan hilang.', async () => {
      const res = await fetch(`/api/stores/${id}`, { method: 'DELETE' });
      if (res.ok) fetchStores();
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    // Convert store_id to integer or null
    if (data.store_id === '') {
      data.store_id = null as any;
    } else {
      data.store_id = parseInt(data.store_id as string) as any;
    }

    const method = editingUser ? 'PUT' : 'POST';
    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      setIsUserModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } else {
      const errorData = await res.json();
      alert(errorData.error || 'Terjadi kesalahan saat menyimpan user.');
    }
  };

  const handleDeleteUser = (id: number) => {
    askConfirmation('Hapus User', 'Apakah Anda yakin ingin menghapus user ini?', async () => {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    });
  };

  const handleStockTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/stock-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transferForm)
    });
    if (res.ok) {
      alert('Transfer Berhasil!');
      fetchTransfers();
      fetchStockMatrix();
      fetchPerfumes();
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('Laporan Penjualan - Avogadro Perfumery', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 30);
    
    const tableData = transactions.map(t => [
      `#TRX-${t.id?.toString().padStart(4, '0') || '0000'}`,
      new Date(t.created_at).toLocaleString('id-ID'),
      (t as any).store_name || '-',
      `Rp ${t.total_amount.toLocaleString('id-ID')}`,
      `Rp ${t.discount_amount.toLocaleString('id-ID')}`,
      `Rp ${(t.total_amount - t.discount_amount).toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['ID Transaksi', 'Tanggal', 'Toko', 'Total', 'Diskon', 'Net Sales']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [17, 24, 39] }, // Slate-900
      styles: { fontSize: 9 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      }
    });

    const totalNet = transactions.reduce((acc, t) => acc + (t.total_amount - t.discount_amount), 0);
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Penjualan Bersih: Rp ${totalNet.toLocaleString('id-ID')}`, 14, finalY + 15);

    doc.save(`Laporan_Penjualan_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // --- Filtering ---

  const filteredPerfumes = perfumes.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(perfumes.map(p => p.category)));

  // --- Render Helpers ---

  const renderReceiptModal = () => (
    <AnimatePresence>
      {isReceiptModalOpen && lastTransaction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsReceiptModalOpen(false)}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            <div className="p-8 space-y-6" id="receipt-content">
              <div className="text-center space-y-2">
                <h3 className="font-serif text-2xl font-bold text-gray-900">Aroma Essence</h3>
                <p className="text-sm text-gray-500">{lastTransaction.store_name}</p>
                <div className="w-full border-t border-dashed border-gray-200 my-4"></div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  #TRX-{lastTransaction.id?.toString().padStart(6, '0') || '000000'}
                </p>
                <p className="text-[10px] text-gray-400">
                  {new Date(lastTransaction.created_at).toLocaleString('id-ID')}
                </p>
              </div>

              <div className="space-y-3">
                {lastTransaction.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.qty_ml}ml × Rp {item.price_per_ml.toLocaleString('id-ID')}</p>
                    </div>
                    <p className="font-bold text-gray-800">Rp {(item.qty_ml * item.price_per_ml).toLocaleString('id-ID')}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>Rp {(lastTransaction.total_amount + lastTransaction.discount_amount).toLocaleString('id-ID')}</span>
                </div>
                {lastTransaction.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Diskon</span>
                    <span>- Rp {lastTransaction.discount_amount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-50">
                  <span>Total</span>
                  <span className="text-amber-600">Rp {lastTransaction.total_amount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Bayar</span>
                  <span>Rp {lastTransaction.payment_amount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-600 font-bold">
                  <span>Kembalian</span>
                  <span>Rp {lastTransaction.change.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="text-center pt-6">
                <p className="text-xs text-gray-400 italic">Terima kasih atas kunjungan Anda</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex gap-3">
              <button 
                onClick={() => setIsReceiptModalOpen(false)}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all"
              >
                Tutup
              </button>
              <button 
                onClick={() => {
                  const printContent = document.getElementById('receipt-content');
                  if (printContent) {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Struk Pembayaran</title>
                            <style>
                              body { font-family: 'Courier New', Courier, monospace; padding: 20px; width: 300px; margin: 0 auto; }
                              .text-center { text-align: center; }
                              .font-bold { font-weight: bold; }
                              .flex { display: flex; justify-content: space-between; }
                              .border-t { border-top: 1px dashed #ccc; margin: 10px 0; padding-top: 10px; }
                              .text-sm { font-size: 14px; }
                              .text-xs { font-size: 12px; }
                              .mt-4 { margin-top: 16px; }
                            </style>
                          </head>
                          <body>
                            ${printContent.innerHTML}
                            <script>
                              window.onload = () => {
                                window.print();
                                window.close();
                              };
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }
                }}
                className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={16} /> Cetak Struk
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const renderDashboard = () => {
    const todaySales = transactions
      .filter(t => new Date(t.created_at).toDateString() === new Date().toDateString())
      .reduce((sum, t) => sum + t.total_amount, 0);
    
    const lowStockCount = perfumes.filter(p => (p.stock || 0) < 200).length;

    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard 
            label="Penjualan Hari Ini" 
            value={`Rp ${todaySales.toLocaleString('id-ID')}`} 
            subValue="+12.5% dari kemarin" 
            icon={Calculator} 
            colorClass="bg-amber-500" 
          />
          <StatCard 
            label="Penjualan Bulan Ini" 
            value={`Rp ${transactions.reduce((sum, t) => sum + t.total_amount, 0).toLocaleString('id-ID')}`} 
            subValue="+8.3% dari bulan lalu" 
            icon={BarChart3} 
            colorClass="bg-emerald-500" 
          />
          <StatCard 
            label="Total Transaksi" 
            value={transactions.length.toString()} 
            subValue="Bulan ini" 
            icon={ShoppingCart} 
            colorClass="bg-blue-500" 
          />
          <StatCard 
            label="Stok Menipis" 
            value={lowStockCount.toString()} 
            subValue="Perlu restock segera" 
            icon={AlertTriangle} 
            colorClass="bg-red-500" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-lg font-bold text-gray-900">Grafik Penjualan</h3>
              <select className="text-xs sm:text-sm border border-gray-200 rounded-lg px-2 sm:px-3 py-1 sm:py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/20">
                <option>7 Hari</option>
                <option>30 Hari</option>
              </select>
            </div>
            <div className="h-48 sm:h-64 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-4">
              {[60, 80, 45, 90, 70, 100, 55].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <motion.div 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.1 }}
                    style={{ height: `${h}%` }}
                    className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-lg origin-bottom"
                  />
                  <span className="text-xs text-gray-400 mt-2">{['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i]}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-6">Parfum Terlaris</h3>
            <div className="space-y-4">
              {perfumes.slice(0, 5).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${p.gradient} flex items-center justify-center text-lg`}>
                    {p.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-600">{(2450 - i * 300).toLocaleString('id-ID')} ml</p>
                    <p className="text-xs text-gray-400">terjual</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-lg font-bold text-gray-900">Transaksi Terbaru</h3>
            <button className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
              Lihat Semua <ChevronRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">No. Transaksi</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Waktu</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.slice(-5).reverse().map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 text-sm font-medium text-gray-800">#TRX-{t.id?.toString().padStart(6, '0') || '000000'}</td>
                    <td className="py-4 px-4 text-sm text-gray-500">{new Date(t.created_at).toLocaleTimeString('id-ID')}</td>
                    <td className="py-4 px-4 text-sm font-bold text-gray-800">Rp {t.total_amount.toLocaleString('id-ID')}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Selesai
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const renderCashier = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari nama parfum..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-400" />
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="flex-1 sm:flex-none px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar pb-20 lg:pb-0">
            {filteredPerfumes.map(p => (
              <motion.div 
                layout
                key={p.id}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedPerfumeForMl(p)}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {p.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-800 truncate">{p.name}</h4>
                    <p className="text-xs text-gray-400 mb-2">{p.category}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-amber-600">Rp {p.price.toLocaleString('id-ID')}/ml</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        (p.stock || 0) < 200 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'
                      }`}>
                        {p.stock?.toLocaleString('id-ID')} ml
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 hidden lg:block">
          <Card className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart size={20} className="text-amber-500" /> Keranjang
              </h3>
              <span className="text-xs font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-full">
                {cart.length} Item
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                  <ShoppingCart size={48} className="mb-4" />
                  <p>Keranjang masih kosong</p>
                </div>
              ) : (
                cart.map(item => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={item.id} 
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center text-lg flex-shrink-0`}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.ml} ml × Rp {item.price.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-600">Rp {(item.ml * item.price).toLocaleString('id-ID')}</p>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-50 bg-gray-50/50 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold text-gray-900">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Diskon</span>
                    <div className="flex items-center bg-white border border-gray-100 rounded-lg overflow-hidden">
                      <input 
                        type="number" 
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="w-12 px-2 py-1 text-xs text-center focus:outline-none"
                      />
                      <button 
                        onClick={() => setDiscountType(discountType === 'percent' ? 'fixed' : 'percent')}
                        className="px-2 py-1 text-[10px] bg-gray-100 font-bold border-l border-gray-100"
                      >
                        {discountType === 'percent' ? '%' : 'Rp'}
                      </button>
                    </div>
                  </div>
                  <span className="font-bold text-red-500">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-gray-900">Total Bayar</span>
                  <span className="font-serif text-2xl font-bold text-amber-600">Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                  <input 
                    type="number" 
                    placeholder="Jumlah Bayar"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-bold text-lg"
                  />
                </div>
                {paymentAmount && (
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm text-gray-500">Kembalian</span>
                    <span className="font-bold text-emerald-600">Rp {change.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <button 
                disabled={cart.length === 0 || !paymentAmount || parseFloat(paymentAmount) < total}
                onClick={handleCheckout}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} /> Proses Transaksi
              </button>
            </div>
          </Card>
        </div>

        {/* Mobile Cart Button */}
        {cart.length > 0 && (
          <motion.button
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={() => setIsCheckoutModalOpen(true)}
            className="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-amber-500 text-white rounded-full shadow-2xl flex items-center justify-center z-20"
          >
            <div className="relative">
              <ShoppingCart size={24} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-amber-500">
                {cart.length}
              </span>
            </div>
          </motion.button>
        )}

        {/* Mobile Checkout Modal */}
        <AnimatePresence>
          {isCheckoutModalOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCheckoutModalOpen(false)}
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-gray-900">Checkout</h3>
                  <button onClick={() => setIsCheckoutModalOpen(false)} className="text-gray-400">
                    <Plus size={24} className="rotate-45" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center text-lg flex-shrink-0`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.ml} ml × Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-600">Rp {(item.ml * item.price).toLocaleString('id-ID')}</p>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-gray-50 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-bold">Rp {subtotal.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between text-sm"><span>Diskon</span><span className="font-bold text-red-500">- Rp {discountAmount.toLocaleString('id-ID')}</span></div>
                    <div className="pt-2 border-t border-gray-200 flex justify-between"><span className="font-bold">Total</span><span className="font-serif text-xl font-bold text-amber-600">Rp {total.toLocaleString('id-ID')}</span></div>
                  </div>
                  <input 
                    type="number" 
                    placeholder="Bayar"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none font-bold"
                  />
                  <button 
                    disabled={!paymentAmount || parseFloat(paymentAmount) < total}
                    onClick={() => { handleCheckout(); setIsCheckoutModalOpen(false); }}
                    className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold"
                  >
                    Bayar Sekarang
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderPerfumes = () => (
    <Card className="p-0">
      <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h3 className="font-serif text-xl font-bold text-gray-900">Daftar Parfum</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari parfum..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-sm"
            />
          </div>
          <button 
            onClick={() => { setEditingPerfume(null); setIsPerfumeModalOpen(true); }}
            className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-amber-600 transition-all shadow-sm"
          >
            <Plus size={16} /> Tambah Parfum
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Parfum</th>
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Kategori</th>
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Harga/ml</th>
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Stok (ml)</th>
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {perfumes.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{p.icon}</span>
                    <span className="text-sm font-bold text-gray-800">{p.name}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-gray-500">{p.category}</td>
                <td className="py-4 px-6 text-sm font-bold text-amber-600">Rp {p.price.toLocaleString('id-ID')}</td>
                <td className="py-4 px-6 text-sm text-gray-500">{p.stock?.toLocaleString('id-ID')} ml</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDeletePerfume(p.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
    </Card>
  );

  const renderTransfer = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 p-6">
        <h3 className="font-serif text-xl font-bold text-gray-900 mb-6">Form Transfer Stok</h3>
        <form onSubmit={handleStockTransfer} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Dari Toko</label>
            <select 
              value={transferForm.from}
              onChange={(e) => setTransferForm({ ...transferForm, from: parseInt(e.target.value) })}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ke Toko</label>
            <select 
              value={transferForm.to}
              onChange={(e) => setTransferForm({ ...transferForm, to: parseInt(e.target.value) })}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Parfum</label>
            <select 
              value={transferForm.perfumeId}
              onChange={(e) => setTransferForm({ ...transferForm, perfumeId: parseInt(e.target.value) })}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              {perfumes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Jumlah (ml)</label>
            <input 
              type="number" 
              value={transferForm.qty}
              onChange={(e) => setTransferForm({ ...transferForm, qty: parseInt(e.target.value) })}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <button className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20">
            Proses Transfer
          </button>
        </form>
      </Card>
      <Card className="lg:col-span-2 p-0">
        <div className="p-6 border-b border-gray-50">
          <h3 className="font-serif text-xl font-bold text-gray-900">Riwayat Transfer</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Tanggal</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Parfum</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Dari</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Ke</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transfers.map(t => (
                <tr key={t.id} className="text-sm">
                  <td className="py-4 px-6 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="py-4 px-6 font-bold">{t.perfume_name}</td>
                  <td className="py-4 px-6 text-gray-500">{t.from_store_name}</td>
                  <td className="py-4 px-6 text-gray-500">{t.to_store_name}</td>
                  <td className="py-4 px-6 font-bold text-amber-600">{t.qty_ml} ml</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderSalesReport = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="font-serif text-2xl font-bold text-gray-900">Laporan Penjualan</h3>
        <div className="flex items-center gap-3">
          <select className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none">
            <option>Semua Toko</option>
            {stores.map(s => <option key={s.id}>{s.name}</option>)}
          </select>
          <button 
            onClick={handleExportPDF}
            className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-all"
          >
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">ID Transaksi</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Tanggal</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Toko</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Diskon</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Net Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-mono text-gray-400">#TRX-{t.id?.toString().padStart(4, '0') || '0000'}</td>
                  <td className="py-4 px-6 text-sm text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
                  <td className="py-4 px-6 text-sm font-bold text-gray-700">{(t as any).store_name}</td>
                  <td className="py-4 px-6 text-sm text-gray-500">Rp {t.total_amount.toLocaleString('id-ID')}</td>
                  <td className="py-4 px-6 text-sm text-red-500">-Rp {t.discount_amount.toLocaleString('id-ID')}</td>
                  <td className="py-4 px-6 text-sm font-bold text-emerald-600">Rp {(t.total_amount - t.discount_amount).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderStores = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl font-bold text-gray-900">Manajemen Toko</h3>
        <button 
          onClick={() => { setEditingStore(null); setIsStoreModalOpen(true); }}
          className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus size={20} /> Tambah Toko
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map(s => (
          <Card key={s.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                <StoreIcon size={24} />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setEditingStore(s); setIsStoreModalOpen(true); }}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <SettingsIcon size={18} />
                </button>
                <button 
                  onClick={() => handleDeleteStore(s.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <h4 className="font-serif text-lg font-bold text-gray-900 mb-1">{s.name}</h4>
            <p className="text-sm text-gray-500 mb-4">{s.address}</p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Phone size={14} /> {s.phone}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl font-bold text-gray-900">Manajemen User</h3>
        <button 
          onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
          className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20"
        >
          <Plus size={20} /> Tambah User
        </button>
      </div>
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-gray-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">{u.email}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <SettingsIcon size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <h3 className="font-serif text-3xl font-bold text-gray-900">Pengaturan</h3>
      
      <Card className="p-8">
        <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
          <StoreIcon size={20} className="text-amber-500" /> Profil Bisnis
        </h4>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nama Bisnis</label>
            <input type="text" defaultValue="Aroma Essence Perfume" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Slogan</label>
            <input type="text" defaultValue="Luxury Scent for Everyone" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Mata Uang</label>
              <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none">
                <option>IDR (Rp)</option>
                <option>USD ($)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Format Tanggal</label>
              <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none">
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-8">
        <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Bell size={20} className="text-amber-500" /> Notifikasi & Keamanan
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-bold text-gray-800">Notifikasi Stok Rendah</p>
              <p className="text-xs text-gray-400">Kirim peringatan jika stok di bawah 200ml</p>
            </div>
            <div className="w-12 h-6 bg-amber-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-bold text-gray-800">Laporan Harian Otomatis</p>
              <p className="text-xs text-gray-400">Kirim ringkasan penjualan ke email admin</p>
            </div>
            <div className="w-12 h-6 bg-gray-200 rounded-full relative">
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </Card>

      <button className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20">
        Simpan Perubahan
      </button>
    </div>
  );

  const renderStock = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Stok" 
          value={`${stockMatrix.reduce((sum, p) => sum + p.total_stock, 0).toLocaleString('id-ID')} ml`} 
          icon={Package} 
          colorClass="bg-emerald-500" 
        />
        <StatCard 
          label="Stok Menipis" 
          value={stockMatrix.filter(p => p.total_stock < 500).length.toString()} 
          icon={AlertTriangle} 
          colorClass="bg-amber-500" 
        />
        <StatCard 
          label="Stok Habis" 
          value={stockMatrix.filter(p => p.total_stock === 0).length.toString()} 
          icon={AlertTriangle} 
          colorClass="bg-red-500" 
        />
      </div>

      <Card>
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-serif text-xl font-bold text-gray-900">Stok per Toko</h3>
          <button className="text-sm text-gray-500 flex items-center gap-2 hover:text-gray-900">
            <Download size={16} /> Export Laporan
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Parfum</th>
                {stores.map(s => (
                  <th key={s.id} className="text-center py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">{s.name}</th>
                ))}
                <th className="text-center py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stockMatrix.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{p.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{p.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{p.category}</p>
                      </div>
                    </div>
                  </td>
                  {stores.map(s => (
                    <td key={s.id} className="py-4 px-6 text-center text-sm font-medium text-gray-600">
                      {p.stocks[s.id]?.toLocaleString('id-ID') || 0} ml
                    </td>
                  ))}
                  <td className="py-4 px-6 text-center text-sm font-bold text-amber-600">
                    {p.total_stock.toLocaleString('id-ID')} ml
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  // --- Layout ---

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden relative">
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col shadow-2xl z-40 transition-transform duration-300 lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-8 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Package className="text-gray-900" size={24} />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-amber-500 tracking-tight">Aroma Essence</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Perfume POS</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <Plus size={24} className="rotate-45" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-800">
          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 block px-2">Toko Aktif</label>
          <div className="relative">
            <StoreIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
            <select 
              value={activeStoreId}
              onChange={(e) => setActiveStoreId(parseInt(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none"
            >
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            <SidebarLink icon={LayoutDashboard} label="Dashboard" active={activePage === 'dashboard'} onClick={() => { setActivePage('dashboard'); setIsSidebarOpen(false); }} />
            <SidebarLink icon={Calculator} label="Kasir" active={activePage === 'cashier'} onClick={() => { setActivePage('cashier'); setIsSidebarOpen(false); }} />
            <SidebarLink icon={Database} label="Daftar Parfum" active={activePage === 'perfumes'} onClick={() => { setActivePage('perfumes'); setIsSidebarOpen(false); }} />
            <SidebarLink icon={Package} label="Stok Parfum" active={activePage === 'stock'} onClick={() => { setActivePage('stock'); setIsSidebarOpen(false); }} />
            <SidebarLink icon={ArrowLeftRight} label="Transfer Stok" active={activePage === 'transfer'} onClick={() => { setActivePage('transfer'); setIsSidebarOpen(false); }} />
            
            <div className="pt-8 pb-2 px-6">
              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Laporan</span>
            </div>
            <SidebarLink icon={BarChart3} label="Laporan Penjualan" active={activePage === 'sales-report'} onClick={() => { setActivePage('sales-report'); setIsSidebarOpen(false); }} />
            
            <div className="pt-8 pb-2 px-6">
              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Pengaturan</span>
            </div>
            <SidebarLink icon={StoreIcon} label="Manajemen Toko" active={activePage === 'stores'} onClick={() => { setActivePage('stores'); setIsSidebarOpen(false); }} />
            <SidebarLink icon={Users} label="Manajemen User" active={activePage === 'users'} onClick={() => { setActivePage('users'); setIsSidebarOpen(false); }} />
            <SidebarLink icon={SettingsIcon} label="Pengaturan" active={activePage === 'settings'} onClick={() => { setActivePage('settings'); setIsSidebarOpen(false); }} />
          </div>
        </nav>

        <div className="p-6 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-gray-900 font-bold shadow-md">
              AS
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">Admin Sari</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Super Admin</p>
            </div>
            <button className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white transition-all">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-8 py-5 flex-shrink-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 bg-gray-50 text-gray-500 hover:text-amber-500 rounded-xl transition-all"
              >
                <LayoutDashboard size={20} />
              </button>
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 capitalize">
                  {activePage.replace('-', ' ')}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">
                  {activeStore?.name} • {new Date().toLocaleDateString('id-ID', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2.5 bg-gray-50 text-gray-500 hover:text-amber-500 rounded-xl transition-all">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="h-8 w-[1px] bg-gray-100 mx-2"></div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">15:42</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">WIB</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activePage === 'dashboard' && renderDashboard()}
              {activePage === 'cashier' && renderCashier()}
              {activePage === 'perfumes' && renderPerfumes()}
              {activePage === 'stock' && renderStock()}
              {activePage === 'transfer' && renderTransfer()}
              {activePage === 'sales-report' && renderSalesReport()}
              {activePage === 'stores' && renderStores()}
              {activePage === 'users' && renderUsers()}
              {activePage === 'settings' && renderSettings()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Global Modals */}
      {renderReceiptModal()}

      <AnimatePresence>
        {selectedPerfumeForMl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPerfumeForMl(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-gray-900">Tambah ke Keranjang</h3>
                <button onClick={() => setSelectedPerfumeForMl(null)} className="text-gray-400 hover:text-gray-600">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedPerfumeForMl.gradient} flex items-center justify-center text-3xl`}>
                    {selectedPerfumeForMl.icon}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{selectedPerfumeForMl.name}</p>
                    <p className="text-sm text-gray-500">{selectedPerfumeForMl.category}</p>
                    <p className="text-amber-600 font-bold">Rp {selectedPerfumeForMl.price.toLocaleString('id-ID')}/ml</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Jumlah (ml)</label>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setMlAmount(Math.max(1, mlAmount - 5))}
                      className="w-14 h-14 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
                    >
                      <Minus size={24} />
                    </button>
                    <input 
                      type="number" 
                      value={mlAmount}
                      onChange={(e) => setMlAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 text-center text-3xl font-serif font-bold py-3 border-b-2 border-amber-500 focus:outline-none"
                    />
                    <button 
                      onClick={() => setMlAmount(mlAmount + 5)}
                      className="w-14 h-14 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                  <div className="flex justify-center gap-2">
                    {[10, 20, 30, 50, 100].map(val => (
                      <button 
                        key={val}
                        onClick={() => setMlAmount(val)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          mlAmount === val ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {val}ml
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-amber-50 rounded-2xl flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total Harga</span>
                  <span className="text-2xl font-serif font-bold text-amber-600">
                    Rp {(mlAmount * selectedPerfumeForMl.price).toLocaleString('id-ID')}
                  </span>
                </div>

                <button 
                  onClick={() => addToCart(selectedPerfumeForMl, mlAmount)}
                  className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold shadow-xl shadow-gray-900/20 hover:shadow-gray-900/40 transition-all flex items-center justify-center gap-3"
                >
                  <ShoppingCart size={20} /> Tambah ke Keranjang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPerfumeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPerfumeModalOpen(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-gray-900">Tambah Parfum</h3>
                <button onClick={() => setIsPerfumeModalOpen(false)} className="text-gray-400 hover:text-gray-600"><Plus size={24} className="rotate-45" /></button>
              </div>
              <form onSubmit={handleSavePerfume} className="p-6 space-y-4">
                <input type="text" name="name" placeholder="Nama Parfum" required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none" />
                <input type="text" name="category" placeholder="Kategori" required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none" />
                <input type="number" name="price" placeholder="Harga per ml" required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" name="icon" placeholder="Icon (Emoji)" required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none" />
                  <input type="text" name="gradient" placeholder="Gradient Class" defaultValue="from-amber-100 to-amber-200" required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none" />
                </div>
                <button type="submit" className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all">Simpan Parfum</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isStoreModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsStoreModalOpen(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-gray-900">{editingStore ? 'Edit Toko' : 'Tambah Toko'}</h3>
                <button onClick={() => setIsStoreModalOpen(false)} className="text-gray-400 hover:text-gray-600"><Plus size={24} className="rotate-45" /></button>
              </div>
              <form onSubmit={handleSaveStore} className="p-6 space-y-4">
                <input type="text" name="name" placeholder="Nama Toko" defaultValue={editingStore?.name} required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none" />
                <input type="text" name="address" placeholder="Alamat" defaultValue={editingStore?.address} required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none" />
                <input type="text" name="phone" placeholder="No. Telepon" defaultValue={editingStore?.phone} required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none" />
                <button type="submit" className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all">Simpan Toko</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUserModalOpen(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-gray-900">{editingUser ? 'Edit User' : 'Tambah User'}</h3>
                <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600"><Plus size={24} className="rotate-45" /></button>
              </div>
              <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                <input type="text" name="name" placeholder="Nama Lengkap" defaultValue={editingUser?.name} required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none" />
                <input type="email" name="email" placeholder="Email" defaultValue={editingUser?.email} required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none" />
                <select name="role" defaultValue={editingUser?.role || 'staff'} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none">
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
                <select name="store_id" defaultValue={editingUser?.store_id || ''} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none">
                  <option value="">Semua Toko (Admin)</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {!editingUser && <input type="password" name="password" placeholder="Password" required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none" />}
                <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all">Simpan User</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden z-10">
              <div className="p-6 border-b border-gray-50">
                <h3 className="font-serif text-xl font-bold text-gray-900">{confirmModal.title}</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600">{confirmModal.message}</p>
              </div>
              <div className="p-6 bg-gray-50 flex gap-3">
                <button 
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-track-piece {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
}
