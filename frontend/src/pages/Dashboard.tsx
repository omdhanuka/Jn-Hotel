import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Users, MapPin, Star, CreditCard, Utensils, Filter, BedDouble, Building, Search } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Booking {
  _id: string;
  type: 'room' | 'banquet' | 'table';
  resourceId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'cancelled' | 'failed';
  specialRequests?: string;
  services: string[];
  createdAt: string;
  bookingId?: string;
  tableNumber?: string;
  fullName?: string;
  phone?: string;
  deliveryType?: string;
  items?: any[];
  // Additional properties for combined bookings
  source?: string;
}

// Extended booking type for filtered results
type ExtendedBooking = Omit<Booking, 'type'> & {
  source: string;
  type: string; // Allow any string for restaurant orders
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [restaurantBookings, setRestaurantBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<ExtendedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    bookingType: 'all', // 'all', 'room', 'banquet', 'table', 'restaurant'
    status: 'all', // 'all', 'pending', 'confirmed', 'cancelled', 'completed'
    paymentStatus: 'all', // 'all', 'pending', 'paid', 'refunded', 'cancelled'
    dateRange: 'all', // 'all', 'today', 'week', 'month', 'custom'
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    if (user) {
      fetchAllBookings();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [bookings, restaurantBookings, filters]);

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      
      // Fetch room and banquet bookings
      const bookingsResponse = await axios.get('/api/bookings');
      const roomBanquetBookings = bookingsResponse.data.bookings || [];
      
      // Fetch restaurant bookings
      const restaurantResponse = await axios.get('/api/restaurant/bookings');
      const restBookings = restaurantResponse.data.bookings || [];
      
      setBookings(roomBanquetBookings);
      setRestaurantBookings(restBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to fetch bookings');
      setBookings([]);
      setRestaurantBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Combine all bookings with proper typing
    let allBookings: ExtendedBooking[] = [
      ...bookings.map(b => ({ ...b, source: 'hotel' } as ExtendedBooking)),
      ...restaurantBookings.map(b => ({ 
        ...b, 
        source: 'restaurant',
        type: b.deliveryType === 'dine-in' ? 'table' : 'restaurant'
      } as ExtendedBooking))
    ];

    // Apply booking type filter
    if (filters.bookingType !== 'all') {
      allBookings = allBookings.filter(booking => {
        if (filters.bookingType === 'restaurant') {
          return booking.source === 'restaurant' && booking.deliveryType !== 'dine-in';
        }
        return booking.type === filters.bookingType;
      });
    }

    // Apply status filter
    if (filters.status !== 'all') {
      allBookings = allBookings.filter(booking => booking.status === filters.status);
    }

    // Apply payment status filter
    if (filters.paymentStatus !== 'all') {
      allBookings = allBookings.filter(booking => booking.paymentStatus === filters.paymentStatus);
    }

    // Apply date filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = new Date();

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'custom':
          if (filters.startDate && filters.endDate) {
            startDate = new Date(filters.startDate);
            endDate = new Date(filters.endDate);
          } else {
            startDate = new Date(0);
          }
          break;
        default:
          startDate = new Date(0);
      }

      allBookings = allBookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= startDate && bookingDate <= endDate;
      });
    }

    setFilteredBookings(allBookings);
  };

  const resetFilters = () => {
    setFilters({
      bookingType: 'all',
      status: 'all',
      paymentStatus: 'all',
      dateRange: 'all',
      startDate: '',
      endDate: ''
    });
  };

  const getBookingTypeIcon = (type: string, source?: string) => {
    if (source === 'restaurant' && type === 'restaurant') {
      return <Utensils className="h-5 w-5" />;
    }
    switch (type) {
      case 'room':
        return <BedDouble className="h-5 w-5" />;
      case 'banquet':
        return <Building className="h-5 w-5" />;
      case 'table':
        return <Utensils className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  const getResourceTitle = (booking: ExtendedBooking) => {
    if (booking.source === 'restaurant') {
      if (booking.deliveryType === 'dine-in') {
        return `Table Reservation ${booking.tableNumber ? `- Table ${booking.tableNumber}` : ''}`;
      }
      return `Food Order - ${booking.deliveryType === 'delivery' ? 'Home Delivery' : 'Takeaway'}`;
    }
    
    switch (booking.type) {
      case 'room':
        return `Room Booking`;
      case 'banquet':
        return `Banquet Hall`;
      case 'table':
        return `Restaurant Table`;
      default:
        return 'Booking';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDatesDisplay = (booking: ExtendedBooking) => {
    if (booking.source === 'restaurant') {
      return formatDate(booking.createdAt);
    }
    if (booking.type === 'table') {
      return formatDate(booking.checkIn);
    }
    return `${formatDate(booking.checkIn)} to ${formatDate(booking.checkOut)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'bookings', label: 'All Bookings' },
    { id: 'profile', label: 'Profile' }
  ];

  const bookingTypeStats = {
    total: filteredBookings.length,
    room: filteredBookings.filter(b => b.type === 'room').length,
    banquet: filteredBookings.filter(b => b.type === 'banquet').length,
    table: filteredBookings.filter(b => b.type === 'table' || (b.source === 'restaurant' && b.deliveryType === 'dine-in')).length,
    restaurant: filteredBookings.filter(b => b.source === 'restaurant' && b.deliveryType !== 'dine-in').length
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600">Manage your bookings and account settings</p>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-600">Active Hotel Bookings</div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Utensils className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {restaurantBookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-600">Active Restaurant Orders</div>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    ₹{[...bookings, ...restaurantBookings]
                      .filter(b => b.paymentStatus === 'paid')
                      .reduce((sum, b) => sum + (b.totalAmount || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Spent</div>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {[...bookings, ...restaurantBookings].filter(b => b.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Completed Bookings</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                {/* Filters Section */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <Filter className="h-5 w-5 mr-2" />
                      Filter Bookings
                    </h3>
                    <button
                      onClick={resetFilters}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Reset Filters
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Booking Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Booking Type
                      </label>
                      <select
                        title="Booking Type"
                        value={filters.bookingType}
                        onChange={(e) => setFilters(prev => ({ ...prev, bookingType: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="all">All Types ({bookingTypeStats.total})</option>
                        <option value="room">Room Bookings ({bookingTypeStats.room})</option>
                        <option value="banquet">Banquet Halls ({bookingTypeStats.banquet})</option>
                        <option value="table">Table Reservations ({bookingTypeStats.table})</option>
                        <option value="restaurant">Food Orders ({bookingTypeStats.restaurant})</option>
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        title="Booking Status"
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Payment Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Status
                      </label>
                      <select
                        title="Payment Status"
                        value={filters.paymentStatus}
                        onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="all">All Payments</option>
                        <option value="pending">Payment Pending</option>
                        <option value="paid">Paid</option>
                        <option value="refunded">Refunded</option>
                        <option value="cancelled">Payment Cancelled</option>
                      </select>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Range
                      </label>
                      <select
                        title="Date Range"
                        value={filters.dateRange}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">This Month</option>
                        <option value="custom">Custom Range</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom Date Range */}
                  {filters.dateRange === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          title="Start Date"
                          placeholder="Start date"
                          value={filters.startDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          title="End Date"
                          placeholder="End date"
                          value={filters.endDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {/* Active Filters Summary */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {filters.bookingType !== 'all' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Type: {filters.bookingType}
                      </span>
                    )}
                    {filters.status !== 'all' && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Status: {filters.status}
                      </span>
                    )}
                    {filters.paymentStatus !== 'all' && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        Payment: {filters.paymentStatus}
                      </span>
                    )}
                    {filters.dateRange !== 'all' && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        Date: {filters.dateRange}
                      </span>
                    )}
                  </div>
                </div>

                {/* Results Summary */}
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    My Bookings ({filteredBookings.length})
                  </h2>
                  <div className="text-sm text-gray-600">
                    Showing {filteredBookings.length} of {[...bookings, ...restaurantBookings].length} total bookings
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {[...bookings, ...restaurantBookings].length === 0 
                        ? 'No bookings yet' 
                        : 'No bookings match your filters'
                      }
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {[...bookings, ...restaurantBookings].length === 0 
                        ? 'Start exploring our services!' 
                        : 'Try adjusting your filter criteria.'
                      }
                    </p>
                    <div className="flex justify-center space-x-4">
                      <Link
                        to="/rooms"
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                      >
                        Browse Rooms
                      </Link>
                      <Link
                        to="/banquets"
                        className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
                      >
                        Explore Banquets
                      </Link>
                      <Link
                        to="/restaurant"
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                      >
                        Visit Restaurant
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map((booking: ExtendedBooking) => (
                      <div key={`${booking.source}-${booking._id}`} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getBookingTypeIcon(booking.type, booking.source)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{getResourceTitle(booking)}</h3>
                              <div className="flex items-center text-gray-600 mt-1">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{getDatesDisplay(booking)}</span>
                              </div>
                              <div className="flex items-center text-gray-600 mt-1">
                                <Users className="h-4 w-4 mr-1" />
                                <span>{booking.guests} guests</span>
                              </div>
                              {booking.specialRequests && (
                                <div className="text-sm text-gray-500 mt-1">
                                  Special requests: {booking.specialRequests}
                                </div>
                              )}
                              {booking.source === 'restaurant' && booking.items && (
                                <div className="text-sm text-gray-500 mt-1">
                                  {booking.items.length} items ordered
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">₹{booking.totalAmount}</div>
                            <div className="space-y-1 mt-2">
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                                {booking.status}
                              </span>
                              <br />
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                                {booking.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <Link
                            to={booking.source === 'restaurant' 
                              ? `/restaurant-order/${booking._id}` 
                              : `/booking/${booking._id}`
                            }
                            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                          >
                            View Details
                          </Link>
                          {booking.paymentStatus === 'paid' && (
                            <Link
                              to={`/receipt/${booking._id}`}
                              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
                            >
                              Download Receipt
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      title="First Name"
                      placeholder="First name"
                      defaultValue={user?.firstName}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      title="Last Name"
                      placeholder="Last name"
                      defaultValue={user?.lastName}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      title="Email"
                      placeholder="Email address"
                      defaultValue={user?.email}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      title="Phone"
                      placeholder="Phone number"
                      defaultValue={(user as any)?.phone || ''}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                    Update Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
