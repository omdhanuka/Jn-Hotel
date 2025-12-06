import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Users, Search, Eye, CheckCircle, XCircle, Clock, DollarSign, AlertTriangle, Calendar } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface BanquetBooking {
  _id: string;
  type: 'banquet';
  resourceId: any;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'cancelled' | 'failed';
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  eventDetails?: {
    eventType?: string;
    fullName?: string;
    phone?: string;
    bookingType?: string;
  };
  createdAt: string;
  specialRequests?: string;
}

const StaffBanquetBookings: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BanquetBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<any>({});
  
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
    search: ''
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    checkPermissions();
    fetchBanquetBookings();
  }, [filters, pagination.page]);

  const checkPermissions = async () => {
    try {
      const response = await axios.get('/auth/me/permissions');
      setPermissions(response.data.permissions || {});
      
      if (!response.data.permissions.viewBanquets && !response.data.permissions.manageBanquets) {
        toast.error('You do not have permission to view banquet bookings');
        navigate('/staff/dashboard');
      }
    } catch (error) {
      console.error('Failed to check permissions:', error);
      toast.error('Failed to verify permissions');
      navigate('/staff/dashboard');
    }
  };

  const fetchBanquetBookings = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        type: 'banquet'
      });
      
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.paymentStatus !== 'all') params.append('paymentStatus', filters.paymentStatus);
      
      const response = await axios.get(`/staff/bookings?${params.toString()}`);
      
      setBookings(response.data.bookings || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error: any) {
      console.error('Failed to fetch banquet bookings:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied. You do not have permission to view banquet bookings.');
        navigate('/staff/dashboard');
      } else {
        toast.error('Failed to fetch banquet bookings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    if (!permissions.manageBanquets) {
      toast.error('You do not have permission to update bookings');
      return;
    }

    try {
      await axios.put(`/staff/bookings/${bookingId}/status`, { status: newStatus });
      toast.success('Booking status updated successfully');
      fetchBanquetBookings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update booking status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateDuration = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const filteredBookings = bookings.filter(booking => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const guestName = `${booking.user.firstName} ${booking.user.lastName}`.toLowerCase();
      const bookingId = booking._id.slice(-8).toLowerCase();
      const eventType = booking.eventDetails?.eventType?.toLowerCase() || '';
      
      if (!guestName.includes(searchLower) && 
          !bookingId.includes(searchLower) && 
          !eventType.includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Banquet Hall Bookings</h1>
          <p className="text-gray-600 mt-2">
            {permissions.manageBanquets ? 'View and manage' : 'View'} banquet hall bookings
          </p>
        </div>

        {/* Permission Notice */}
        {!permissions.manageBanquets && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                You have view-only access. Contact admin to request management permissions.
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search by guest, booking ID, or event type..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Payments</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No banquet bookings found
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{booking._id.slice(-8).toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.user.firstName} {booking.user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{booking.user.email}</div>
                        {booking.eventDetails?.fullName && (
                          <div className="text-xs text-gray-500">
                            Contact: {booking.eventDetails.fullName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-purple-600 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 capitalize">
                              {booking.eventDetails?.eventType || 'Event'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {booking.guests} guests
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {booking.eventDetails?.bookingType || 'Hourly'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(booking.checkIn).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(booking.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-gray-600 font-medium mt-1">
                          Duration: {calculateDuration(booking.checkIn, booking.checkOut)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{booking.totalAmount}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/booking/${booking._id}`)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {permissions.manageBanquets && booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                                className="text-green-600 hover:text-green-800"
                                title="Confirm Booking"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                                className="text-red-600 hover:text-red-800"
                                title="Cancel Booking"
                              >
                                <XCircle className="h-4 w-4" />
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total bookings)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffBanquetBookings;
