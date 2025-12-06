import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, RefreshCw, Download, Calendar, Users, 
  Building, Utensils, Eye, Edit, CheckCircle, XCircle, Clock,
  DollarSign, Phone, Mail, ArrowUpDown
} from 'lucide-react';
import axios from '../../utils/axios'; // Update import
import toast from 'react-hot-toast';
import BookingTable from '../../components/Manager/BookingTable';
import BookingViewModal from '../../components/Manager/BookingViewModal';

interface Booking {
  _id: string;
  bookingId: string;
  bookingType: string;
  guestName: string;
  email: string;
  phone: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  resourceDetails?: any;
  specialRequests?: string;
  createdAt: string; // Make sure this is required, not optional
}

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
}

const AllBookings: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    completed: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchBookings();
  }, [filters, pagination.page]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        type: filters.type,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`/manager/bookings?${params.toString()}`);
      
      setBookings(response.data.bookings);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
      setStats(response.data.stats);
    } catch (error: any) {
      console.error('Failed to fetch bookings:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/manager/login');
      } else {
        toast.error('Failed to fetch bookings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    try {
      await axios.put(`/manager/bookings/${bookingId}/status`, { status });
      toast.success(`Booking status updated to ${status}`);
      fetchBookings(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error(error.response?.data?.message || 'Failed to update booking status');
    }
  };

  const handlePaymentStatusUpdate = async (bookingId: string, paymentStatus: string) => {
    try {
      await axios.put(`/manager/bookings/${bookingId}/status`, { paymentStatus });
      toast.success(`Payment status updated to ${paymentStatus}`);
      fetchBookings(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to update payment status:', error);
      toast.error(error.response?.data?.message || 'Failed to update payment status');
    }
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRefresh = () => {
    fetchBookings();
    toast.success('Bookings refreshed');
  };

  const handleExportCSV = () => {
    const csv = [
      ['Booking ID', 'Guest Name', 'Email', 'Phone', 'Type', 'Date', 'Status', 'Payment', 'Amount'].join(','),
      ...bookings.map(b => [
        b.bookingId,
        b.guestName,
        b.email,
        b.phone,
        b.bookingType,
        new Date(b.date).toLocaleDateString(),
        b.status,
        b.paymentStatus,
        b.totalAmount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('CSV exported successfully');
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowViewModal(true);
  };

  const handleEditBooking = (booking: Booking) => {
    navigate(`/manager/bookings/${booking._id}/edit`);
  };

  const handleSort = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const BookingFilters: React.FC<{
    filters: typeof filters;
    onFilterChange: (key: string, value: string) => void;
    onSearch: (value: string) => void;
  }> = ({ filters, onFilterChange, onSearch }) => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Search</label>
          <div className="mt-1">
            <input
              type="text"
              value={filters.search}
              onChange={e => handleSearch(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search by guest name, email, or phone"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Booking Type</label>
          <div className="mt-1">
            <select
              value={filters.type}
              onChange={e => handleFilterChange('type', e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All</option>
              <option value="room">Room</option>
              <option value="package">Package</option>
              <option value="event">Event</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <div className="mt-1">
            <select
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Date Range</label>
          <div className="mt-1 flex gap-2">
            <input
              type="date"
              value={filters.startDate}
              onChange={e => handleFilterChange('startDate', e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={e => handleFilterChange('endDate', e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div className="sm:col-span-2">
          <button
            onClick={() => setFilters({
              search: '',
              type: 'all',
              status: 'all',
              startDate: '',
              endDate: '',
              sortBy: 'createdAt',
              sortOrder: 'desc'
            })}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/manager/dashboard')}
            className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center"
          >
            ← Back to Dashboard
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Bookings</h1>
              <p className="text-gray-600 mt-2">View and manage all hotel bookings</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={handleExportCSV}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                disabled={bookings.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-sm font-medium text-gray-600">Total Bookings</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
          </div>
          <div className="bg-green-50 p-6 rounded-lg shadow-md">
            <div className="text-sm font-medium text-green-600">Confirmed</div>
            <div className="text-3xl font-bold text-green-900 mt-2">{stats.confirmed}</div>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg shadow-md">
            <div className="text-sm font-medium text-yellow-600">Pending</div>
            <div className="text-3xl font-bold text-yellow-900 mt-2">{stats.pending}</div>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg shadow-md">
            <div className="text-sm font-medium text-blue-600">Completed</div>
            <div className="text-3xl font-bold text-blue-900 mt-2">{stats.completed}</div>
          </div>
          <div className="bg-red-50 p-6 rounded-lg shadow-md">
            <div className="text-sm font-medium text-red-600">Cancelled</div>
            <div className="text-3xl font-bold text-red-900 mt-2">{stats.cancelled}</div>
          </div>
        </div>

        {/* Filters */}
        <BookingFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
        />

        {/* Bookings Table */}
        <BookingTable
          bookings={bookings}
          loading={loading}
          onView={handleViewBooking}
          onEdit={handleEditBooking}
          onStatusUpdate={handleStatusUpdate}
          onPaymentStatusUpdate={handlePaymentStatusUpdate}
          onSort={handleSort}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
        />

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between rounded-b-lg shadow-md">
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

        {/* View Modal */}
        {showViewModal && selectedBooking && (
          <BookingViewModal
            booking={selectedBooking}
            onClose={() => {
              setShowViewModal(false);
              setSelectedBooking(null);
            }}
            onRefresh={fetchBookings}
          />
        )}
      </div>
    </div>
  );
};

export default AllBookings;
