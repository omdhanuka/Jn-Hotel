import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Plus, Minus, X, Star, Search, ChevronRight,
  Utensils, Clock, Check, AlertCircle, Loader2, Tag, Trash2
} from 'lucide-react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

// Standalone axios instance — does NOT depend on AuthContext baseURL
// Works for unauthenticated guests scanning QR codes
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_BASE });

// ── Types ──────────────────────────────────────────────────────────────────
interface MenuItem {
  _id: string;
  itemId: string;
  name: string;
  category: string;
  description: string;
  dishType: 'veg' | 'non-veg' | 'vegan';
  price: number;
  originalPrice?: number;
  isAvailable: boolean;
  preparationTime?: string;
  images: string[];
  isFeatured: boolean;
  calories?: number;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface TableInfo {
  tableNumber: number;
  tableName: string;
  capacity: number;
  status: 'empty' | 'occupied';
}

// ── Dish type indicator ────────────────────────────────────────────────────
const DishDot: React.FC<{ type: string }> = ({ type }) => {
  const border = type === 'veg' ? 'border-green-600' : type === 'vegan' ? 'border-blue-600' : 'border-red-600';
  const dot = type === 'veg' ? 'bg-green-600' : type === 'vegan' ? 'bg-blue-600' : 'bg-red-600';
  return (
    <div className={`w-4 h-4 border-2 ${border} rounded flex items-center justify-center flex-shrink-0`}>
      <div className={`w-2 h-2 ${dot} rounded-full`} />
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const QRMenu: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const tableParam = queryParams.get('table');
  const tableNumber = tableParam && !isNaN(parseInt(tableParam)) ? parseInt(tableParam) : null;

  // Build a synthetic tableInfo immediately from the URL param so ordering
  // never gets blocked waiting for backend verification
  const syntheticTable: TableInfo | null = tableParam
    ? { tableNumber: tableNumber ?? 0, tableName: `Table ${tableParam}`, capacity: 4, status: 'empty' }
    : null;

  // State
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(syntheticTable); // pre-seeded from URL
  const [tableError, setTableError] = useState<string>('');
  const [tableOccupied, setTableOccupied] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingTable, setCheckingTable] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderId: string; totalAmount: number } | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');

