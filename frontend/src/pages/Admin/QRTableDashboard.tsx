import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Utensils, QrCode, RefreshCw, Download, CheckCircle2, Circle,
  Users, Clock, Receipt, X, AlertTriangle, Loader2, Settings,
  TrendingUp, Package, Ban, History, ChevronRight, Eye
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

// ── Types ──────────────────────────────────────────────────────────────────
interface ActiveOrder {
  _id: string;
  items: { name: string; quantity: number; price: number; dishType: string }[];
  totalAmount: number;
  createdAt: string;
  specialRequests?: string;
}

interface QRTableData {
  _id: string;
  tableNumber: number;
  tableName: string;
  capacity: number;
  qrCodeUrl: string;
  status: 'empty' | 'occupied';
  activeOrder: ActiveOrder | null;
}

interface HistoryOrder {
  _id: string;
  tableNumber: number;
  tableName: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
}

type Tab = 'pos' | 'history';

// ── Utility ────────────────────────────────────────────────────────────────
const timeSince = (dateStr: string) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 60000;
  if (diff < 1) return 'just now';
  if (diff < 60) return `${Math.floor(diff)}m ago`;
  return `${Math.floor(diff / 60)}h ${Math.floor(diff % 60)}m ago`;
};

// ── QR Modal ───────────────────────────────────────────────────────────────
const QRModal: React.FC<{ table: QRTableData; onClose: () => void }> = ({ table, onClose }) => {
  const svgRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    const svgEl = svgRef.current?.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 480;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 400, 480);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 40, 40, 320, 320);
      ctx.fillStyle = '#1f2937'; ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center'; ctx.fillText(table.tableName, 200, 400);
      ctx.font = '14px Arial'; ctx.fillStyle = '#6b7280';
      ctx.fillText(`Scan to order | Capacity: ${table.capacity}`, 200, 430);
      const link = document.createElement('a');
      link.download = `QR-Table-${table.tableNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-gray-900">{table.tableName} — QR Code</h3>
          <button onClick={onClose} title="Close" className="p-1.5 hover:bg-gray-100 rounded-full"><X className="h-4 w-4" /></button>
        </div>
        <div ref={svgRef} className="flex justify-center mb-4 p-4 bg-white border-2 border-gray-100 rounded-xl">
          <QRCodeSVG
            value={table.qrCodeUrl}
            size={220}
            level="H"
            includeMargin
            imageSettings={{
              src: '',
              height: 0,
              width: 0,
              excavate: false,
            }}
          />
        </div>
        <p className="text-xs text-gray-400 text-center mb-1 break-all">{table.qrCodeUrl}</p>
        <p className="text-xs text-gray-400 text-center mb-4">Capacity: {table.capacity} guests</p>
        <button
          onClick={downloadQR}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-xl font-bold hover:bg-gray-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download PNG
        </button>
      </div>
    </div>
  );
};

// ── Bill Modal ─────────────────────────────────────────────────────────────
const BillModal: React.FC<{
  table: QRTableData;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}> = ({ table, onConfirm, onClose, loading }) => {
  if (!table.activeOrder) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-black text-gray-900">Generate Bill</h3>
          <button onClick={onClose} title="Close" className="p-1.5 hover:bg-gray-100 rounded-full"><X className="h-4 w-4" /></button>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 mb-4">
          <p className="text-sm font-bold text-gray-700 mb-1">{table.tableName}</p>
          <p className="text-xs text-gray-400">Order placed {timeSince(table.activeOrder.createdAt)}</p>
        </div>
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {table.activeOrder.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.name} ×{item.quantity}</span>
              <span className="font-semibold text-gray-900">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
        {table.activeOrder.specialRequests && (
          <div className="bg-blue-50 rounded-lg p-2 mb-4 text-xs text-blue-700">
            Note: {table.activeOrder.specialRequests}
          </div>
        )}
        <div className="flex justify-between font-black text-gray-900 py-3 border-t border-gray-100 mb-5">
          <span>Total Amount</span>
          <span className="text-orange-500 text-xl">₹{table.activeOrder.totalAmount}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose} className="py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Confirm Bill
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const QRTableDashboard: React.FC = () => {
  const [tables, setTables] = useState<QRTableData[]>([]);
  const [history, setHistory] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [billLoading, setBillLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('pos');
  const [qrModal, setQrModal] = useState<QRTableData | null>(null);
  const [billModal, setBillModal] = useState<QRTableData | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // ── Stats ──
  const occupied = tables.filter(t => t.status === 'occupied').length;
  const totalRevenue = tables.filter(t => t.activeOrder).reduce((s, t) => s + (t.activeOrder?.totalAmount ?? 0), 0);

  // ── Fetch tables ──
  const fetchTables = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await axios.get('/qr/admin/tables');
      setTables(data.tables || []);
    } catch (err: any) {
      if (!silent) toast.error(err.response?.data?.message || 'Failed to load tables');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // ── Fetch history ──
  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await axios.get('/qr/admin/orders/history?limit=50');
      setHistory(data.orders || []);
    } catch {
      toast.error('Failed to load order history');
    }
  }, []);

  useEffect(() => {
    fetchTables();
    // Auto-refresh every 20 seconds
    intervalRef.current = setInterval(() => fetchTables(true), 20000);
    return () => clearInterval(intervalRef.current);
  }, [fetchTables]);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchHistory]);

  // ── Setup tables ──
  const setupTables = async () => {
    setSetupLoading(true);
    try {
      const { data } = await axios.post('/qr/admin/setup', { count: 20 });
      toast.success(data.message);
      fetchTables();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Setup failed');
    } finally {
      setSetupLoading(false);
    }
  };

  // ── Generate bill ──
  const handleGenerateBill = async () => {
    if (!billModal) return;
    setBillLoading(true);
    try {
      const { data } = await axios.post(`/qr/admin/bill/${billModal.tableNumber}`);
      toast.success(data.message);
      setBillModal(null);
      fetchTables(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate bill');
    } finally {
      setBillLoading(false);
    }
  };

  // ── Cancel order ──
  const handleCancelOrder = async (tableNumber: number) => {
    if (!window.confirm(`Cancel order for Table ${tableNumber}?`)) return;
    setCancelLoading(true);
    try {
      const { data } = await axios.post(`/qr/admin/cancel/${tableNumber}`);
      toast.success(data.message);
      fetchTables(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">QR Table POS</h1>
              <p className="text-xs text-gray-400">Restaurant Order Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchTables()}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-500 border border-gray-200 px-3 py-2 rounded-xl hover:border-orange-300 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:block">Refresh</span>
            </button>
            {tables.length === 0 && (
              <button
                onClick={setupTables}
                disabled={setupLoading}
                className="flex items-center gap-2 text-sm bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-xl font-bold transition-all"
              >
                {setupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                Setup Tables
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-0 border-t border-gray-100">
          {(['pos', 'history'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'pos' ? '🍽 Tables & Orders' : '📋 Order History'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Stats bar ── */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Tables', value: tables.length, icon: <Users className="h-5 w-5" />, color: 'blue' },
              { label: 'Occupied', value: occupied, icon: <Utensils className="h-5 w-5" />, color: 'orange' },
              { label: 'Empty', value: tables.length - occupied, icon: <Circle className="h-5 w-5" />, color: 'green' },
              { label: 'Active Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: <TrendingUp className="h-5 w-5" />, color: 'purple' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                  s.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  s.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                  s.color === 'green' ? 'bg-green-100 text-green-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {s.icon}
                </div>
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── POS Tab ── */}
        {activeTab === 'pos' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-10 w-10 text-orange-400 animate-spin" />
              </div>
            ) : tables.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
                <QrCode className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No Tables Yet</h3>
                <p className="text-gray-400 mb-6">Click "Setup Tables" to initialize 20 QR tables for your restaurant.</p>
                <button
                  onClick={setupTables}
                  disabled={setupLoading}
                  className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
                >
                  {setupLoading ? 'Setting up…' : 'Setup 20 Tables'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {tables.map(table => {
                  const isOccupied = table.status === 'occupied';
                  return (
                    <div
                      key={table._id}
                      className={`rounded-2xl border-2 p-4 flex flex-col transition-all ${
                        isOccupied
                          ? 'bg-orange-50 border-orange-300 shadow-md'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Table number + status dot */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-400 font-medium">TABLE</p>
                          <p className={`text-3xl font-black leading-none ${isOccupied ? 'text-orange-600' : 'text-gray-700'}`}>
                            {table.tableNumber}
                          </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full mt-1 ${isOccupied ? 'bg-orange-500 animate-pulse' : 'bg-gray-300'}`} />
                      </div>

                      {/* Table name + capacity */}
                      <p className="text-xs font-semibold text-gray-600 mb-0.5">{table.tableName}</p>
                      <p className="text-xs text-gray-400 mb-3">{table.capacity} seats</p>

                      {/* Status badge */}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full self-start mb-3 ${
                        isOccupied ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isOccupied ? 'Occupied' : 'Empty'}
                      </span>

                      {/* Active order preview */}
                      {isOccupied && table.activeOrder && (
                        <div className="bg-white rounded-xl p-2 mb-3 border border-orange-100">
                          <p className="text-xs text-gray-500 mb-1">{table.activeOrder.items.length} item{table.activeOrder.items.length !== 1 ? 's' : ''}</p>
                          <div className="space-y-0.5 max-h-16 overflow-hidden">
                            {table.activeOrder.items.slice(0, 3).map((item, i) => (
                              <p key={i} className="text-xs text-gray-700 truncate">• {item.name} ×{item.quantity}</p>
                            ))}
                            {table.activeOrder.items.length > 3 && (
                              <p className="text-xs text-gray-400">+{table.activeOrder.items.length - 3} more</p>
                            )}
                          </div>
                          <p className="text-sm font-black text-orange-600 mt-1.5">₹{table.activeOrder.totalAmount}</p>
                          <p className="text-xs text-gray-400">{timeSince(table.activeOrder.createdAt)}</p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-auto space-y-1.5">
                        {isOccupied ? (
                          <>
                            <button
                              onClick={() => setBillModal(table)}
                              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-colors"
                            >
                              <Receipt className="h-3.5 w-3.5" />
                              Generate Bill
                            </button>
                            <button
                              onClick={() => handleCancelOrder(table.tableNumber)}
                              disabled={cancelLoading}
                              className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                            >
                              <Ban className="h-3 w-3" />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setQrModal(table)}
                            className="w-full bg-gray-900 hover:bg-gray-700 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            View QR
                          </button>
                        )}
                        {!isOccupied && (
                          <button
                            onClick={() => setQrModal(table)}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            QR Code
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── History Tab ── */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-gray-900">Order History</h3>
              <button onClick={fetchHistory} title="Refresh history" className="text-sm text-gray-500 hover:text-orange-500">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            {history.length === 0 ? (
              <div className="py-16 text-center">
                <History className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">No completed orders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {history.map(order => (
                  <div key={order._id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{order.tableName}</p>
                        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-900">₹{order.totalAmount}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {item.name} ×{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {qrModal && <QRModal table={qrModal} onClose={() => setQrModal(null)} />}
      {billModal && (
        <BillModal
          table={billModal}
          onConfirm={handleGenerateBill}
          onClose={() => setBillModal(null)}
          loading={billLoading}
        />
      )}
    </div>
  );
};

export default QRTableDashboard;
