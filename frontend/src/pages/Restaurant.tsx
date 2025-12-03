import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Utensils, Users, Clock, MapPin, Star, Plus, Minus, 
  ShoppingCart, Calendar, Phone, Mail, Search, Filter, X,
  Tag, Zap, TrendingUp, Award, Sparkles, Check
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
      const response = await axios.get('/api/restaurant/menu?limit=100');
      setMenuItems(response.data.menuItems || []);
    } catch (error) {
      toast.error('Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get('/api/restaurant/tables');
      setTables(response.data.tables || []);
    } catch (error) {
      toast.error('Failed to fetch tables');
    }
  };

  const fetchTodaySpecials = async () => {
    try {
      // Use the public endpoint for today's specials
      const response = await axios.get('/api/manager/restaurant/specials/today/public');
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

      const response = await axios.post('/api/restaurant/bookings', bookingData);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Premium Header */}
      <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-3 rounded-xl shadow-lg">
                  <Utensils className="h-8 w-8 text-blue-900" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">JN Palace Restaurant</h1>
                  <p className="text-blue-200 text-sm mt-1">Staff Management Portal</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center bg-white bg-opacity-10 backdrop-blur-md px-4 py-2 rounded-lg">
                <Award className="h-5 w-5 mr-2 text-yellow-400" />
                <span>Premium Service</span>
              </div>
              <div className="flex items-center bg-white bg-opacity-10 backdrop-blur-md px-4 py-2 rounded-lg">
                <Clock className="h-5 w-5 mr-2 text-green-400" />
                <span>11 AM - 11 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Today's Special Section - Premium Design */}
        {todaySpecials.length > 0 && todaySpecials[0] && (todaySpecials[0].stockQuantity ?? 0) > 0 && (
          <div className="mb-12">
            <div className="relative bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-3xl shadow-2xl overflow-hidden">
              {/* Ribbon */}
              <div className="absolute top-6 -left-12 bg-red-600 text-white px-16 py-2 transform -rotate-45 shadow-lg z-10">
                <span className="text-sm font-bold">LIMITED TIME OFFER</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                {/* Left: Food Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-300">
                  <div className="relative h-80 bg-gradient-to-br from-gray-200 to-gray-300">
                    {todaySpecials[0].images?.[0] ? (
                      <img
                        src={todaySpecials[0].images[0]}
                        alt={todaySpecials[0].name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils className="h-32 w-32 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    {/* Badge */}
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-black text-sm shadow-lg flex items-center">
                      <Sparkles className="h-4 w-4 mr-1 animate-pulse" />
                      TODAY'S SPECIAL
                    </div>

                    {/* Stock */}
                    <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                      Only {todaySpecials[0].stockQuantity} left!
                    </div>

                    {/* Dish Type */}
                    <div className="absolute bottom-4 left-4">
                      {getDishTypeIcon(todaySpecials[0].dishType)}
                    </div>

                    {/* Category */}
                    <div className="absolute bottom-4 right-4">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        {todaySpecials[0].category}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{todaySpecials[0].name}</h3>
                    
                    {/* Rating */}
                    <div className="flex items-center mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                      <span className="ml-2 text-gray-600 font-medium">(4.8/5)</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="text-4xl font-black text-green-600">₹{todaySpecials[0].price}</span>
                      {todaySpecials[0].originalPrice && (
                        <>
                          <span className="text-2xl text-gray-400 line-through">₹{todaySpecials[0].originalPrice}</span>
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-black">
                            {Math.round(((todaySpecials[0].originalPrice - todaySpecials[0].price) / todaySpecials[0].originalPrice) * 100)}% OFF
                          </span>
                        </>
                      )}
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => addToCart(todaySpecials[0])}
                      disabled={(todaySpecials[0].stockQuantity ?? 0) === 0}
                      className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-xl flex items-center justify-center transition-all duration-300 ${
                        (todaySpecials[0].stockQuantity ?? 0) === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transform hover:scale-105'
                      }`}
                    >
                      {(todaySpecials[0].stockQuantity ?? 0) === 0 ? (
                        <>
                          <X className="h-6 w-6 mr-2" />
                          Sold Out
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-6 w-6 mr-2" />
                          Add to Cart - Special Price!
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right: Description */}
                <div className="flex flex-col justify-center text-white p-8">
                  <div className="mb-6">
                    <Sparkles className="h-12 w-12 text-yellow-300 mb-4 animate-pulse" />
                    <h2 className="text-5xl font-black mb-4 leading-tight">
                      Chef's Special<br />of the Day
                    </h2>
                    <div className="w-24 h-1 bg-white rounded-full mb-6"></div>
                  </div>

                  <p className="text-2xl leading-relaxed mb-6 text-white/90">
                    {todaySpecials[0].description}
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center bg-white bg-opacity-20 backdrop-blur-md rounded-xl p-4">
                      <Clock className="h-6 w-6 mr-3 text-yellow-300" />
                      <div>
                        <p className="text-sm font-medium text-white/80">Preparation Time</p>
                        <p className="text-lg font-bold">{todaySpecials[0].preparationTime || '20-25 mins'}</p>
                      </div>
                    </div>

                    {todaySpecials[0].calories && (
                      <div className="flex items-center bg-white bg-opacity-20 backdrop-blur-md rounded-xl p-4">
                        <Zap className="h-6 w-6 mr-3 text-yellow-300" />
                        <div>
                          <p className="text-sm font-medium text-white/80">Calories</p>
                          <p className="text-lg font-bold">{todaySpecials[0].calories} kcal</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-xl p-6 border-2 border-white/30">
                    <p className="text-xl font-bold text-center">
                      🎉 Exclusive today! Don't miss this amazing deal! 🎉
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Tab Navigation */}
        <div className="flex justify-center mb-10">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-blue-100">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2 ${
                activeTab === 'menu' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Utensils className="h-5 w-5" />
              <span>Menu & Orders</span>
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2 ${
                activeTab === 'tables' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-105' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users className="h-5 w-5" />
              <span>Table Booking</span>
            </button>
          </div>
        </div>

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Menu Items - 8 columns */}
            <div className="lg:col-span-8 space-y-6">
              {/* Premium Search and Filters */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-blue-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Tag className="h-6 w-6 mr-2 text-blue-600" />
                  Browse Our Menu
                </h3>
                
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search delicious dishes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category Filter */}
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="appearance-none w-full bg-white border-2 border-gray-200 rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-all cursor-pointer text-gray-900"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category === 'all' ? '📂 All Categories' : category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dish Type Filter */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setDishTypeFilter('all')}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                          dishTypeFilter === 'all'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setDishTypeFilter('veg')}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                          dishTypeFilter === 'veg'
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        🟢 Veg
                      </button>
                      <button
                        onClick={() => setDishTypeFilter('non-veg')}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                          dishTypeFilter === 'non-veg'
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        🔴 Non-Veg
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items Masonry Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white/80 rounded-2xl shadow-lg overflow-hidden animate-pulse">
                      <div className="h-56 bg-gray-300"></div>
                      <div className="p-5 space-y-3">
                        <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredMenuItems.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-16 text-center border border-blue-100">
                  <div className="bg-blue-100 rounded-full p-8 inline-block mb-6">
                    <Search className="h-20 w-20 text-blue-600" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">No items found</h3>
                  <p className="text-gray-600 text-lg">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredMenuItems.map((item) => (
                    <div 
                      key={item._id} 
                      className="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transform hover:-translate-y-2 transition-all duration-300 border border-blue-50"
                    >
                      {/* Image */}
                      <div className="relative h-56 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Utensils className="h-24 w-24 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3">
                          {getDishTypeIcon(item.dishType)}
                        </div>

                        {item.isFeatured && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-blue-900 px-3 py-1 rounded-full font-bold text-xs flex items-center shadow-lg">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Popular
                          </div>
                        )}

                        {/* Category Badge */}
                        <div className="absolute bottom-3 left-3">
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{item.name}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
                        
                        {/* Details Row */}
                        <div className="flex items-center justify-between mb-4">
                          {item.preparationTime && (
                            <div className="flex items-center text-gray-600 text-sm">
                              <Clock className="h-4 w-4 mr-1 text-blue-600" />
                              <span className="font-medium">{item.preparationTime}</span>
                            </div>
                          )}
                          {item.calories && (
                            <span className="text-sm text-gray-500 font-medium">{item.calories} cal</span>
                          )}
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline justify-between mb-4">
                          <div className="text-3xl font-black text-green-600">
                            ₹{item.price}
                          </div>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-sm text-gray-400 line-through">₹{item.originalPrice}</span>
                          )}
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          onClick={() => addToCart(item)}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Premium Cart Sidebar - 4 columns - Sticky */}
            <div className="lg:col-span-4">
              <div className="sticky top-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
                  {/* Cart Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">Your Cart</h3>
                        <p className="text-sm text-blue-100">{cart.length} items selected</p>
                      </div>
                      <div className="relative">
                        <ShoppingCart className="h-10 w-10" />
                        {cart.length > 0 && (
                          <span className="absolute -top-2 -right-2 bg-yellow-400 text-blue-900 text-xs font-black rounded-full h-7 w-7 flex items-center justify-center shadow-lg">
                            {cart.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {cart.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full p-8 inline-block mb-6">
                          <ShoppingCart className="h-16 w-16 text-blue-600" />
                        </div>
                        <p className="text-gray-600 font-bold text-lg mb-2">Your cart is empty</p>
                        <p className="text-sm text-gray-500">Add delicious items to get started</p>
                      </div>
                    ) : (
                      <>
                        {/* Cart Items */}
                        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                          {cart.map((item) => (
                            <div key={item._id} className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-blue-100 rounded-xl p-4 hover:border-blue-300 transition-all">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 leading-tight mb-1">{item.name}</h4>
                                  <span className="text-xs text-gray-500">{item.category}</span>
                                </div>
                                <button
                                  onClick={() => removeFromCart(item._id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1.5 transition-all ml-2"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                              
                              {/* Quantity Controls */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 bg-white rounded-lg p-1.5 shadow-inner">
                                  <button
                                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                    className="w-8 h-8 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg flex items-center justify-center hover:from-red-600 hover:to-rose-700 transition-all shadow-md"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="text-lg font-bold w-8 text-center">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                    className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                                <span className="font-black text-xl text-green-600">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Billing Summary */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 mb-6 shadow-inner">
                          <h4 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                            Billing Summary
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between text-gray-700">
                              <span>Subtotal</span>
                              <span className="font-bold">₹{calculateSubtotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                              <span>Tax (5%)</span>
                              <span className="font-bold">₹{calculateTax().toFixed(2)}</span>
                            </div>
                            <div className="border-t-2 border-blue-300 pt-3 mt-3">
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                <span className="text-3xl font-black text-green-600">
                                  ₹{calculateTotal().toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Place Order Button */}
                        <button
                          onClick={() => {
                            setBookingForm(prev => ({ ...prev, bookingType: 'order' }));
                            setShowBookingForm(true);
                          }}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-5 px-6 rounded-2xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 flex items-center justify-center"
                        >
                          <Check className="h-6 w-6 mr-2" />
                          Place Order Now
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tables Tab - Premium Design */}
        {activeTab === 'tables' && (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Reserve Your Table</h2>
              <p className="text-xl text-gray-600">Choose from our comfortable seating arrangements</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tables.filter(table => table.isAvailable && table.status === 'available').map((table) => (
                <div key={table._id} className="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transform hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-blue-300">
                  {/* Table Header */}
                  <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -mr-16 -mt-16 opacity-50"></div>
                    <div className="relative">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-bold text-gray-900">{table.tableName}</h3>
                        <span className="bg-green-500 text-white px-3 py-1 text-sm rounded-full font-bold shadow-lg flex items-center">
                          <Check className="h-4 w-4 mr-1" />
                          Available
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Table Details */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center">
                        <div className="bg-blue-600 rounded-lg p-2 mr-3">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-gray-700 font-bold">Capacity</span>
                      </div>
                      <span className="font-black text-xl text-gray-900">{table.seatingCapacity} guests</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                      <div className="flex items-center">
                        <div className="bg-purple-600 rounded-lg p-2 mr-3">
                          <MapPin className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-gray-700 font-bold">Type</span>
                      </div>
                      <span className="font-black text-gray-900 capitalize">{table.tableType}</span>
                    </div>

                    {table.location && (
                      <div className="flex items-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-orange-200">
                        <MapPin className="h-5 w-5 text-orange-600 mr-2" />
                        <span className="text-gray-700 font-bold">{table.location}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Price & Action */}
                  <div className="p-6 pt-0">
                    {table.price && table.price > 0 && (
                      <div className="mb-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                        <div className="flex items-baseline justify-center">
                          <span className="text-4xl font-black text-green-600">₹{table.price}</span>
                          <span className="text-sm text-gray-600 ml-2 font-medium">reservation fee</span>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        setBookingForm(prev => ({ 
                          ...prev, 
                          bookingType: 'table',
                          tableId: table._id 
                        }));
                        setShowBookingForm(true);
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      Reserve Table
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {tables.filter(table => table.isAvailable && table.status === 'available').length === 0 && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-16 text-center border border-blue-100">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full p-8 inline-block mb-6">
                  <Users className="h-20 w-20 text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-3">No tables available</h3>
                <p className="text-gray-600 text-lg">Please check back later or contact us for assistance</p>
              </div>
            )}
          </div>
        )}

        {/* Booking Form Modal */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full my-8 shadow-2xl transform animate-in fade-in zoom-in duration-300">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-3xl">
                <div className="flex items-center justify-between text-white">
                  <h2 className="text-2xl font-bold flex items-center">
                    {bookingForm.bookingType === 'table' ? (
                      <>
                        <Calendar className="h-6 w-6 mr-3" />
                        Table Reservation
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-6 w-6 mr-3" />
                        Place Your Order
                      </>
                    )}
                  </h2>
                  <button
                    onClick={() => setShowBookingForm(false)}
                    className="hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Customer Details Section */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <div className="bg-blue-100 rounded-lg p-2 mr-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={bookingForm.fullName}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, fullName: e.target.value }))
                        }
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        value={bookingForm.email}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="tel"
                          value={bookingForm.phone}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Booking Fields */}
                {bookingForm.bookingType === 'table' && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <div className="bg-indigo-100 rounded-lg p-2 mr-3">
                        <Calendar className="h-5 w-5 text-indigo-600" />
                      </div>
                      Reservation Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Date *</label>
                        <input
                          type="date"
                          value={bookingForm.date}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))
                          }
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Time Slot *</label>
                        <select
                          value={bookingForm.timeSlot}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, timeSlot: e.target.value }))
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="">Select Time</option>
                          {timeSlots.map(slot => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Number of Guests *</label>
                        <input
                          type="number"
                          value={bookingForm.numberOfGuests}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, numberOfGuests: parseInt(e.target.value) }))
                          }
                          min="1"
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Fields */}
                {bookingForm.bookingType === 'order' && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <div className="bg-green-100 rounded-lg p-2 mr-3">
                        <ShoppingCart className="h-5 w-5 text-green-600" />
                      </div>
                      Order Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Delivery Type *</label>
                        <select
                          value={bookingForm.deliveryType}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, deliveryType: e.target.value as any }))
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="dine-in">Dine In</option>
                          <option value="takeaway">Takeaway</option>
                          <option value="delivery">Home Delivery</option>
                        </select>
                      </div>
                      
                      {/* Table Number for Dine-in */}
                      {bookingForm.deliveryType === 'dine-in' && (
                        <div>
                          <label className="block text-sm font-medium mb-1">Table Number *</label>
                          <input
                            type="text"
                            value={bookingForm.tableNumber}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, tableNumber: e.target.value }))
                            }
                            placeholder="Enter table number"
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Please enter the table number where you're seated
                          </p>
                        </div>
                      )}
                    </div>

                    {bookingForm.deliveryType === 'delivery' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Delivery Address *</label>
                          <textarea
                            value={bookingForm.deliveryAddress}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                            rows={3}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Landmark</label>
                          <input
                            type="text"
                            value={bookingForm.landmark}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, landmark: e.target.value }))}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    )}

                    {/* Order Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium mb-2">Order Summary</h4>
                      {bookingForm.deliveryType === 'dine-in' && bookingForm.tableNumber && (
                        <div className="mb-2 pb-2 border-b border-gray-200">
                          <span className="text-sm text-blue-600 font-medium">
                            Table: {bookingForm.tableNumber}
                          </span>
                        </div>
                      )}
                      {cart.map(item => (
                        <div key={item._id} className="flex justify-between text-sm">
                          <span>{item.name} x {item.quantity}</span>
                          <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t mt-2 pt-2 font-bold">
                        <div className="flex justify-between">
                          <span>Total</span>
                          <span>₹{calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Common Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Only show payment method if not dine-in */}
                  {!(bookingForm.bookingType === 'order' && bookingForm.deliveryType === 'dine-in') && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Payment Method *</label>
                      <select
                        value={bookingForm.paymentMethod}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, paymentMethod: e.target.value }))
                        }
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="card">Credit/Debit Card</option>
                        <option value="upi">UPI</option>
                        <option value="cash">Cash on Delivery</option>
                        <option value="online">Online Payment</option>
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Coupon Code</label>
                    <input
                      type="text"
                      value={bookingForm.couponCode}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, couponCode: e.target.value }))
                      }
                      placeholder="Enter coupon code"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Show payment note for dine-in orders */}
                {bookingForm.bookingType === 'order' && bookingForm.deliveryType === 'dine-in' && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-800">
                          <strong>Dine-in Order:</strong> Payment will be made at the restaurant after your meal. 
                          Please proceed to table {bookingForm.tableNumber} with this order confirmation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Special Requests</label>
                  <textarea
                    value={bookingForm.specialRequests}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))
                    }
                    rows={3}
                    placeholder="Any special requirements..."
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="p-6 border-t-2 border-gray-100 flex justify-end space-x-4">
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold text-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBooking}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {bookingForm.bookingType === 'table' ? 'Reserve Table' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #6366f1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #4f46e5);
        }
      `}</style>
    </div>
  );
};

export default Restaurant;