  // Derived
  const categories = ['All', ...Array.from(new Set(menuItems.map(i => i.category).filter(Boolean)))];
  const filtered = menuItems.filter(item => {
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  // Always shows a sensible name — updates once backend verifies the table
  const displayTableName = tableInfo?.tableName ?? syntheticTable?.tableName ?? 'Your Table';

  // ── Fetch table info (optional — enriches syntheticTable with real data) ──────────
  const checkTable = useCallback(async () => {
    if (!tableNumber) {
      setCheckingTable(false);
      return;
    }
    try {
      const { data } = await api.get(`/qr/table/${tableNumber}`);
      if (data.success && !data.hasActiveOrder) {
        // Replace synthetic with real verified data
        setTableInfo(data.table);
      } else if (data.hasActiveOrder) {
        setTableOccupied(true);
      }
      // If table not found in QR system, syntheticTable stays — ordering still works
    } catch {
      // Route not available yet (backend restart pending) — syntheticTable handles it
    } finally {
      setCheckingTable(false);
    }
  }, [tableNumber]);

  // ── Fetch menu ────────────────────────────────────────────────────────────
  const fetchMenu = useCallback(async () => {
    try {
      const { data } = await api.get('/restaurant/menu?limit=200');
      // Endpoint returns { menuItems: [...] }
      setMenuItems((data.menuItems || data.items || []).filter((i: any) => i.isAvailable !== false));
    } catch {
      toast.error('Failed to load menu. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkTable();
    fetchMenu();
  }, [checkTable, fetchMenu]);

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const getQty = (id: string) => cart.find(c => c._id === id)?.quantity ?? 0;

  const addItem = (item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(c => c._id === item._id);
      if (ex) return prev.map(c => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(c => c._id !== id));
    else setCart(prev => prev.map(c => c._id === id ? { ...c, quantity: qty } : c));
  };

  // ── Place order ───────────────────────────────────────────────────────────
  const placeOrder = async () => {
    if (!tableInfo && !tableParam) {
      toast.error('No table selected. Please scan your table QR code.');
      return;
    }
    if (cart.length === 0) { toast.error('Your cart is empty!'); return; }

    setPlacingOrder(true);
    try {
      const { data } = await api.post('/qr/order', {
        tableNumber: tableNumber ?? tableParam,
        items: cart.map(i => ({ itemId: i.itemId, name: i.name, quantity: i.quantity })),
        specialRequests,
      });
      setOrderSuccess({ orderId: data.orderId, totalAmount: data.totalAmount });
      setCart([]);
      setShowCart(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to place order';
      toast.error(msg);
      // If table now occupied (race condition), hard-block
      if (err.response?.status === 409) {
        setTableOccupied(true);
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  // ── Invalid table / error screen ──────────────────────────────────────────
  if (checkingTable) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Verifying your table…</p>
        </div>
      </div>
    );
  }

  // ── Hard-block ONLY if this exact table has an active session ─────────────
  if (tableOccupied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Table Occupied</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">{tableError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Order success screen ───────────────────────────────────────────────────
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Check className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Order Placed! 🎉</h2>
          <p className="text-gray-500 mb-4">Your food is being prepared</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Table</span>
              <span className="font-bold">{displayTableName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order ID</span>
              <span className="font-mono text-xs font-bold">{String(orderSuccess.orderId).slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total</span>
              <span className="font-black text-orange-500 text-base">₹{orderSuccess.totalAmount}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Please relax! The waiter will bring your food shortly. Payment at the counter.
          </p>
        </div>
      </div>
    );
  }

  // ── Main menu UI ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" />
      {/* Soft warning banner for unverified tables */}
      {tableError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700">{tableError}</p>
        </div>
      )}
      {/* ── Header ── */}
      <div className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <Utensils className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="font-black text-gray-900 text-lg leading-none">JN Palace</h1>
                <p className="text-xs text-orange-500 font-semibold">{displayTableName}</p>
              </div>
            </div>
          </div>
          {/* Cart button (mobile + desktop) */}
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl font-bold"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <>
                <span className="hidden sm:block">Cart</span>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              </>
            )}
            {cartCount === 0 && <span className="hidden sm:block">Cart</span>}
          </button>
        </div>

        {/* Search */}
        <div className="border-t border-gray-100 px-4 py-2 max-w-5xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search dishes…"
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide max-w-5xl mx-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Menu Grid ── */}
      <div className="max-w-5xl mx-auto px-4 py-5 pb-28">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No dishes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map(item => {
              const qty = getQty(item._id);
              return (
                <div key={item._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Image */}
                  <div className="relative h-40 bg-gray-100 overflow-hidden">
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils className="h-12 w-12 text-gray-200" />
                      </div>
                    )}
                    {item.isFeatured && (
                      <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-white text-gray-700 text-sm font-bold px-3 py-1 rounded-full">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <div className="flex items-start gap-2 mb-1">
                      <DishDot type={item.dishType} />
                      <h3 className="font-bold text-gray-900 text-sm leading-tight flex-1">{item.name}</h3>
                    </div>

                    <p className="text-xs text-gray-400 mb-2 line-clamp-2">{item.description}</p>

                    {/* Stars */}
                    <div className="flex items-center gap-0.5 mb-3">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`h-3 w-3 ${s <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                      ))}
                    </div>

                    {/* Price + Add */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-black text-gray-900 text-base">₹{item.price}</span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="ml-1 text-xs text-gray-400 line-through">₹{item.originalPrice}</span>
                        )}
                      </div>

                      {qty === 0 ? (
                        <button
                          onClick={() => item.isAvailable && addItem(item)}
                          disabled={!item.isAvailable}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            item.isAvailable
                              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-xl px-2 py-1">
                          <button
                            title="Decrease quantity"
                            onClick={() => updateQty(item._id, qty - 1)}
                            className="w-5 h-5 bg-orange-500 text-white rounded flex items-center justify-center"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{qty}</span>
                          <button
                            title="Increase quantity"
                            onClick={() => updateQty(item._id, qty + 1)}
                            className="w-5 h-5 bg-orange-500 text-white rounded flex items-center justify-center"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bottom Cart Bar (mobile) ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-white border-t border-gray-100 md:hidden">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-orange-500 text-white py-3.5 rounded-2xl font-black flex items-center justify-between px-5 shadow-lg"
          >
            <span className="bg-white text-orange-500 rounded-lg px-2.5 py-0.5 text-sm font-black">{cartCount}</span>
            <span>View Cart</span>
            <span className="font-black">₹{cartTotal}</span>
          </button>
        </div>
      )}

      {/* ── Cart Sidebar Overlay ── */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">Your Order</h2>
              <button onClick={() => setShowCart(false)} title="Close cart" className="p-1.5 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Table badge */}
            <div className="px-5 py-2 bg-orange-50 border-b border-orange-100">
              <p className="text-sm text-orange-700 font-semibold">
                📍 {displayTableName}
              </p>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Cart is empty</p>
                </div>
              ) : cart.map(item => (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.images?.[0]
                      ? <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Utensils className="h-5 w-5 text-gray-300" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-orange-500 font-semibold">₹{item.price} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(item._id, item.quantity - 1)}
                      title="Decrease quantity"
                      className="w-6 h-6 bg-gray-200 rounded-md flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item._id, item.quantity + 1)}
                      title="Increase quantity"
                      className="w-6 h-6 bg-gray-200 rounded-md flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-sm font-black text-gray-900 w-14 text-right">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-100">
                {/* Special requests */}
                <textarea
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  rows={2}
                  placeholder="Special requests (optional)…"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                />

                {/* Total */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 font-medium">Total</span>
                  <span className="text-xl font-black text-gray-900">₹{cartTotal}</span>
                </div>

                {/* Place order */}
                <button
                  onClick={placeOrder}
                  disabled={placingOrder}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 transition-colors shadow-lg"
                >
                  {placingOrder
                    ? <><Loader2 className="h-5 w-5 animate-spin" /> Placing Order…</>
                    : <><Check className="h-5 w-5" /> Place Order · ₹{cartTotal}</>
                  }
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">Payment at the counter after your meal</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default QRMenu;
