import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, CreditCard, Edit, Check, X, Trash2, Eye, Filter, Receipt, Download, Search, RefreshCw, Mail, Phone, MapPin, Clock, TrendingUp, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Booking {
  _id: string;
  type: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  specialRequests?: string;
  bill?: {
    _id?: string;
    totalAmount?: number;
    createdAt?: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<string | null>(null);
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [newBookingStatus, setNewBookingStatus] = useState('');
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'room', 'banquet'
    status: 'all', // 'all', 'pending', 'confirmed', 'cancelled', 'completed'
    paymentStatus: 'all' // 'all', 'pending', 'paid', 'refunded', 'cancelled', 'failed'
  });
  const [editForm, setEditForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    specialRequests: ''
  });
  const [viewingDetails, setViewingDetails] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    type: 'room',
    checkIn: '',
    checkOut: '',
    guests: 1,
    roomNumber: '',
    specialRequests: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.type !== 'all') queryParams.append('type', filters.type);
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.paymentStatus !== 'all') queryParams.append('paymentStatus', filters.paymentStatus);
      
      const response = await axios.get(`/bookings/admin?${queryParams.toString()}`);
      setBookings(response.data.bookings || []);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (bookingId: string, paymentStatus: string) => {
    try {
      await axios.put(`/bookings/${bookingId}/payment-status`, {
        paymentStatus
      });
      
      setBookings(prev => prev.map(booking => 
        booking._id === bookingId 
          ? { ...booking, paymentStatus, status: paymentStatus === 'paid' ? 'confirmed' : booking.status }
          : booking
      ));
      
      setEditingPayment(null);
      toast.success('Payment status updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update payment status');
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      console.log('Updating booking status:', bookingId, status); // Debug log
      
      const response = await axios.put(`/bookings/${bookingId}/status`, {
        status
      });
      
      console.log('Status update response:', response.data); // Debug log
      
      setBookings(prev => prev.map(booking => 
        booking._id === bookingId 
          ? { 
              ...booking, 
              status,
              paymentStatus: status === 'confirmed' && booking.paymentStatus === 'pending' ? 'paid' : booking.paymentStatus
            }
          : booking
      ));
      
      setEditingStatus(null);
      toast.success('Booking status updated successfully');
    } catch (error: any) {
      console.error('Error updating status:', error); // Debug log
      toast.error(error.response?.data?.message || 'Failed to update booking status');
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.put(`/bookings/${bookingId}/cancel`);
      
      setBookings(prev => prev.map(booking => 
        booking._id === bookingId 
          ? { 
              ...booking, 
              status: 'cancelled',
              paymentStatus: booking.paymentStatus === 'paid' ? 'refunded' : 'cancelled'
            }
          : booking
      ));
      
      toast.success('Booking cancelled successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const startEditBooking = (booking: Booking) => {
    setEditForm({
      checkIn: booking.checkIn.split('T')[0],
      checkOut: booking.checkOut.split('T')[0],
      guests: booking.guests,
      specialRequests: booking.specialRequests || ''
    });
    setEditingBooking(booking._id);
  };

  const updateBooking = async (bookingId: string) => {
    try {
      await axios.put(`/bookings/${bookingId}`, editForm);
      
      setBookings(prev => prev.map(booking => 
        booking._id === bookingId 
          ? { 
              ...booking, 
              checkIn: editForm.checkIn,
              checkOut: editForm.checkOut,
              guests: editForm.guests,
              specialRequests: editForm.specialRequests
            }
          : booking
      ));
      
      setEditingBooking(null);
      toast.success('Booking updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update booking');
    }
  };

  const viewBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setViewingDetails(booking._id);
  };

  const closeDetailsModal = () => {
    setViewingDetails(null);
    setSelectedBooking(null);
  };

  const createNewBooking = async () => {
    try {
      if (!createForm.email || !createForm.checkIn || !createForm.checkOut) {
        toast.error('Please fill in all required fields');
        return;
      }

      await axios.post('/bookings/admin/create', createForm);
      
      toast.success('Booking created successfully');
      setShowCreateModal(false);
      setCreateForm({
        email: '',
        type: 'room',
        checkIn: '',
        checkOut: '',
        guests: 1,
        roomNumber: '',
        specialRequests: ''
      });
      fetchBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    }
  };

  const exportToCSV = () => {
    try {
      // Prepare CSV headers
      const headers = [
        'Booking ID',
        'Guest Name',
        'Email',
        'Type',
        'Check-in',
        'Check-out',
        'Guests',
        'Amount',
        'Status',
        'Payment Status',
        'Created Date'
      ];

      // Prepare CSV rows
      const rows = bookings.map(booking => [
        booking._id.slice(-8),
        `${booking.user.firstName} ${booking.user.lastName}`,
        booking.user.email,
        booking.type,
        new Date(booking.checkIn).toLocaleDateString(),
        new Date(booking.checkOut).toLocaleDateString(),
        booking.guests,
        booking.totalAmount,
        booking.status,
        booking.paymentStatus,
        new Date(booking.createdAt).toLocaleDateString()
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `bookings_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Bookings exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export bookings');
    }
  };

  // Filter bookings by search term
  const filteredBookingsBySearch = bookings.filter(booking => 
    searchTerm === '' ||
    booking.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        return 'bg-yellow-100 text-yellow-800';
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

  const getBookingTypeColor = (type: string) => {
    switch (type) {
      case 'room':
        return 'bg-blue-100 text-blue-800';
      case 'banquet':
        return 'bg-purple-100 text-purple-800';
      case 'table':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    revenue: bookings.reduce((sum, b) => sum + (b.paymentStatus === 'paid' ? b.totalAmount : 0), 0)
  };

  const handleCreateBill = (bookingId: string) => {
    navigate(`/admin/bookings/${bookingId}/bill`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Elegant Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Booking Management
            </h1>
            <p className="text-lg text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Manage and track all hotel reservations with ease
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 font-semibold"
            >
              <Calendar className="h-5 w-5 group-hover:scale-110 transition-transform" />
              Add New Booking
            </button>
            <button
              onClick={exportToCSV}
              className="group px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 font-semibold"
            >
              <Download className="h-5 w-5 group-hover:animate-bounce" />
              Export Data
            </button>
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="group px-6 py-3 bg-white text-indigo-600 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 font-semibold border-2 border-indigo-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Modern Stats Cards with Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 p-6 border-l-4 border-blue-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">TOTAL</span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Total Bookings</p>
            <p className="text-4xl font-extrabold text-gray-900">{stats.total}</p>
            <div className="mt-3 flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>All time</span>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 p-6 border-l-4 border-green-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">ACTIVE</span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Confirmed</p>
            <p className="text-4xl font-extrabold text-gray-900">{stats.confirmed}</p>
            <div className="mt-3 flex items-center text-xs text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              <span>{((stats.confirmed / stats.total) * 100 || 0).toFixed(1)}% of total</span>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 p-6 border-l-4 border-amber-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">PENDING</span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Awaiting Confirmation</p>
            <p className="text-4xl font-extrabold text-gray-900">{stats.pending}</p>
            <div className="mt-3 flex items-center text-xs text-amber-600">
              <AlertCircle className="h-3 w-3 mr-1" />
              <span>Requires attention</span>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 p-6 border-l-4 border-purple-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">REVENUE</span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Total Revenue</p>
            <p className="text-4xl font-extrabold text-gray-900">₹{(stats.revenue / 1000).toFixed(1)}K</p>
            <div className="mt-3 flex items-center text-xs text-purple-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>From confirmed bookings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Filters and Search Section */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 p-6 mb-8">
        <div className="flex flex-col space-y-4">
          {/* Search Bar with Gradient Border */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-20 group-hover:opacity-100 transition duration-300 blur"></div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search by guest name, email, or booking ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-300 text-gray-900 placeholder-gray-400 font-medium"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Filter className="h-4 w-4 text-indigo-600" />
              Filters:
            </div>
            
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2.5 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 font-medium text-gray-700 hover:border-blue-400 cursor-pointer"
            >
              <option value="all">🏨 All Types</option>
              <option value="room">🛏️ Rooms</option>
              <option value="banquet">🎉 Banquets</option>
              <option value="table">🍽️ Tables</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2.5 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-300 font-medium text-gray-700 hover:border-green-400 cursor-pointer"
            >
              <option value="all">📊 All Status</option>
              <option value="pending">⏳ Pending</option>
              <option value="confirmed">✅ Confirmed</option>
              <option value="cancelled">❌ Cancelled</option>
              <option value="completed">🏁 Completed</option>
            </select>

            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              className="px-4 py-2.5 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-300 font-medium text-gray-700 hover:border-purple-400 cursor-pointer"
            >
              <option value="all">💳 All Payments</option>
              <option value="pending">⏰ Pending</option>
              <option value="paid">💰 Paid</option>
              <option value="refunded">🔄 Refunded</option>
              <option value="cancelled">🚫 Cancelled</option>
              <option value="failed">⚠️ Failed</option>
            </select>

            {/* Mobile Action Buttons */}
            <div className="flex lg:hidden gap-2 ml-auto">
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                title="Add New Booking"
              >
                <Calendar className="h-5 w-5" />
              </button>
              <button
                onClick={exportToCSV}
                className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                title="Export to CSV"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={fetchBookings}
                disabled={loading}
                className="p-2.5 bg-white text-indigo-600 rounded-xl hover:shadow-lg transition-all duration-300 border-2 border-indigo-200 disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.type !== 'all' || filters.status !== 'all' || filters.paymentStatus !== 'all' || searchTerm) && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-indigo-600" />
                  Active Filters:
                </span>
                {searchTerm && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-indigo-700 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-indigo-200">
                    🔍 "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="hover:text-indigo-900 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
                {filters.type !== 'all' && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-xs font-semibold border border-purple-200">
                    Type: {filters.type}
                  </span>
                )}
                {filters.status !== 'all' && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-xs font-semibold border border-green-200">
                    Status: {filters.status}
                  </span>
                )}
                {filters.paymentStatus !== 'all' && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                    Payment: {filters.paymentStatus}
                  </span>
                )}
                <button
                  onClick={() => {
                    setFilters({ type: 'all', status: 'all', paymentStatus: 'all' });
                    setSearchTerm('');
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-red-100 to-rose-100 text-red-700 rounded-full text-xs font-semibold hover:from-red-200 hover:to-rose-200 transition-all duration-300 border border-red-200"
                >
                  Clear All ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Showing <span className="font-bold text-indigo-600">{filteredBookingsBySearch.length}</span> of <span className="font-bold">{bookings.length}</span> bookings
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modern Booking Cards */}
      <div className="space-y-4">
        {filteredBookingsBySearch.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                <Calendar className="h-16 w-16 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No bookings found</h3>
              <p className="text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          </div>
        ) : (
          filteredBookingsBySearch.map((booking) => (
            <div 
              key={booking._id} 
              className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-indigo-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Guest Info Section */}
                  <div className="lg:col-span-3 flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {booking.user.firstName.charAt(0)}{booking.user.lastName.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-gray-900 truncate">
                        {booking.user.firstName} {booking.user.lastName}
                      </p>
                      <p className="text-sm text-gray-500 truncate flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />
                        {booking.user.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        #{booking._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Booking Details Section */}
                  <div className="lg:col-span-4 space-y-2">
                    {editingBooking === booking._id ? (
                      <div className="space-y-3">
                        <input
                          type="date"
                          value={editForm.checkIn}
                          onChange={(e) => setEditForm(prev => ({ ...prev, checkIn: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="date"
                          value={editForm.checkOut}
                          onChange={(e) => setEditForm(prev => ({ ...prev, checkOut: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="number"
                          value={editForm.guests}
                          onChange={(e) => setEditForm(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                          min="1"
                          className="w-full px-3 py-2 text-sm border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${getBookingTypeColor(booking.type)}`}>
                            {booking.type === 'room' ? '🛏️' : booking.type === 'banquet' ? '🎉' : '🍽️'} {booking.type.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span className="font-semibold">{booking.guests}</span> guests
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                          <span className="font-medium">
                            {new Date(booking.checkIn).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="mx-2">→</span>
                          <span className="font-medium">
                            {new Date(booking.checkOut).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights
                        </div>
                      </>
                    )}
                  </div>

                  {/* Amount Section */}
                  <div className="lg:col-span-2 flex flex-col justify-center">
                    <div className="text-center lg:text-left">
                      <p className="text-sm text-gray-500 font-medium mb-1">Total Amount</p>
                      <p className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        ₹{booking.totalAmount.toLocaleString()}
                      </p>
                      {booking.bill && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1 justify-center lg:justify-start">
                          <Receipt className="h-3 w-3" />
                          Bill Generated
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Section */}
                  <div className="lg:col-span-3 space-y-2">
                    {/* Booking Status */}
                    {editingStatus === booking._id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={newBookingStatus}
                          onChange={(e) => setNewBookingStatus(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button
                          onClick={() => updateBookingStatus(booking._id, newBookingStatus)}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingStatus(null)}
                          className="p-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setNewBookingStatus(booking.status);
                          setEditingStatus(booking._id);
                        }}
                        disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                        className={`w-full px-4 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${getStatusColor(booking.status)} hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {booking.status === 'confirmed' && '✅ '}
                        {booking.status === 'pending' && '⏳ '}
                        {booking.status === 'cancelled' && '❌ '}
                        {booking.status === 'completed' && '🏁 '}
                        {booking.status.toUpperCase()}
                      </button>
                    )}

                    {/* Payment Status */}
                    {editingPayment === booking._id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={newPaymentStatus}
                          onChange={(e) => setNewPaymentStatus(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="refunded">Refunded</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="failed">Failed</option>
                        </select>
                        <button
                          onClick={() => updatePaymentStatus(booking._id, newPaymentStatus)}
                          className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingPayment(null)}
                          className="p-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setNewPaymentStatus(booking.paymentStatus);
                          setEditingPayment(booking._id);
                        }}
                        disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                        className={`w-full px-4 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${getPaymentStatusColor(booking.paymentStatus)} hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {booking.paymentStatus === 'paid' && '💰 '}
                        {booking.paymentStatus === 'pending' && '⏰ '}
                        {booking.paymentStatus === 'refunded' && '🔄 '}
                        {booking.paymentStatus === 'cancelled' && '🚫 '}
                        {booking.paymentStatus === 'failed' && '⚠️ '}
                        {booking.paymentStatus.toUpperCase()}
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-2">
                  {editingBooking === booking._id ? (
                    <>
                      <button
                        onClick={() => updateBooking(booking._id)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-semibold"
                      >
                        <Check className="h-4 w-4" />
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditingBooking(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300 flex items-center gap-2 font-semibold"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => viewBookingDetails(booking)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-semibold"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </button>
                      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                        <button
                          onClick={() => startEditBooking(booking)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-semibold"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                      )}
                      {!booking.bill && booking.paymentStatus === 'paid' && (
                        <button
                          onClick={() => handleCreateBill(booking._id)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-semibold"
                        >
                          <Receipt className="h-4 w-4" />
                          Create Bill
                        </button>
                      )}
                      {booking.bill && (
                        <Link
                          to={`/admin/bills/${booking.bill._id}`}
                          className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-semibold"
                        >
                          <Receipt className="h-4 w-4" />
                          View Bill
                        </Link>
                      )}
                      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                        <button
                          onClick={() => cancelBooking(booking._id)}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-semibold ml-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                          Cancel Booking
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Special Requests Editor */}
                {editingBooking === booking._id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Special Requests</label>
                    <textarea
                      value={editForm.specialRequests}
                      onChange={(e) => setEditForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                      className="w-full px-4 py-3 text-sm border-2 border-indigo-300 rounded-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500"
                      rows={3}
                      placeholder="Any special requests or notes..."
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modern Booking Details Modal */}
      {viewingDetails && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-extrabold text-white mb-1">Booking Details</h2>
                  <p className="text-indigo-100 text-sm">Complete information about this reservation</p>
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-300 text-white"
                  title="Close Details"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Customer Information */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-indigo-600" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Full Name</label>
                    <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold">
                        {selectedBooking.user.firstName.charAt(0)}{selectedBooking.user.lastName.charAt(0)}
                      </div>
                      {selectedBooking.user.firstName} {selectedBooking.user.lastName}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Email Address</label>
                    <div className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Mail className="h-5 w-5 text-indigo-500" />
                      {selectedBooking.user.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-purple-600" />
                  Booking Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Booking Type</label>
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${getBookingTypeColor(selectedBooking.type)}`}>
                      {selectedBooking.type === 'room' && '🛏️ '}
                      {selectedBooking.type === 'banquet' && '🎉 '}
                      {selectedBooking.type === 'table' && '🍽️ '}
                      {selectedBooking.type.charAt(0).toUpperCase() + selectedBooking.type.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Number of Guests</label>
                    <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-500" />
                      {selectedBooking.guests} guests
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Check-in Date</label>
                    <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-500" />
                      {new Date(selectedBooking.checkIn).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Check-out Date</label>
                    <p className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-red-500" />
                      {new Date(selectedBooking.checkOut).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status and Payment */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Status & Payment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Booking Status</label>
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status === 'confirmed' && '✅ '}
                      {selectedBooking.status === 'pending' && '⏳ '}
                      {selectedBooking.status === 'cancelled' && '❌ '}
                      {selectedBooking.status === 'completed' && '🏁 '}
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Payment Status</label>
                    <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>
                      {selectedBooking.paymentStatus === 'paid' && '💰 '}
                      {selectedBooking.paymentStatus === 'pending' && '⏰ '}
                      {selectedBooking.paymentStatus === 'refunded' && '🔄 '}
                      {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Total Amount</label>
                    <p className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      ₹{selectedBooking.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-2xl border border-amber-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                    Special Requests
                  </h3>
                  <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedBooking.specialRequests}
                  </p>
                </div>
              )}

              {/* Booking Timeline */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-2xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-gray-600" />
                  Booking Timeline
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700">Booking Created</p>
                      <p className="text-base font-medium text-gray-900">
                        {new Date(selectedBooking.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-3 h-3 bg-purple-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700">Duration</p>
                      <p className="text-base font-medium text-gray-900">
                        {(() => {
                          const checkIn = new Date(selectedBooking.checkIn);
                          const checkOut = new Date(selectedBooking.checkOut);
                          if (selectedBooking.type === 'banquet') {
                            const durationHours = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
                            return `${durationHours} hours`;
                          } else {
                            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                            return `${nights} night${nights > 1 ? 's' : ''}`;
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={closeDetailsModal}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all duration-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  closeDetailsModal();
                  startEditBooking(selectedBooking);
                }}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedBooking.status === 'cancelled' || selectedBooking.status === 'completed'}
              >
                Edit Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-extrabold text-white mb-1">Create New Booking</h2>
                  <p className="text-blue-100 text-sm">Manually add a booking for a guest</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-300 text-white"
                  title="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Guest Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Guest Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="guest@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Enter the email of an existing user</p>
              </div>

              {/* Booking Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Booking Type *</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                >
                  <option value="room">🛏️ Room Booking</option>
                  <option value="banquet">🎉 Banquet Hall</option>
                  <option value="table">🍽️ Restaurant Table</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in Date *</label>
                  <input
                    type="datetime-local"
                    value={createForm.checkIn}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, checkIn: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out Date *</label>
                  <input
                    type="datetime-local"
                    value={createForm.checkOut}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, checkOut: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Number of Guests */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Guests *</label>
                <input
                  type="number"
                  value={createForm.guests}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, guests: parseInt(e.target.value) || 1 }))}
                  min="1"
                  max="50"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  required
                />
              </div>

              {/* Room Number (conditional for room bookings) */}
              {createForm.type === 'room' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room Number</label>
                  <input
                    type="text"
                    value={createForm.roomNumber}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, roomNumber: e.target.value }))}
                    placeholder="e.g., 101, 205, etc."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional - Leave blank for auto-assignment</p>
                </div>
              )}

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Special Requests</label>
                <textarea
                  value={createForm.specialRequests}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                  placeholder="Any special requirements or notes..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={createNewBooking}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <Calendar className="h-5 w-5" />
                Create Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
