import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Users, MapPin, Star, CreditCard, Utensils, Filter, BedDouble, Building, Search, MessageSquare, AlertCircle, Crown, User, Phone, Mail, CheckCircle, ArrowRight, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import FeedbackModal from '../components/FeedbackModal';
import ComplaintModal from '../components/ComplaintModal';

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
  resource?: {
    _id: string;
    roomNumber?: string;
    roomName?: string;
    name?: string;
    type?: string;
    images?: string[];
  };
}

// Extended booking type for filtered results
type ExtendedBooking = Omit<Booking, 'type'> & {
  source: string;
  type: string; // Allow any string for restaurant orders
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [restaurantBookings, setRestaurantBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<ExtendedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedBookingForFeedback, setSelectedBookingForFeedback] = useState<ExtendedBooking | null>(null);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [selectedBookingForComplaint, setSelectedBookingForComplaint] = useState<ExtendedBooking | null>(null);
  const [loyaltyPoints] = useState(2500);
  
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
      const bookingsResponse = await axios.get('/bookings');
      const roomBanquetBookings = bookingsResponse.data.bookings || [];
      
      // Fetch restaurant bookings
      const restaurantResponse = await axios.get('/restaurant/bookings');
      const restBookings = restaurantResponse.data.bookings || [];
      
      // Fetch resource details for each booking
      const token = localStorage.getItem('token');
      const bookingsWithResources = await Promise.all(
        roomBanquetBookings.map(async (booking: Booking) => {
          try {
            let resourceEndpoint = '';
            if (booking.type === 'room') {
              resourceEndpoint = `http://localhost:5000/api/rooms/${booking.resourceId}`;
            } else if (booking.type === 'banquet') {
              resourceEndpoint = `http://localhost:5000/api/banquets/${booking.resourceId}`;
            } else if (booking.type === 'table') {
              resourceEndpoint = `http://localhost:5000/api/restaurant/tables/${booking.resourceId}`;
            }
            
            if (resourceEndpoint) {
              const resourceResponse = await axios.get(resourceEndpoint, {
                headers: { Authorization: `Bearer ${token}` }
              });
              return { ...booking, resource: resourceResponse.data };
            }
          } catch (error: any) {
            console.error('Error fetching resource:', error);
            console.log('Resource fetch error details:', {
              bookingId: booking._id,
              resourceId: booking.resourceId,
              type: booking.type,
              status: error.response?.status
            });
          }
          return booking;
        })
      );
      
      setBookings(bookingsWithResources);
      setRestaurantBookings(restBookings);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      console.log('Bookings fetch error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        endpoint: error.config?.url
      });
      
      if (error.response?.status === 400) {
        toast.error(`Bad request: ${error.response?.data?.message || 'Invalid parameters'}`);
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to view bookings');
      } else {
        toast.error('Failed to fetch bookings');
      }
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

  const handleOpenFeedback = (booking: ExtendedBooking) => {
    setSelectedBookingForFeedback(booking);
    setShowFeedbackModal(true);
  };

  const handleFeedbackSuccess = () => {
    setShowFeedbackModal(false);
    setSelectedBookingForFeedback(null);
    fetchAllBookings(); // Refresh bookings
  };

  const handleOpenComplaint = (booking: ExtendedBooking) => {
    setSelectedBookingForComplaint(booking);
    setShowComplaintModal(true);
  };

  const handleComplaintSuccess = () => {
    setShowComplaintModal(false);
    setSelectedBookingForComplaint(null);
  };

  // Check if booking is in active period (between check-in and check-out)
  const isBookingActive = (booking: ExtendedBooking) => {
    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    return now >= checkInDate && now <= checkOutDate && booking.status === 'confirmed';
  };

  const upcomingBookings = filteredBookings.filter(b => 
    b.status === 'confirmed' || b.status === 'pending'
  ).slice(0, 3);

  const pastBookings = filteredBookings.filter(b => 
    b.status === 'completed'
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white">
      {/* Hero Section */}
      <div 
        className="relative h-[500px] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=80')`,
        }}
      >
        <div className="text-center text-white z-10 px-4">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4 tracking-wide">
            BOOK YOUR STAY
          </h1>
          <p className="text-2xl md:text-3xl font-serif italic text-amber-200 mb-8">
            Experience Royal Luxury
          </p>
          <button
            onClick={() => navigate('/rooms')}
            className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-10 py-4 rounded-lg hover:from-amber-600 hover:to-yellow-700 transition-all shadow-xl hover:shadow-2xl text-lg font-semibold uppercase tracking-wider"
          >
            CHECK AVAILABILITY <ArrowRight className="inline h-5 w-5 ml-2" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        {/* Welcome Card with Profile */}
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-8 py-6 border-b-2 border-amber-200">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg">
                <User className="h-12 w-12 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-serif font-bold text-gray-900 mb-2">
                  Welcome, {user?.firstName} {user?.lastName}!
                </h2>
                <p className="text-lg text-gray-700">Welcome to your account dashboard.</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Loyalty Points Card */}
              <div className="bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-100 rounded-xl p-6 border-2 border-amber-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-200/30 rounded-full -ml-12 -mb-12"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-serif font-bold text-gray-900 uppercase tracking-wide">
                      WELCOME BACK, {user?.firstName?.toUpperCase()}!
                    </h3>
                    <Crown className="h-10 w-10 text-amber-600" />
                  </div>
                  
                  <div className="text-center my-6">
                    <div className="text-6xl font-bold text-amber-600 mb-2">
                      {loyaltyPoints.toLocaleString()}
                    </div>
                    <div className="text-lg font-semibold text-gray-700 uppercase tracking-wider">
                      POINTS
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 text-center mb-4">
                    Reach 5,000 points to unlock a free night stay.
                  </p>
                  
                  <button 
                    onClick={() => navigate('/special-offers')}
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-3 rounded-lg hover:from-amber-600 hover:to-yellow-700 transition-all shadow-md font-semibold uppercase tracking-wide"
                  >
                    VIEW OFFERS <ArrowRight className="inline h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>

              {/* Upcoming Booking Preview */}
              <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-xl p-6 border-2 border-amber-200">
                <h3 className="text-xl font-serif font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  Upcoming Booking
                </h3>
                
                {upcomingBookings.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingBookings.slice(0, 1).map((booking) => {
                      const roomBooking = bookings.find(b => b._id === booking._id);
                      return (
                        <div key={booking._id} className="flex space-x-4">
                          <img
                            src={
                              roomBooking?.resource?.images?.[0]
                                ? (roomBooking.resource.images[0].startsWith('http') 
                                    ? roomBooking.resource.images[0] 
                                    : `http://localhost:5000${roomBooking.resource.images[0]}`)
                                : 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&q=80'
                            }
                            alt="Room"
                            className="w-32 h-24 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Calendar className="h-4 w-4 text-amber-600" />
                              <span className="text-sm font-medium text-gray-700">
                                {new Date(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Calendar className="h-4 w-4 text-amber-600" />
                              <span className="text-sm font-medium text-gray-700">
                                {new Date(booking.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-900">
                              {booking.type === 'room' 
                                ? (roomBooking?.resource?.roomName || `Room ${roomBooking?.resource?.roomNumber}` || 'Premier Room')
                                : getResourceTitle(booking)}
                            </h4>
                            <p className="text-xs text-gray-600 uppercase tracking-wide">
                              UPC# {booking._id.substring(0, 6)} • APP BOOKING
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => navigate('/upcoming-bookings')}
                      className="w-full bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 transition-colors font-semibold uppercase tracking-wide text-sm"
                    >
                      VIEW DETAILS
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No upcoming bookings</p>
                    <button
                      onClick={() => navigate('/rooms')}
                      className="bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors font-semibold uppercase tracking-wide text-sm"
                    >
                      BOOK NOW
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Upcoming Bookings Card */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-amber-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Calendar className="h-8 w-8 text-amber-600 mb-2" />
                <h3 className="text-lg font-serif font-bold text-gray-900 uppercase tracking-wide">
                  Upcoming Bookings
                </h3>
              </div>
            </div>
            <div className="mb-4">
              <div className="text-5xl font-bold text-amber-600 mb-1">
                {upcomingBookings.length}
              </div>
              <p className="text-sm text-gray-600">
                View or modify your upcoming bookings
              </p>
            </div>
            <button
              onClick={() => navigate('/upcoming-bookings')}
              className="w-full bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 transition-colors font-semibold uppercase tracking-wide text-sm"
            >
              VIEW ALL <ArrowRight className="inline h-4 w-4 ml-1" />
            </button>
          </div>

          {/* Past Bookings Card */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-amber-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="text-lg font-serif font-bold text-gray-900 uppercase tracking-wide">
                  Past Bookings
                </h3>
              </div>
            </div>
            <div className="mb-4">
              <div className="text-5xl font-bold text-green-600 mb-1">
                {pastBookings.length}
              </div>
              <p className="text-sm text-gray-600">
                Review your past stays and invoices
              </p>
            </div>
            <button
              onClick={() => navigate('/booking-history')}
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors font-semibold uppercase tracking-wide text-sm"
            >
              VIEW HISTORY <ArrowRight className="inline h-4 w-4 ml-1" />
            </button>
          </div>

          {/* Account Settings Card */}
          <div className="bg-white rounded-xl shadow-lg border-2 border-amber-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <User className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="text-lg font-serif font-bold text-gray-900 uppercase tracking-wide">
                  Account Settings
                </h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Update your profile and preferences
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <Mail className="h-4 w-4 mr-2 text-amber-600" />
                  {user?.email}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/account-settings')}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors font-semibold uppercase tracking-wide text-sm"
            >
              MANAGE ACCOUNT <ArrowRight className="inline h-4 w-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Exclusive Offers Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-serif font-bold text-center text-gray-900 mb-8 uppercase tracking-wide">
            Exclusive Offers for You
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Romantic Getaway */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-amber-100 overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
                  alt="Romantic Getaway"
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-4 left-4 bg-amber-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                  15% OFF
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3">
                  Romantic Getaway
                </h3>
                <p className="text-gray-700 mb-4">
                  Enjoy a memorable stay with romantic perks.
                </p>
                <button className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-3 rounded-lg hover:from-amber-600 hover:to-yellow-700 transition-all shadow-md font-semibold uppercase tracking-wide">
                  VIEW OFFER <ArrowRight className="inline h-4 w-4 ml-1" />
                </button>
              </div>
            </div>

            {/* Spa & Wellness */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-amber-100 overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80"
                  alt="Spa & Wellness"
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-4 left-4 bg-amber-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                  15% OFF
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-3">
                  Spa & Wellness Package
                </h3>
                <p className="text-gray-700 mb-4">
                  Relax with a special spa and wellness package.
                </p>
                <button className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-3 rounded-lg hover:from-amber-600 hover:to-yellow-700 transition-all shadow-md font-semibold uppercase tracking-wide">
                  VIEW OFFER <ArrowRight className="inline h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-amber-100">
          <div className="border-b-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <nav className="-mb-px flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-5 px-8 border-b-4 font-semibold text-sm uppercase tracking-wider transition-all ${
                    activeTab === tab.id
                      ? 'border-amber-500 text-amber-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-amber-600 hover:border-amber-300'
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
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl mb-6 border-2 border-amber-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-serif font-bold text-gray-900 flex items-center uppercase tracking-wide">
                      <Filter className="h-6 w-6 mr-2 text-amber-600" />
                      Filter Bookings
                    </h3>
                    <button
                      onClick={resetFilters}
                      className="text-sm font-semibold text-amber-600 hover:text-amber-800 uppercase tracking-wide"
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
                <div className="mb-6 flex justify-between items-center bg-gradient-to-r from-amber-100 to-yellow-100 p-4 rounded-xl border-2 border-amber-200">
                  <h2 className="text-2xl font-serif font-bold text-gray-900 uppercase tracking-wide">
                    My Bookings ({filteredBookings.length})
                  </h2>
                  <div className="text-sm font-medium text-gray-700">
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
                  <div className="space-y-6">
                    {filteredBookings.map((booking: ExtendedBooking) => (
                      <div key={`${booking.source}-${booking._id}`} className="bg-white border-2 border-amber-100 rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-4">
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
                            <>
                              <Link
                                to={
                                  booking.type === 'room' 
                                    ? `/invoice/room/${booking._id}` 
                                    : booking.type === 'banquet'
                                    ? `/invoice/banquet/${booking._id}`
                                    : `/receipt/${booking._id}`
                                }
                                className="border border-amber-600 text-amber-700 px-4 py-2 rounded-md text-sm hover:bg-amber-50 font-semibold"
                              >
                                📄 View Invoice
                              </Link>
                            </>
                          )}
                          {/* Complaint button - only show for active bookings (during stay) */}
                          {isBookingActive(booking) && booking.source === 'hotel' && (
                            <button
                              onClick={() => handleOpenComplaint(booking)}
                              className="border border-red-600 text-red-600 px-4 py-2 rounded-md text-sm hover:bg-red-50 flex items-center"
                            >
                              <AlertCircle className="h-4 w-4 mr-1" />
                              File Complaint
                            </button>
                          )}
                          {/* Feedback button for completed bookings */}
                          {booking.status === 'completed' && booking.source === 'hotel' && (
                            <button
                              onClick={() => handleOpenFeedback(booking)}
                              className="border border-green-600 text-green-600 px-4 py-2 rounded-md text-sm hover:bg-green-50 flex items-center"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Share Feedback
                            </button>
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
                <h2 className="text-3xl font-serif font-bold text-gray-900 mb-6 uppercase tracking-wide">
                  Profile Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      First Name
                    </label>
                    <input
                      type="text"
                      title="First Name"
                      placeholder="First name"
                      defaultValue={user?.firstName}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Last Name
                    </label>
                    <input
                      type="text"
                      title="Last Name"
                      placeholder="Last name"
                      defaultValue={user?.lastName}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Email
                    </label>
                    <input
                      type="email"
                      title="Email"
                      placeholder="Email address"
                      defaultValue={user?.email}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Phone
                    </label>
                    <input
                      type="tel"
                      title="Phone"
                      placeholder="Phone number"
                      defaultValue={(user as any)?.phone || ''}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="mt-8">
                  <button className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-8 py-3 rounded-lg hover:from-amber-600 hover:to-yellow-700 transition-all shadow-md font-semibold uppercase tracking-wide">
                    Update Profile
                  </button>
                </div>
              </div>
            )}

        {/* Testimonial Section */}
        <div className="my-12 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-12 border-2 border-amber-200 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="text-6xl text-amber-600 mb-4">"</div>
            <p className="text-xl font-serif italic text-gray-800 mb-4">
              An unforgettable experience! The service and ambiance were exceptional.
            </p>
            <p className="text-lg font-semibold text-gray-900">— Anjali S.</p>
            
            <div className="flex justify-center space-x-4 mt-8">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:from-purple-600 hover:to-pink-600 transition-colors"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-white hover:bg-blue-500 transition-colors"
              >
                <Twitter className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="bg-gray-900 text-white rounded-2xl p-8 text-center">
          <div className="flex flex-wrap justify-center space-x-6 text-sm">
            <a href="#" className="hover:text-amber-400 transition-colors">Contact Us</a>
            <span>|</span>
            <a href="#" className="hover:text-amber-400 transition-colors">Location</a>
            <span>|</span>
            <a href="#" className="hover:text-amber-400 transition-colors">Privacy Policy</a>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            © 2024 Hotel JN Palace. All Rights Reserved.
          </p>
        </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedBookingForFeedback && (
        <FeedbackModal
          bookingId={selectedBookingForFeedback._id}
          bookingType={selectedBookingForFeedback.type}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedBookingForFeedback(null);
          }}
          onSuccess={handleFeedbackSuccess}
        />
      )}

      {/* Complaint Modal */}
      {showComplaintModal && selectedBookingForComplaint && (
        <ComplaintModal
          bookingId={selectedBookingForComplaint._id}
          roomNumber={(selectedBookingForComplaint as any).roomNumber}
          isOpen={showComplaintModal}
          onClose={() => {
            setShowComplaintModal(false);
            setSelectedBookingForComplaint(null);
          }}
          onSuccess={handleComplaintSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;
