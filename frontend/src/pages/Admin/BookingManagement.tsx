import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, CreditCard, Edit, Check, X, Trash2, Eye, Filter, Receipt, Download, Search, RefreshCw } from 'lucide-react';
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
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Booking Management</h1>
        <p className="text-gray-600">Manage and track all hotel bookings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Bookings</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <Calendar className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Confirmed</p>
              <p className="text-3xl font-bold">{stats.confirmed}</p>
            </div>
            <Check className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </div>
            <Users className="h-12 w-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Revenue</p>
              <p className="text-3xl font-bold">₹{stats.revenue.toLocaleString()}</p>
            </div>
            <CreditCard className="h-12 w-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Filters and Actions Bar */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by name, email, or booking ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Types</option>
              <option value="room">Room</option>
              <option value="banquet">Banquet</option>
              <option value="table">Table</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              title="Export to CSV"
            >
              <Download className="h-5 w-5" />
              <span className="hidden md:inline">Export CSV</span>
            </button>

            <button
              onClick={fetchBookings}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              title="Refresh bookings"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.type !== 'all' || filters.status !== 'all' || filters.paymentStatus !== 'all' || searchTerm) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              {searchTerm && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.type !== 'all' && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                  Type: {filters.type}
                </span>
              )}
              {filters.status !== 'all' && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Status: {filters.status}
                </span>
              )}
              {filters.paymentStatus !== 'all' && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  Payment: {filters.paymentStatus}
                </span>
              )}
              <button
                onClick={() => {
                  setFilters({ type: 'all', status: 'all', paymentStatus: 'all' });
                  setSearchTerm('');
                }}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Clear All
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Showing {filteredBookingsBySearch.length} of {bookings.length} bookings
            </p>
          </div>
        )}
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Type & Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookingsBySearch.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Calendar className="h-12 w-12 mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No bookings found</p>
                      <p className="text-sm">Try adjusting your filters or search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookingsBySearch.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {booking.user.firstName[0]}{booking.user.lastName[0]}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.user.firstName} {booking.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{booking.user.email}</div>
                          <div className="text-xs text-gray-400">ID: {booking._id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingBooking === booking._id ? (
                        <div className="space-y-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBookingTypeColor(booking.type)}`}>
                            {booking.type}
                          </span>
                          <input
                            type="number"
                            value={editForm.guests}
                            onChange={(e) => setEditForm(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                            className="w-20 text-xs border border-gray-300 rounded px-2 py-1"
                            min="1"
                          />
                        </div>
                      ) : (
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBookingTypeColor(booking.type)}`}>
                            {booking.type.toUpperCase()}
                          </span>
                          <div className="text-sm text-gray-600 mt-1 flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {booking.guests} guests
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingBooking === booking._id ? (
                        <div className="space-y-2">
                          <input
                            type="date"
                            value={editForm.checkIn}
                            onChange={(e) => setEditForm(prev => ({ ...prev, checkIn: e.target.value }))}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                          />
                          <input
                            type="date"
                            value={editForm.checkOut}
                            onChange={(e) => setEditForm(prev => ({ ...prev, checkOut: e.target.value }))}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center text-gray-900">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {new Date(booking.checkIn).toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <span className="mr-1">→</span>
                            {new Date(booking.checkOut).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-gray-900">₹{booking.totalAmount.toLocaleString()}</div>
                      {booking.bill && (
                        <div className="text-xs text-green-600 flex items-center mt-1">
                          <Receipt className="h-3 w-3 mr-1" />
                          Bill Generated
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingStatus === booking._id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={newBookingStatus}
                            onChange={(e) => setNewBookingStatus(e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                          </select>
                          <button
                            onClick={() => updateBookingStatus(booking._id, newBookingStatus)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingStatus(null)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingPayment === booking._id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={newPaymentStatus}
                            onChange={(e) => setNewPaymentStatus(e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="refunded">Refunded</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="failed">Failed</option>
                          </select>
                          <button
                            onClick={() => updatePaymentStatus(booking._id, newPaymentStatus)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingPayment(null)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                          {booking.paymentStatus.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {editingBooking === booking._id ? (
                          <>
                            <button
                              onClick={() => updateBooking(booking._id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Save Changes"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingBooking(null)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => viewBookingDetails(booking)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => startEditBooking(booking)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Booking"
                              disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {editingStatus !== booking._id && (
                              <button
                                onClick={() => {
                                  setEditingStatus(booking._id);
                                  setNewBookingStatus(booking.status);
                                }}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Update Status"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            {editingPayment !== booking._id && (
                              <button
                                onClick={() => {
                                  setEditingPayment(booking._id);
                                  setNewPaymentStatus(booking.paymentStatus);
                                }}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Update Payment"
                              >
                                <CreditCard className="h-4 w-4" />
                              </button>
                            )}
                            {(booking.type === 'room' || booking.type === 'banquet') && (
                              <button
                                onClick={() => handleCreateBill(booking._id)}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title={booking.bill ? "Edit Bill" : "Create Bill"}
                              >
                                <Receipt className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => cancelBooking(booking._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancel Booking"
                              disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingBooking && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Special Requests</h3>
          <textarea
            value={editForm.specialRequests}
            onChange={(e) => setEditForm(prev => ({ ...prev, specialRequests: e.target.value }))}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2"
            rows={3}
            placeholder="Any special requests..."
          />
        </div>
      )}

      {/* Booking Details Modal */}
      {viewingDetails && selectedBooking && (
        <div className="fixed inset-0 z-40 overflow-auto bg-black/30 flex items-start justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Booking Details</h2>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-gray-600"
                  title="Close Details"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedBooking.user.firstName} {selectedBooking.user.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.user.email}</p>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Booking Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Booking Type</label>
                    <span className={`inline-flex mt-1 px-2 py-1 text-xs rounded-full ${getBookingTypeColor(selectedBooking.type)}`}>
                      {selectedBooking.type.charAt(0).toUpperCase() + selectedBooking.type.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {selectedBooking.guests} guests
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check-in Date</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(selectedBooking.checkIn).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check-out Date</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
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
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Status & Payment</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Booking Status</label>
                    <span className={`inline-flex mt-1 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                    <span className={`inline-flex mt-1 px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>
                      {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                    <p className="mt-1 text-lg font-bold text-green-600">₹{selectedBooking.totalAmount}</p>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Special Requests</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedBooking.specialRequests}
                  </p>
                </div>
              )}

              {/* Booking Timeline */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Booking Timeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-gray-600">Booking Created:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedBooking.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {selectedBooking.type === 'banquet' && (
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      <span className="text-gray-600">Event Duration:</span>
                      <span className="ml-2 font-medium">
                        {(() => {
                          const checkIn = new Date(selectedBooking.checkIn);
                          const checkOut = new Date(selectedBooking.checkOut);
                          const durationHours = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
                          return `${durationHours} hours`;
                        })()}
                      </span>
                    </div>
                  )}
                  {selectedBooking.type === 'room' && (
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-600">Stay Duration:</span>
                      <span className="ml-2 font-medium">
                        {(() => {
                          const checkIn = new Date(selectedBooking.checkIn);
                          const checkOut = new Date(selectedBooking.checkOut);
                          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                          return `${nights} night${nights > 1 ? 's' : ''}`;
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDetailsModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeDetailsModal();
                    startEditBooking(selectedBooking);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  disabled={selectedBooking.status === 'cancelled' || selectedBooking.status === 'completed'}
                >
                  Edit Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
