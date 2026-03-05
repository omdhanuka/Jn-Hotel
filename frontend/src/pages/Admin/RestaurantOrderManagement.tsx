import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Bell, QrCode, ChevronRight, Trash2,
  RefreshCw, User, Phone, CheckCircle, Clock, ClipboardList, LayoutGrid, BookOpen, BarChart2, Settings,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface RestaurantTable {
  _id: string;
  tableId: string;
  tableName: string;
  seatingCapacity: number;
  tableType: string;
  status: string;
  isAvailable: boolean;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface QROrder {
  _id: string;
  tableNumber: string | number;
  tableName?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'active' | 'completed' | 'cancelled';
  specialRequests?: string;
  createdAt: string;
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const timeAgo = (dateStr: string): string => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff === 1) return '1 min ago';
  return `${diff} mins ago`;
};


const RestaurantOrderManagement: React.FC = () => {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [activeOrders, setActiveOrders] = useState<QROrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [generatingBill, setGeneratingBill] = useState(false);

  // â”€â”€ Fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [tablesRes, activeRes] = await Promise.allSettled([
        axios.get('/restaurant/tables'),
        axios.get('/qr/admin/orders/active'),
      ]);
      const fetchedTables: RestaurantTable[] =
        tablesRes.status === 'fulfilled' ? tablesRes.value.data.tables || [] : [];
      const fetchedOrders: QROrder[] =
        activeRes.status === 'fulfilled' ? activeRes.value.data.orders || [] : [];
      setTables(fetchedTables);
      setActiveOrders(fetchedOrders);
      // Keep selected table in sync without closing over its state
      setSelectedTable((prev) =>
        prev ? (fetchedTables.find((t) => t._id === prev._id) ?? prev) : null
      );
    } catch {
      toast.error('Failed to load restaurant data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const getOrderForTable = (table: RestaurantTable): QROrder | null =>
    activeOrders.find(
      (o) =>
        String(o.tableNumber) === String(table.tableId) ||
        String(o.tableNumber) === String(table.tableName) ||
        (o.tableName && o.tableName === table.tableName)
    ) || null;

  const isOccupied = (table: RestaurantTable) => getOrderForTable(table) !== null;

  const selectedOrder = selectedTable ? getOrderForTable(selectedTable) : null;
  const occupiedTables = tables.filter((t) => getOrderForTable(t) !== null);
  const displayedTabs = [
    ...occupiedTables,
    ...tables.filter((t) => !isOccupied(t)),
  ].slice(0, 4);

  const filteredTables = tables.filter((t) =>
    t.tableName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleTableClick = (table: RestaurantTable) => {
    setSelectedTable(table);
    setActiveTabId(table._id);
    setCustomerName('');
    setCustomerPhone('');
  };

  const handleRemoveItem = (orderId: string, itemIndex: number) => {
    setActiveOrders((prev) =>
      prev.map((o) => {
        if (o._id !== orderId) return o;
        const newItems = o.items.filter((_, i) => i !== itemIndex);
        return { ...o, items: newItems, totalAmount: newItems.reduce((s, i) => s + i.price * i.quantity, 0) };
      })
    );
  };

  const handleGenerateBill = async () => {
    if (!selectedTable || !selectedOrder) return;
    setGeneratingBill(true);
    try {
      await axios.put(`/qr/admin/orders/${selectedOrder._id}/status`, { status: 'completed' });
      await axios.put(`/restaurant/tables/${selectedTable._id}`, { status: 'available', isAvailable: true });
      toast.success(`Bill generated for ${selectedTable.tableName}!`);
      setSelectedTable(null);
      setActiveTabId(null);
      setCustomerName('');
      setCustomerPhone('');
      fetchData(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate bill');
    } finally {
      setGeneratingBill(false);
    }
  };

  // â”€â”€ Table Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const TableCard: React.FC<{ table: RestaurantTable }> = ({ table }) => {
    const occupied = isOccupied(table);
    const order = getOrderForTable(table);
    const isSelected = selectedTable?._id === table._id;

    return (
      <button
        onClick={() => handleTableClick(table)}
        className={`relative w-full rounded-2xl p-3 text-left transition-all duration-200 border-2 focus:outline-none
          ${isSelected
            ? 'border-green-500 bg-white shadow-lg shadow-green-100'
            : occupied
              ? 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
              : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
          }`}
      >
        {/* Status badge */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full
              ${occupied ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}
          >
            {occupied ? 'Busy' : 'Empty'}
          </span>
          {isSelected && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-300 flex items-center gap-0.5">
              <CheckCircle className="h-2.5 w-2.5" />
              Selected
            </span>
          )}
        </div>

        <p className="text-sm font-bold text-gray-800 leading-tight">{table.tableName}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {occupied && order ? timeAgo(order.createdAt) : 'Empty'}
        </p>

        {occupied && (
          <div className="absolute top-2 right-2">
            <QrCode className="h-3 w-3 text-green-500" />
          </div>
        )}
      </button>
    );
  };

  // â”€â”€ Loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading restaurant data...</p>
        </div>
      </div>
    );
  }

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="flex h-full min-h-screen bg-gray-50 -m-6 overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-4 bg-white border-b border-gray-100 px-6 py-3 shrink-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1" />
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Refresh"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button title="Notifications" className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Bell className="h-4 w-4 text-gray-500" />
          </button>
          <div className="relative h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white shadow ring-2 ring-white">
            <User className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-orange-400 border-2 border-white text-[8px] font-bold flex items-center justify-center text-white">
              {occupiedTables.length}
            </span>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">

          {/* Table grid */}
          <div className="flex-1 overflow-y-auto p-6 min-w-0">

            <div className="flex items-center justify-between mb-5">
              <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />
                  {occupiedTables.length} Occupied
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-300 inline-block" />
                  {tables.length - occupiedTables.length} Empty
                </span>
              </div>
            </div>

            {/* Quick-tab strip */}
            {displayedTabs.length > 0 && (
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {displayedTabs.map((t) => {
                  const occ = isOccupied(t);
                  const sel = activeTabId === t._id;
                  return (
                    <button
                      key={t._id}
                      onClick={() => handleTableClick(t)}
                      className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all
                        ${sel
                          ? 'bg-white border-green-500 text-green-700 shadow'
                          : occ
                            ? 'bg-white border-gray-200 text-gray-700 hover:border-green-300'
                            : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                        }`}
                    >
                      {t.tableName}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Total Tables', value: tables.length, color: 'text-gray-700' },
                { label: 'Active QR Orders', value: activeOrders.length, color: 'text-green-600' },
                { label: 'Available', value: tables.length - occupiedTables.length, color: 'text-blue-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Table grid */}
            {filteredTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <LayoutGrid className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">No tables found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredTables.map((table) => (
                  <TableCard key={table._id} table={table} />
                ))}
              </div>
            )}

            {/* Mobile order panel */}
            {selectedTable && selectedOrder && (
              <div className="lg:hidden mt-6">
                <OrderPanel
                  table={selectedTable}
                  order={selectedOrder}
                  customerName={customerName}
                  customerPhone={customerPhone}
                  onNameChange={setCustomerName}
                  onPhoneChange={setCustomerPhone}
                  onRemoveItem={handleRemoveItem}
                  onGenerateBill={handleGenerateBill}
                  generatingBill={generatingBill}
                  onClose={() => { setSelectedTable(null); setActiveTabId(null); }}
                />
              </div>
            )}
          </div>

          {/* Desktop right panel */}
          <div className="hidden lg:flex flex-col w-72 xl:w-80 bg-white border-l border-gray-100 overflow-y-auto shrink-0">
            {selectedTable && selectedOrder ? (
              <OrderPanel
                table={selectedTable}
                order={selectedOrder}
                customerName={customerName}
                customerPhone={customerPhone}
                onNameChange={setCustomerName}
                onPhoneChange={setCustomerPhone}
                onRemoveItem={handleRemoveItem}
                onGenerateBill={handleGenerateBill}
                generatingBill={generatingBill}
                onClose={() => { setSelectedTable(null); setActiveTabId(null); }}
              />
            ) : selectedTable && !selectedOrder ? (
              <EmptyTablePanel
                table={selectedTable}
                onClose={() => { setSelectedTable(null); setActiveTabId(null); }}
              />
            ) : (
              <NoSelectionPanel />
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// â”€â”€â”€ Order Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface OrderPanelProps {
  table: RestaurantTable;
  order: QROrder;
  customerName: string;
  customerPhone: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onRemoveItem: (orderId: string, idx: number) => void;
  onGenerateBill: () => void;
  generatingBill: boolean;
  onClose: () => void;
}

const OrderPanel: React.FC<OrderPanelProps> = ({
  table, order,
  customerName, customerPhone,
  onNameChange, onPhoneChange,
  onRemoveItem, onGenerateBill,
  generatingBill, onClose,
}) => {
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-bold text-gray-900">{table.tableName}</h2>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            {timeAgo(order.createdAt)}
          </p>
        </div>
        <button
          onClick={onClose}
          title="Close panel"
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* Name */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Name <span className="normal-case text-gray-300 font-normal">(optional)</span>
          </p>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <User className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => onNameChange(e.target.value)}
              className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Phone</p>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <span className="text-sm font-semibold text-gray-500 shrink-0">+91</span>
            <Phone className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              type="tel"
              placeholder="Phone Number"
              value={customerPhone}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Order items */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Order Summary</p>

          {order.items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No items</p>
          ) : (
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-lg text-gray-400">&#127869;</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.name}{item.quantity > 1 ? ` x ${item.quantity}` : ''}
                    </p>
                    <p className="text-xs text-gray-400">&#8377; {item.price.toFixed(0)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-700">&#8377; {(item.price * item.quantity).toFixed(0)}</p>
                    <button
                      onClick={() => onRemoveItem(order._id, idx)}
                      className="mt-0.5 text-gray-300 hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bill footer */}
      <div className="px-5 py-4 border-t border-gray-100 space-y-3">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>&#8377; {subtotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Delivery Charge</span>
            <span>&#8377; 0</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-dashed border-gray-200">
            <span>Total</span>
            <span>&#8377; {total.toFixed(0)}</span>
          </div>
        </div>

        <button
          onClick={onGenerateBill}
          disabled={generatingBill || order.items.length === 0}
          className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold text-sm transition-colors shadow-sm"
        >
          {generatingBill ? 'Generating...' : 'Generate Bill'}
        </button>
      </div>
    </div>
  );
};

// â”€â”€â”€ Empty / No-Selection Panels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const EmptyTablePanel: React.FC<{ table: RestaurantTable; onClose: () => void }> = ({ table, onClose }) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <h2 className="font-bold text-gray-900">{table.tableName}</h2>
      <button onClick={onClose} title="Close panel" className="p-1.5 rounded-full hover:bg-gray-100">
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </button>
    </div>
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
      <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center">
        <QrCode className="h-7 w-7 text-gray-300" />
      </div>
      <p className="font-semibold text-gray-600">Table is Empty</p>
      <p className="text-xs text-gray-400 max-w-[180px]">
        Orders appear here automatically when the customer scans the table QR code.
      </p>
    </div>
  </div>
);

const NoSelectionPanel: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
    <div className="h-14 w-14 rounded-2xl bg-green-50 flex items-center justify-center">
      <ClipboardList className="h-7 w-7 text-green-300" />
    </div>
    <p className="font-semibold text-gray-600">Select a Table</p>
    <p className="text-xs text-gray-400 max-w-[180px]">
      Click any table card to view its active QR order and generate a bill.
    </p>
  </div>
);

export default RestaurantOrderManagement;
