import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Utensils, Users, Clock, MapPin, Star, Plus, Minus, 
  ShoppingCart, Calendar, Phone, Mail, Search, Filter, X,
  Tag, Zap, TrendingUp, Award, Sparkles, Check, Bell, ChevronRight, Trash2
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface MenuItem {
  _id: string;
  itemId: string;
  name: string;
  category: string;
  description: string;
  dishType: 'veg' | 'non-veg' | 'vegan';
  price: number;
  originalPrice?: number;
  discount?: number;
  isAvailable: boolean;
  preparationTime?: string;
  images: string[];
  spiceLevels: string[];
  addOns: { name: string; price: number }[];
  isFeatured: boolean;
  isTodaySpecial?: boolean;
  calories?: number;
  stockQuantity?: number;
}

interface RestaurantTable {
  _id: string;
  tableId: string;
  tableName: string;
  seatingCapacity: number;
  tableType: string;
  isAvailable: boolean;
  status: string;
  location?: string;
  price?: number;
}

interface CartItem extends MenuItem {
  quantity: number;
  selectedAddOns: { name: string; price: number }[];
  selectedSpiceLevel?: string;
}

interface BookingForm {
  bookingType: 'table' | 'order';
  fullName: string;
  email: string;
  phone: string;
  tableId: string;
  tableNumber: string;
  date: string;
  timeSlot: string;
  numberOfGuests: number;
  deliveryType: 'dine-in' | 'takeaway' | 'delivery';
  deliveryAddress: string;
  landmark: string;
  paymentMethod: string;
  specialRequests: string;
  couponCode: string;
}

