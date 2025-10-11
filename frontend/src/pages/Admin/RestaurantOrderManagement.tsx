import React, { useState, useEffect } from 'react';
import { Clock, Users, MapPin, Phone, Mail, Filter, Search, Eye, Edit } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface RestaurantBooking {
  _id: string;
  bookingId: string;
  bookingType: 'table' | 'order';
  fullName: string;
  email: string;
  phone: string;
  date?: string;
  timeSlot?: string;
  numberOfGuests?: number;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  deliveryType?: string;
  deliveryAddress?: string;
  tableNumber?: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  specialRequests?: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const RestaurantOrderManagement: React.FC = () => {
  const [bookings, setBookings] = useState<RestaurantBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'table', 'order'
    status: 'all', // 'all', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<RestaurantBooking | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.type !== 'all') queryParams.append('type', filters.type);
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      
      const response = await axios.get(`/api/restaurant/bookings/admin?${queryParams.toString()}`);
      setBookings(response.data.bookings || []);
    } catch (error) {
      toast.error('Failed to fetch restaurant bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId: string, status: string) => {
    try {
      await axios.put(`/api/restaurant/bookings/${bookingId}/status`, { status });
      toast.success('Status updated successfully');
      fetchBookings();
      setEditingStatus(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'table' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800';
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Restaurant Orders & Reservations</h1>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="table">Table Reservations</option>
            <option value="order">Food Orders</option>
          </select>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <button 
            onClick={fetchBookings}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-blue-600">
            {bookings.filter(b => b.bookingType === 'table').length}
          </div>
          <div className="text-sm text-gray-600">Table Reservations</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-orange-600">
            {bookings.filter(b => b.bookingType === 'order').length}
          </div>
          <div className="text-sm text-gray-600">Food Orders</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-green-600">
            {bookings.filter(b => b.status === 'confirmed').length}
          </div>
          <div className="text-sm text-gray-600">Confirmed</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-2xl font-bold text-yellow-600">
            {bookings.filter(b => b.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
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
              {filteredBookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.bookingId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.fullName}
                      </div>
                      <div className="text-sm text-gray-500">{booking.email}</div>
                      <div className="text-sm text-gray-500">{booking.phone}</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(booking.bookingType)}`}>
                      {booking.bookingType === 'table' ? 'Table Reservation' : 'Food Order'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.bookingType === 'table' ? (
                      <div>
                        <div>Date: {booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A'}</div>
                        <div>Time: {booking.timeSlot || 'N/A'}</div>
                        <div>Guests: {booking.numberOfGuests || 0}</div>
                      </div>
                    ) : (
                      <div>
                        <div>Items: {booking.items?.length || 0}</div>
                        <div>Type: {booking.deliveryType || 'N/A'}</div>
                        {booking.tableNumber && booking.deliveryType === 'dine-in' && (
                          <div className="text-blue-600 font-medium">Table: {booking.tableNumber}</div>
                        )}
                        {booking.deliveryType === 'dine-in' && (
                          <div className="text-orange-600 font-medium text-xs">Pay at Restaurant</div>
                        )}
                        {booking.deliveryAddress && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            Address: {booking.deliveryAddress}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${booking.totalAmount}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingStatus === booking._id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => updateStatus(booking._id, newStatus)}
                          className="text-green-600 hover:text-green-800"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingStatus(null)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingStatus(booking._id);
                          setNewStatus(booking.status);
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                Booking Details - {selectedBooking.bookingId}
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Customer Information</h3>
                  <p className="text-sm text-gray-600">Name: {selectedBooking.fullName}</p>
                  <p className="text-sm text-gray-600">Email: {selectedBooking.email}</p>
                  <p className="text-sm text-gray-600">Phone: {selectedBooking.phone}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900">Booking Information</h3>
                  <p className="text-sm text-gray-600">Type: {selectedBooking.bookingType}</p>
                  <p className="text-sm text-gray-600">Status: {selectedBooking.status}</p>
                  <p className="text-sm text-gray-600">Amount: ${selectedBooking.totalAmount}</p>
                </div>
              </div>

              {selectedBooking.bookingType === 'table' ? (
                <div>
                  <h3 className="font-medium text-gray-900">Table Reservation Details</h3>
                  <p className="text-sm text-gray-600">Date: {selectedBooking.date ? new Date(selectedBooking.date).toLocaleDateString() : 'N/A'}</p>
                  <p className="text-sm text-gray-600">Time Slot: {selectedBooking.timeSlot}</p>
                  <p className="text-sm text-gray-600">Number of Guests: {selectedBooking.numberOfGuests}</p>
                </div>
              ) : (
                <div>
                  <h3 className="font-medium text-gray-900">Order Details</h3>
                  <p className="text-sm text-gray-600">Delivery Type: {selectedBooking.deliveryType}</p>
                  {selectedBooking.tableNumber && selectedBooking.deliveryType === 'dine-in' && (
                    <div>
                      <p className="text-sm text-blue-600 font-medium">
                        Table Number: {selectedBooking.tableNumber}
                      </p>
                      <p className="text-sm text-orange-600 font-medium">
                        Payment: At Restaurant
                      </p>
                    </div>
                  )}
                  {selectedBooking.deliveryAddress && (
                    <p className="text-sm text-gray-600">Address: {selectedBooking.deliveryAddress}</p>
                  )}
                  {selectedBooking.paymentMethod && selectedBooking.deliveryType !== 'dine-in' && (
                    <p className="text-sm text-gray-600">Payment Method: {selectedBooking.paymentMethod}</p>
                  )}
                  
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900">Items Ordered</h4>
                    <div className="space-y-2">
                      {selectedBooking.items?.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.name} x {item.quantity}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedBooking.specialRequests && (
                <div>
                  <h3 className="font-medium text-gray-900">Special Requests</h3>
                  <p className="text-sm text-gray-600">{selectedBooking.specialRequests}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantOrderManagement;
