import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, CreditCard, Edit, Check, X, Trash2, Eye, Filter, Receipt } from 'lucide-react';
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

  const handleCreateBill = (bookingId: string) => {
    navigate(`/admin/bookings/${bookingId}/bill`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Filter by booking type"
              aria-label="Filter by booking type"
            >
              <option value="all">All Types</option>
              <option value="room">Room Bookings</option>
              <option value="banquet">Banquet Bookings</option>
              <option value="table">Table Bookings</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Filter by booking status"
              aria-label="Filter by booking status"
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
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Filter by payment status"
              aria-label="Filter by payment status"
            >
              <option value="all">All Payments</option>
              <option value="pending">Payment Pending</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Payment Cancelled</option>
              <option value="failed">Payment Failed</option>
            </select>
          </div>

          <button 
            onClick={fetchBookings}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filter Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <span className="font-medium mr-2">Active Filters:</span>
            <span className={`px-2 py-1 rounded-full text-xs ${filters.type !== 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
              Type: {filters.type === 'all' ? 'All' : filters.type}
            </span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs ${filters.status !== 'all' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            Status: {filters.status === 'all' ? 'All' : filters.status}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs ${filters.paymentStatus !== 'all' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
            Payment: {filters.paymentStatus === 'all' ? 'All' : filters.paymentStatus}
          </span>
          <div className="ml-auto">
            <span className="font-medium">Total: {bookings.length} bookings</span>
          </div>
        </div>
      </div>
      
      {/* Bookings Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.user.firstName} {booking.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{booking.user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingBooking === booking._id ? (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {booking.type} Booking
                        </div>
                        <label htmlFor={`guests-${booking._id}`} className="sr-only">Number of guests</label>
                        <input
                          id={`guests-${booking._id}`}
                          type="number"
                          value={editForm.guests}
                          onChange={(e) => setEditForm(prev => ({ ...prev, guests: parseInt(e.target.value) }))
                          }
                          className="w-20 text-xs border border-gray-300 rounded px-2 py-1"
                          min="1"
                          title="Number of guests"
                          placeholder="Guests"
                          aria-label="Number of guests"
                        />
                        <span className="text-xs"> guests</span>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {booking.type} Booking
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {booking.guests} guests
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getBookingTypeColor(booking.type)}`}>
                      {booking.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingBooking === booking._id ? (
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={editForm.checkIn}
                          onChange={(e) => setEditForm(prev => ({ ...prev, checkIn: e.target.value }))
                          }
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                          title="Check-in date"
                          aria-label="Check-in date"
                          placeholder="Check-in date"
                        />
                        <input
                          type="date"
                          value={editForm.checkOut}
                          onChange={(e) => setEditForm(prev => ({ ...prev, checkOut: e.target.value }))
                          }
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                          title="Check-out date"
                          aria-label="Check-out date"
                          placeholder="Check-out date"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        <div>
                          <div>{new Date(booking.checkIn).toLocaleDateString()}</div>
                          <div>{new Date(booking.checkOut).toLocaleDateString()}</div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{booking.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingPayment === booking._id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={newPaymentStatus}
                          onChange={(e) => setNewPaymentStatus(e.target.value)}
                          aria-label="Payment status"
                          title="Payment status"
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
                          className="text-green-600 hover:text-green-800"
                          title="Save Payment"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingPayment(null)}
                          className="text-red-600 hover:text-red-800"
                          title="Cancel Payment"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingStatus === booking._id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={newBookingStatus}
                          onChange={(e) => setNewBookingStatus(e.target.value)}
                          aria-label="Booking status"
                          title="Booking status"
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button
                          onClick={() => {
                            console.log('Button clicked, updating to:', newBookingStatus); // Debug log
                            updateBookingStatus(booking._id, newBookingStatus);
                          }}
                          className="text-green-600 hover:text-green-800"
                          title="Save Status"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingStatus(null)}
                          className="text-red-600 hover:text-red-800"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      {editingBooking === booking._id ? (
                        <>
                          <button
                            onClick={() => updateBooking(booking._id)}
                            className="text-green-600 hover:text-green-800"
                            title="Save Changes"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingBooking(null)}
                            className="text-red-600 hover:text-red-800"
                            title="Cancel Edit"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => viewBookingDetails(booking)}
                            className="text-indigo-600 hover:text-indigo-800"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => startEditBooking(booking)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Edit Booking"
                            disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          {editingStatus !== booking._id && editingPayment !== booking._id && (
                            <button
                              onClick={() => {
                                console.log('Edit status clicked for booking:', booking._id); // Debug log
                                setEditingStatus(booking._id);
                                setNewBookingStatus(booking.status);
                              }}
                              className="text-green-600 hover:text-green-800"
                              title="Edit Status"
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
                              className="text-purple-600 hover:text-purple-800"
                              title="Edit Payment Status"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => cancelBooking(booking._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Cancel Booking"
                            disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          
                          {(booking.type === 'room' || booking.type === 'banquet') && (
                            <button
                              onClick={() => handleCreateBill(booking._id)}
                              className="text-green-600 hover:text-green-800"
                              title={booking.bill ? "Edit Bill" : "Create Bill"}
                            >
                              <Receipt className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
    </>
  );
};

export default BookingManagement;