const Restaurant: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'menu' | 'tables'>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dishTypeFilter, setDishTypeFilter] = useState<'all' | 'veg' | 'non-veg' | 'vegan'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todaySpecials, setTodaySpecials] = useState<MenuItem[]>([]);
  
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    bookingType: 'order',
    fullName: '',
    email: '',
    phone: '',
    tableId: '',
    tableNumber: '',
    date: '',
    timeSlot: '',
    numberOfGuests: 2,
    deliveryType: 'dine-in',
    deliveryAddress: '',
    landmark: '',
    paymentMethod: 'card',
    specialRequests: '',
    couponCode: ''
  });

  const categories = [
    'all', 'Starters', 'Main Course', 'Desserts', 'Beverages',
    'North Indian', 'South Indian', 'Chinese', 'Continental', 'Italian'
  ];

  const timeSlots = [
    '11:00 AM - 1:00 PM', '1:00 PM - 3:00 PM', '3:00 PM - 5:00 PM',
    '5:00 PM - 7:00 PM', '7:00 PM - 9:00 PM', '9:00 PM - 11:00 PM'
  ];

  useEffect(() => {
    if (user) {
      setBookingForm(prev => ({
        ...prev,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email
      }));
    }
    fetchMenuItems();
    fetchTables();
    // Fetch specials after menu items are loaded
  }, [user]);

  useEffect(() => {
    // Fetch today's specials after menu items are loaded
    if (menuItems.length > 0) {
      fetchTodaySpecials();
    }
  }, [menuItems]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/restaurant/menu?limit=100');
      setMenuItems(response.data.menuItems || []);
    } catch (error) {
      toast.error('Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get('/restaurant/tables');
      setTables(response.data.tables || []);
    } catch (error) {
      toast.error('Failed to fetch tables');
    }
  };

  const fetchTodaySpecials = async () => {
    try {
      // Use the public endpoint for today's specials
      const response = await axios.get('/manager/restaurant/specials/today/public');
      setTodaySpecials(response.data.specials || []);
      console.log('Today specials loaded:', response.data.specials?.length || 0);
    } catch (error: any) {
      console.log('Failed to fetch today specials, using fallback');
      // Fallback: filter from regular menu items that are marked as today's special
      const specialsFromMenu = menuItems.filter((item: MenuItem) => item.isTodaySpecial);
      setTodaySpecials(specialsFromMenu);
      console.log('Fallback specials:', specialsFromMenu.length);
    }
  };

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem._id === item._id);
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem._id === item._id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { 
        ...item, 
        quantity: 1, 
        selectedAddOns: [],
        selectedSpiceLevel: undefined 
      }]);
    }
    toast.success(`${item.name} added to cart`, {
      icon: '🛒',
      style: {
        borderRadius: '16px',
        background: '#10b981',
        color: '#fff',
      },
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item._id !== itemId));
    toast.success('Item removed from cart');
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(cart.map(item =>
      item._id === itemId ? { ...item, quantity } : item
    ));
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const addOnsTotal = item.selectedAddOns.reduce((sum, addon) => sum + addon.price, 0) * item.quantity;
      return total + itemTotal + addOnsTotal;
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.05; // 5% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesDishType = dishTypeFilter === 'all' || item.dishType === dishTypeFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDishType && matchesSearch && item.isAvailable;
  });

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    if (bookingForm.bookingType === 'order' && bookingForm.deliveryType === 'dine-in' && !bookingForm.tableNumber) {
      toast.error('Please enter table number for dine-in orders');
      return;
    }

    try {
      const bookingData = {
        ...bookingForm,
        items: cart.map(item => ({
          menuItem: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          addOns: item.selectedAddOns,
          spiceLevel: item.selectedSpiceLevel
        })),
        totalAmount: calculateTotal()
      };

      const response = await axios.post('/restaurant/bookings', bookingData);
      toast.success(`${bookingForm.bookingType === 'table' ? 'Table reserved' : 'Order placed'} successfully!`, {
        icon: '✅',
        duration: 4000,
      });
      setCart([]);
      setShowBookingForm(false);
      navigate('/dashboard', { state: { newOrder: response.data } });
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${bookingForm.bookingType === 'table' ? 'reserve table' : 'place order'}`);
    }
  };

  const getDishTypeIcon = (type: string) => {
    const colors = {
      'veg': 'border-green-600',
      'non-veg': 'border-red-600',
      'vegan': 'border-blue-600'
    };
    const dotColors = {
      'veg': 'bg-green-600',
      'non-veg': 'bg-red-600',
      'vegan': 'bg-blue-600'
    };
    return (
      <div className={`w-5 h-5 border-2 ${colors[type as keyof typeof colors]} rounded flex items-center justify-center`}>
        <div className={`w-2.5 h-2.5 ${dotColors[type as keyof typeof dotColors]} rounded-full`}></div>
      </div>
    );
  };

  // Determine cart quantity for an item
  const getCartQuantity = (itemId: string) => {
    const cartItem = cart.find(c => c._id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── TOP NAVBAR ── */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-4 flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-gray-800 text-lg hidden sm:block">JN Palace</span>
          </div>

          {/* Search bar */}
          <div className="flex-1 relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for dishes..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
            />
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 text-gray-500 hover:text-orange-500 transition-colors">
              <Bell className="h-6 w-6" />
            </button>
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow">
              {user ? user.firstName?.[0]?.toUpperCase() : 'G'}
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((cat, idx) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}

            {/* Veg / Non-veg quick pills */}
            <div className="h-6 w-px bg-gray-200 mx-2 flex-shrink-0" />
            {(['all', 'veg', 'non-veg'] as const).map(type => (
              <button
                key={type}
                onClick={() => setDishTypeFilter(type)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                  dishTypeFilter === type
                    ? type === 'veg'
                      ? 'bg-green-500 text-white border-green-500'
                      : type === 'non-veg'
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-gray-700 text-white border-gray-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {type === 'all' ? '🍽 All' : type === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* ── LEFT: Menu Grid ── */}
        <div className="flex-1 min-w-0">

          {/* Today's Special Banner */}
          {todaySpecials.length > 0 && todaySpecials[0] && (todaySpecials[0].stockQuantity ?? 0) > 0 && (
            <div className="mb-6 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-orange-500 to-amber-500 flex items-center gap-4 p-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                {todaySpecials[0].images?.[0] ? (
                  <img src={todaySpecials[0].images[0]} alt={todaySpecials[0].name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-orange-300 flex items-center justify-center">
                    <Utensils className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-white">
                <div className="flex items-center gap-2 mb-0.5">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wide">Today's Special</span>
                </div>
                <p className="text-lg font-black leading-tight">{todaySpecials[0].name}</p>
                <p className="text-sm text-orange-100 line-clamp-1">{todaySpecials[0].description}</p>
              </div>
              <div className="flex-shrink-0 text-right text-white">
                <p className="text-2xl font-black">₹{todaySpecials[0].price}</p>
                {todaySpecials[0].originalPrice && (
                  <p className="text-sm line-through text-orange-200">₹{todaySpecials[0].originalPrice}</p>
                )}
                <button
                  onClick={() => addToCart(todaySpecials[0])}
                  className="mt-2 bg-white text-orange-500 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-orange-50 transition-colors shadow"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Section heading */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-800">
              {selectedCategory === 'all' ? 'All Dishes' : selectedCategory}
              <span className="ml-2 text-sm font-medium text-gray-400">({filteredMenuItems.length} items)</span>
            </h2>
          </div>

          {/* Loading skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow animate-pulse">
                  <div className="h-44 bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-16 text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-1">No dishes found</h3>
              <p className="text-gray-400 text-sm">Try a different category or search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMenuItems.map(item => {
                const qty = getCartQuantity(item._id);
                return (
                  <div key={item._id} className="bg-white rounded-2xl shadow hover:shadow-lg transition-shadow overflow-hidden group">
                    {/* Food image */}
                    <div className="relative h-44 overflow-hidden bg-gray-100">
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Utensils className="h-16 w-16 text-gray-300" />
                        </div>
                      )}

                      {/* Featured badge */}
                      {item.isFeatured && (
                        <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                          Popular
                        </span>
                      )}
                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-white text-gray-700 text-sm font-bold px-4 py-2 rounded-full">Out of Stock</span>
                        </div>
                      )}

                      {/* Dish type square indicator */}
                      <div className="absolute top-3 right-3">
                        {getDishTypeIcon(item.dishType)}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-1 flex-1">{item.name}</h3>
                        <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                          {getDishTypeIcon(item.dishType)}
                        </div>
                      </div>

                      {/* Stars + reviews */}
                      <div className="flex items-center gap-1 mb-2">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                        ))}
                        <span className="text-xs text-gray-400 ml-1">({Math.floor(Math.random()*150)+20} reviews)</span>
                      </div>

                      {/* Price row */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-black text-gray-900">₹{item.price}</span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="ml-2 text-xs text-gray-400 line-through">₹{item.originalPrice}</span>
                          )}
                        </div>

                        {/* Add / Qty control */}
                        {qty === 0 ? (
                          <button
                            onClick={() => item.isAvailable && addToCart(item)}
                            disabled={!item.isAvailable}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                              item.isAvailable
                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Add to Cart
                            <ShoppingCart className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-2 py-1">
                            <button
                              onClick={() => updateQuantity(item._id, qty - 1)}
                              className="w-6 h-6 bg-orange-500 text-white rounded-md flex items-center justify-center hover:bg-orange-600 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-bold text-gray-800 w-5 text-center">{qty}</span>
                            <button
                              onClick={() => updateQuantity(item._id, qty + 1)}
                              className="w-6 h-6 bg-orange-500 text-white rounded-md flex items-center justify-center hover:bg-orange-600 transition-colors"
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

        {/* ── RIGHT: Your Order Sidebar ── */}
        <div className="w-80 flex-shrink-0 hidden lg:block">
          <div className="sticky top-[118px]">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-lg font-black text-gray-900">Your Order</h3>
              </div>

              {cart.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">Your cart is empty</p>
                  <p className="text-gray-300 text-xs mt-1">Add items to get started</p>
                </div>
              ) : (
                <>
                  {/* Cart items */}
                  <div className="px-4 py-3 space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
                    {cart.map(item => (
                      <div key={item._id} className="flex items-center gap-3">
                        {/* Thumb */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                          {item.images?.[0] ? (
                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Utensils className="h-5 w-5 text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Name + qty controls */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 leading-tight truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">×{item.quantity}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="w-5 h-5 bg-gray-200 hover:bg-orange-500 hover:text-white text-gray-600 rounded flex items-center justify-center transition-colors"
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </button>
                            <span className="text-xs font-bold text-gray-800 w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="w-5 h-5 bg-gray-200 hover:bg-orange-500 hover:text-white text-gray-600 rounded flex items-center justify-center transition-colors"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>

                        {/* Price + remove */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-black text-gray-900">₹{(item.price * item.quantity).toFixed(0)}</p>
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="mt-1 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Out of stock placeholder styling for items marked unavailable in cart */}
                  </div>

                  {/* Totals */}
                  <div className="px-5 py-4 border-t border-gray-100 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-semibold">₹{calculateSubtotal().toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tax (5%)</span>
                      <span className="font-semibold">₹{calculateTax().toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-100">
                      <span>Total</span>
                      <span>₹{calculateTotal().toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Checkout CTA */}
                  <div className="px-5 pb-5">
                    <button
                      onClick={() => {
                        setBookingForm(prev => ({ ...prev, bookingType: 'order' }));
                        setShowBookingForm(true);
                      }}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-black text-base transition-colors shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
                    >
                      Proceed to Checkout
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Table booking card */}
            <div className="mt-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-5 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-black text-base">Reserve a Table</p>
                  <p className="text-blue-200 text-xs">Seats available now</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setBookingForm(prev => ({ ...prev, bookingType: 'table' }));
                  setShowBookingForm(true);
                }}
                className="w-full bg-white text-blue-600 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors"
              >
                Book a Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE Floating Cart Button ── */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden">
          <button
            onClick={() => {
              setBookingForm(prev => ({ ...prev, bookingType: 'order' }));
              setShowBookingForm(true);
            }}
            className="bg-orange-500 text-white px-6 py-3.5 rounded-2xl shadow-xl font-bold flex items-center gap-3"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>{cart.length} items</span>
            <span className="bg-white text-orange-500 px-3 py-0.5 rounded-lg font-black text-sm">
              ₹{calculateTotal().toFixed(0)}
            </span>
          </button>
        </div>
      )}

      {/* ── BOOKING / ORDER MODAL ── */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-2xl">
            {/* Modal Header */}
            <div className={`p-5 rounded-t-2xl flex items-center justify-between text-white ${bookingForm.bookingType === 'table' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-orange-500 to-amber-500'}`}>
              <h2 className="text-xl font-black flex items-center gap-2">
                {bookingForm.bookingType === 'table' ? (
                  <><Calendar className="h-5 w-5" /> Table Reservation</>
                ) : (
                  <><ShoppingCart className="h-5 w-5" /> Confirm Your Order</>
                )}
              </h2>
              <button onClick={() => setShowBookingForm(false)} className="hover:bg-white/20 rounded-full p-1.5 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Contact info */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                    <input type="text" value={bookingForm.fullName}
                      onChange={e => setBookingForm(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Your name"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                    <input type="email" value={bookingForm.email}
                      onChange={e => setBookingForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="tel" value={bookingForm.phone}
                        onChange={e => setBookingForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Table booking fields */}
              {bookingForm.bookingType === 'table' && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Reservation Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
                      <input type="date" value={bookingForm.date}
                        onChange={e => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Time Slot *</label>
                      <select value={bookingForm.timeSlot}
                        onChange={e => setBookingForm(prev => ({ ...prev, timeSlot: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all">
                        <option value="">Select Time</option>
                        {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">No. of Guests *</label>
                      <input type="number" value={bookingForm.numberOfGuests} min="1"
                        onChange={e => setBookingForm(prev => ({ ...prev, numberOfGuests: parseInt(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all" />
                    </div>
                  </div>
                </div>
              )}

              {/* Order fields */}
              {bookingForm.bookingType === 'order' && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Type *</label>
                      <select value={bookingForm.deliveryType}
                        onChange={e => setBookingForm(prev => ({ ...prev, deliveryType: e.target.value as any }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all">
                        <option value="dine-in">Dine In</option>
                        <option value="takeaway">Takeaway</option>
                        <option value="delivery">Home Delivery</option>
                      </select>
                    </div>
                    {bookingForm.deliveryType === 'dine-in' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Table Number *</label>
                        <input type="text" value={bookingForm.tableNumber}
                          onChange={e => setBookingForm(prev => ({ ...prev, tableNumber: e.target.value }))}
                          placeholder="e.g. T-04"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all" />
                      </div>
                    )}
                  </div>

                  {bookingForm.deliveryType === 'delivery' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Address *</label>
                        <textarea value={bookingForm.deliveryAddress}
                          onChange={e => setBookingForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                          rows={3}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Landmark</label>
                        <input type="text" value={bookingForm.landmark}
                          onChange={e => setBookingForm(prev => ({ ...prev, landmark: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all" />
                      </div>
                    </div>
                  )}

                  {/* Mini order summary */}
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <p className="text-sm font-bold text-gray-700 mb-2">Order Summary</p>
                    <div className="space-y-1">
                      {cart.map(item => (
                        <div key={item._id} className="flex justify-between text-sm text-gray-600">
                          <span>{item.name} ×{item.quantity}</span>
                          <span className="font-semibold">₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-orange-200 flex justify-between font-black text-gray-900">
                      <span>Total</span>
                      <span>₹{calculateTotal().toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment + coupon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!(bookingForm.bookingType === 'order' && bookingForm.deliveryType === 'dine-in') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Method *</label>
                    <select value={bookingForm.paymentMethod}
                      onChange={e => setBookingForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all">
                      <option value="card">Credit / Debit Card</option>
                      <option value="upi">UPI</option>
                      <option value="cash">Cash</option>
                      <option value="online">Online Payment</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Coupon Code</label>
                  <input type="text" value={bookingForm.couponCode}
                    onChange={e => setBookingForm(prev => ({ ...prev, couponCode: e.target.value }))}
                    placeholder="Enter coupon code"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all" />
                </div>
              </div>

              {bookingForm.bookingType === 'order' && bookingForm.deliveryType === 'dine-in' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                  <strong>Dine-in:</strong> Payment will be made at the restaurant after your meal.
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Special Requests</label>
                <textarea value={bookingForm.specialRequests}
                  onChange={e => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                  rows={2} placeholder="Any special requirements..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all" />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowBookingForm(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleBooking}
                className={`px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all shadow-lg ${bookingForm.bookingType === 'table' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                {bookingForm.bookingType === 'table' ? 'Reserve Table' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f9fafb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f97316; border-radius: 10px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Restaurant;
