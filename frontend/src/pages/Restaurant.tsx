import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Utensils, Users, Clock, MapPin, Star, Plus, Minus, 
  ShoppingCart, Calendar, Phone, Mail, Search, Filter 
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
  discount?: number;
  isAvailable: boolean;
  preparationTime?: string;
  images: string[];
  spiceLevels: string[];
  addOns: { name: string; price: number }[];
  isFeatured: boolean;
  calories?: number;
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
  tableNumber: string; // Added for dine-in orders
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    bookingType: 'order',
    fullName: '',
    email: '',
    phone: '',
    tableId: '',
    tableNumber: '', // Added table number field
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
    'all', 'North Indian', 'South Indian', 'Chinese', 'Continental', 
    'Italian', 'Beverages', 'Desserts', 'Starters', 'Main Course'
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
  }, [user]);

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
    toast.success(`${item.name} added to cart`);
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item._id !== itemId));
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

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const addOnsTotal = item.selectedAddOns.reduce((sum, addon) => sum + addon.price, 0) * item.quantity;
      return total + itemTotal + addOnsTotal;
    }, 0);
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.isAvailable;
  });

  const handleBooking = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    // Validation for dine-in orders
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
      toast.success(`${bookingForm.bookingType === 'table' ? 'Table reserved' : 'Order placed'} successfully!`);
      setCart([]);
      setShowBookingForm(false);
      navigate('/dashboard', { state: { newOrder: response.data } });
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${bookingForm.bookingType === 'table' ? 'reserve table' : 'place order'}`);
    }
  };

  const getDishTypeIcon = (type: string) => {
    const colors = {
      'veg': 'text-green-600',
      'non-veg': 'text-red-600',
      'vegan': 'text-blue-600'
    };
    return (
      <div className={`w-3 h-3 border-2 ${colors[type as keyof typeof colors]} rounded-sm flex items-center justify-center`}>
        <div className={`w-1.5 h-1.5 ${colors[type as keyof typeof colors].replace('text-', 'bg-')} rounded-full`}></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Restaurant</h1>
          <p className="text-xl text-gray-600">Delicious food and comfortable dining experience</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-6 py-2 rounded-md font-medium transition ${
                activeTab === 'menu' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Menu & Orders
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`px-6 py-2 rounded-md font-medium transition ${
                activeTab === 'tables' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Table Booking
            </button>
          </div>
        </div>

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Menu Items */}
            <div className="lg:col-span-3">
              {/* Search and Filters */}
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search menu items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredMenuItems.map((item) => (
                  <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="h-48 bg-gray-200">
                      <img
                        src={item.images?.[0] || '/api/placeholder/300/200'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold">{item.name}</h3>
                        {getDishTypeIcon(item.dishType)}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold text-green-600">
                          ₹{item.discount ? (item.price - (item.price * item.discount / 100)).toFixed(2) : item.price}
                          {item.discount && (
                            <span className="text-sm text-gray-500 line-through ml-2">₹{item.price}</span>
                          )}
                        </span>
                        <span className="text-sm text-gray-500">{item.category}</span>
                      </div>
                      {item.preparationTime && (
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Clock className="h-4 w-4 mr-1" />
                          {item.preparationTime}
                        </div>
                      )}
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center justify-center"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Cart</h3>
                  <ShoppingCart className="h-5 w-5 text-gray-600" />
                </div>
                
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Your cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {cart.map((item) => (
                        <div key={item._id} className="border-b pb-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <button
                              onClick={() => removeFromCart(item._id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-3 mb-4">
                      <div className="flex justify-between font-bold">
                        <span>Total: ₹{calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setBookingForm(prev => ({ ...prev, bookingType: 'order' }));
                        setShowBookingForm(true);
                      }}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
                    >
                      Place Order
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Reserve a Table</h2>
              <p className="text-gray-600">Choose from our available tables for your dining experience</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.filter(table => table.isAvailable && table.status === 'available').map((table) => (
                <div key={table._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">{table.tableName}</h3>
                    <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded-full">
                      Available
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm">Up to {table.seatingCapacity} guests</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm capitalize">{table.tableType}</span>
                    </div>
                    {table.location && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500">{table.location}</span>
                      </div>
                    )}
                  </div>
                  
                  {table.price && table.price > 0 && (
                    <div className="mb-4">
                      <span className="text-lg font-bold text-green-600">₹{table.price}</span>
                      <span className="text-sm text-gray-500 ml-1">reservation fee</span>
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
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                  >
                    Reserve Table
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking Form Modal */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {bookingForm.bookingType === 'table' ? 'Table Reservation' : 'Place Order'}
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Customer Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={bookingForm.fullName}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, fullName: e.target.value }))
                      }
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone *</label>
                    <input
                      type="tel"
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                {/* Table Booking Fields */}
                {bookingForm.bookingType === 'table' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Date *</label>
                      <input
                        type="date"
                        value={bookingForm.date}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))
                        }
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full border rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Time Slot *</label>
                      <select
                        value={bookingForm.timeSlot}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, timeSlot: e.target.value }))
                        }
                        className="w-full border rounded-md px-3 py-2"
                      >
                        <option value="">Select Time</option>
                        {timeSlots.map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Number of Guests *</label>
                      <input
                        type="number"
                        value={bookingForm.numberOfGuests}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, numberOfGuests: parseInt(e.target.value) }))
                        }
                        min="1"
                        className="w-full border rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                )}

                {/* Order Fields */}
                {bookingForm.bookingType === 'order' && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Delivery Type *</label>
                        <select
                          value={bookingForm.deliveryType}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, deliveryType: e.target.value as any }))
                          }
                          className="w-full border rounded-md px-3 py-2"
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
                            className="w-full border rounded-md px-3 py-2"
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
                            onChange={(e) => setBookingForm(prev => ({ ...prev, deliveryAddress: e.target.value }))
                            }
                            rows={3}
                            className="w-full border rounded-md px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Landmark</label>
                          <input
                            type="text"
                            value={bookingForm.landmark}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, landmark: e.target.value }))
                            }
                            className="w-full border rounded-md px-3 py-2"
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
                        className="w-full border rounded-md px-3 py-2"
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
                      className="w-full border rounded-md px-3 py-2"
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
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="p-6 border-t flex justify-end space-x-4">
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBooking}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {bookingForm.bookingType === 'table' ? 'Reserve Table' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Restaurant;
