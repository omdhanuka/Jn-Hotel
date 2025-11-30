import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  Calendar,
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Grid,
  List
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface BanquetHall {
  _id: string;
  name: string;
  capacity: number;
  bookedToday: boolean;
  todayBooking?: {
    customerName: string;
    eventType: string;
    guests: number;
  };
  upcomingEvent?: {
    date: string;
    customerName: string;
    eventType: string;
  };
}

interface BanquetBooking {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  resourceId: {
    _id: string;
    name: string;
    capacity: number;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  eventDetails?: {
    eventType: string;
    fullName?: string;
    phone?: string;
    cateringPreference?: string;
    decorationTheme?: string;
  };
  specialRequests?: string;
  createdAt: string;
}

type ViewMode = 'table' | 'calendar';

const BanquetManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  
  // Data states
  const [halls, setHalls] = useState<BanquetHall[]>([]);
  const [bookings, setBookings] = useState<BanquetBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BanquetBooking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalHalls: 0,
    todayBookings: 0,
    pendingApprovals: 0,
    upcomingEvents: 0,
    monthlyRevenue: 0
  });
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
    hallId: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchHalls(),
        fetchBookings(),
        fetchStats()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHalls = async () => {
    try {
      const response = await axios.get('/api/manager/banquets');
      setHalls(response.data.halls || []);
    } catch (error) {
      console.error('Failed to fetch halls:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.paymentStatus !== 'all') params.append('paymentStatus', filters.paymentStatus);
      if (filters.hallId) params.append('hallId', filters.hallId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`/api/manager/banquets/bookings?${params.toString()}`);
      setBookings(response.data.bookings || []);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/manager/banquets/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleViewDetails = async (bookingId: string) => {
    try {
      const response = await axios.get(`/api/manager/banquets/${bookingId}`);
      setSelectedBooking(response.data.booking);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to load booking details');
    }
  };

  const handleApprove = async (bookingId: string) => {
    if (!confirm('Approve this booking?')) return;

    try {
      await axios.patch(`/api/manager/banquets/${bookingId}`, { status: 'confirmed' });
      toast.success('Booking approved successfully');
      fetchData();
      setShowDetailsModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve booking');
    }
  };

  const handleDecline = async (bookingId: string) => {
    if (!confirm('Decline this booking?')) return;

    try {
      await axios.patch(`/api/manager/banquets/${bookingId}`, { status: 'cancelled' });
      toast.success('Booking declined');
      fetchData();
      setShowDetailsModal(false);
    } catch (error) {
      toast.error('Failed to decline booking');
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/manager/dashboard')}
            className="text-indigo-600 hover:text-indigo-800 mb-4"
          >
            ← Back to Dashboard
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Banquet Management</h1>
              <p className="text-gray-600 mt-2">Manage banquet halls, bookings, events, and availability</p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode(viewMode === 'table' ? 'calendar' : 'table')}
                className="px-4 py-2 bg-white border rounded-md hover:bg-gray-50 flex items-center"
              >
                {viewMode === 'table' ? <Calendar className="h-4 w-4 mr-2" /> : <List className="h-4 w-4 mr-2" />}
                {viewMode === 'table' ? 'Calendar View' : 'Table View'}
              </button>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-white border rounded-md hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Halls</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalHalls}</p>
              </div>
              <Building className="h-12 w-12 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
            <p className="text-sm font-medium text-blue-600">Today's Events</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{stats.todayBookings}</p>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-lg shadow-md border border-yellow-200">
            <p className="text-sm font-medium text-yellow-600">Pending Approvals</p>
            <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.pendingApprovals}</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200">
            <p className="text-sm font-medium text-green-600">Upcoming Events</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{stats.upcomingEvents}</p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg shadow-md border border-purple-200">
            <p className="text-sm font-medium text-purple-600">Monthly Revenue</p>
            <p className="text-3xl font-bold text-purple-900 mt-2">₹{stats.monthlyRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Banquet Halls Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Banquet Halls</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {halls.map((hall) => (
              <div key={hall._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{hall.name}</h3>
                    <p className="text-sm text-gray-600">Capacity: {hall.capacity} guests</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    hall.bookedToday ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {hall.bookedToday ? 'Booked Today' : 'Available'}
                  </span>
                </div>
                
                {hall.todayBooking && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                    <p className="text-sm font-medium text-red-900">Today's Event</p>
                    <p className="text-sm text-red-700">{hall.todayBooking.customerName}</p>
                    <p className="text-xs text-red-600">{hall.todayBooking.eventType} • {hall.todayBooking.guests} guests</p>
                  </div>
                )}
                
                {hall.upcomingEvent && !hall.bookedToday && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm font-medium text-blue-900">Upcoming Event</p>
                    <p className="text-sm text-blue-700">{hall.upcomingEvent.customerName}</p>
                    <p className="text-xs text-blue-600">
                      {new Date(hall.upcomingEvent.date).toLocaleDateString()} • {hall.upcomingEvent.eventType}
                    </p>
                  </div>
                )}
                
                {!hall.bookedToday && !hall.upcomingEvent && (
                  <p className="text-sm text-gray-500 italic">No upcoming events</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search customer, booking ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <select
              value={filters.hallId}
              onChange={(e) => setFilters(prev => ({ ...prev, hallId: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Halls</option>
              {halls.map(hall => (
                <option key={hall._id} value={hall._id}>{hall.name}</option>
              ))}
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
            
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2"
              placeholder="From Date"
            />
          </div>
        </div>

        {/* Bookings Table */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hall</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.resourceId.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                        {booking.eventDetails?.eventType || 'Event'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(booking.checkIn).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{booking.guests}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                          {booking.paymentStatus}
                        </span>
                        <div className="text-xs text-gray-600 mt-1">₹{booking.totalAmount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(booking._id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(booking._id)}
                                className="text-green-600 hover:text-green-800"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDecline(booking._id)}
                                className="text-red-600 hover:text-red-800"
                                title="Decline"
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
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Booking Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Customer Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedBooking.user.firstName} {selectedBooking.user.lastName}</p>
                    <p><strong>Email:</strong> {selectedBooking.user.email}</p>
                    <p><strong>Phone:</strong> {selectedBooking.user.phone || 'N/A'}</p>
                  </div>
                </div>

                {/* Event Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Event Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Type:</strong> {selectedBooking.eventDetails?.eventType || 'N/A'}</p>
                    <p><strong>Hall:</strong> {selectedBooking.resourceId.name}</p>
                    <p><strong>Date:</strong> {new Date(selectedBooking.checkIn).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {new Date(selectedBooking.checkIn).toLocaleTimeString()} - {new Date(selectedBooking.checkOut).toLocaleTimeString()}</p>
                    <p><strong>Guests:</strong> {selectedBooking.guests}</p>
                    {selectedBooking.eventDetails?.cateringPreference && (
                      <p><strong>Catering:</strong> {selectedBooking.eventDetails.cateringPreference}</p>
                    )}
                    {selectedBooking.eventDetails?.decorationTheme && (
                      <p><strong>Decoration:</strong> {selectedBooking.eventDetails.decorationTheme}</p>
                    )}
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Payment</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Total Amount:</strong> ₹{selectedBooking.totalAmount}</p>
                    <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>
                      {selectedBooking.paymentStatus}
                    </span></p>
                  </div>
                </div>

                {/* Booking Status */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Booking Status</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span></p>
                    <p><strong>Booking ID:</strong> #{selectedBooking._id.slice(-8).toUpperCase()}</p>
                    <p><strong>Created:</strong> {new Date(selectedBooking.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Special Requests */}
                {selectedBooking.specialRequests && (
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-3">Special Requests</h3>
                    <p className="text-sm text-gray-700">{selectedBooking.specialRequests}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedBooking.status === 'pending' && (
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => handleDecline(selectedBooking._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Decline Booking
                  </button>
                  <button
                    onClick={() => handleApprove(selectedBooking._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve Booking
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BanquetManagement;
