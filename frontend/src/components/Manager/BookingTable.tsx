import React from 'react';
import { Eye, Edit, ArrowUpDown, BedDouble, Building, Utensils, Mail, Phone, Calendar, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import BookingStatusBadge from './BookingStatusBadge';

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
  createdAt: string; // Required field
}

interface BookingTableProps {
  bookings: Booking[];
  loading: boolean;
  onView: (booking: Booking) => void;
  onEdit: (booking: Booking) => void;
  onStatusUpdate: (bookingId: string, status: string) => void;
  onPaymentStatusUpdate: (bookingId: string, paymentStatus: string) => void;
  onSort: (field: string) => void;
  sortBy: string;
  sortOrder: string;
}

const BookingTable: React.FC<BookingTableProps> = ({
  bookings,
  loading,
  onView,
  onEdit,
  onStatusUpdate,
  onPaymentStatusUpdate,
  onSort,
  sortBy,
  sortOrder
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'room': return <BedDouble className="h-5 w-5 text-blue-600" />;
      case 'banquet': return <Building className="h-5 w-5 text-purple-600" />;
      case 'restaurant':
      case 'restaurant-order': return <Utensils className="h-5 w-5 text-orange-600" />;
      default: return null;
    }
  };

  const SortButton = ({ field, label }: { field: string; label: string }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center hover:text-indigo-600"
    >
      {label}
      <ArrowUpDown className={`h-4 w-4 ml-1 ${sortBy === field ? 'text-indigo-600' : 'text-gray-400'}`} />
    </button>
  );

  const PaymentBadge: React.FC<{ status: string }> = ({ status }) => {
    const statusMap: { [key: string]: { label: string; color: string } } = {
      paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
      refunded: { label: 'Refunded', color: 'bg-blue-100 text-blue-800' },
    };

    const { label, color } = statusMap[status] || { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    );
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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading bookings...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
        <p className="text-gray-600">Try adjusting your filters to see more results</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booking Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guest Info
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
                    <div className="text-sm font-medium text-gray-900">{booking.bookingId}</div>
                    <div className="text-sm text-gray-500 capitalize">{booking.bookingType}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{booking.guestName}</div>
                    <div className="text-sm text-gray-500">{booking.email}</div>
                    <div className="text-sm text-gray-500">{booking.phone}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {booking.checkIn ? new Date(booking.checkIn).toLocaleDateString() : new Date(booking.date).toLocaleDateString()}
                  </div>
                  {booking.checkOut && (
                    <div className="text-sm text-gray-500">
                      to {new Date(booking.checkOut).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-lg font-bold text-green-600">₹{booking.totalAmount}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={booking.status}
                    onChange={(e) => onStatusUpdate(booking._id, e.target.value)}
                    className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(booking.status)} border-0 cursor-pointer`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={booking.paymentStatus}
                    onChange={(e) => onPaymentStatusUpdate(booking._id, e.target.value)}
                    className={`px-2 py-1 text-xs rounded-full font-medium ${getPaymentStatusColor(booking.paymentStatus)} border-0 cursor-pointer`}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onView(booking)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="View Details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onEdit(booking)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit Booking"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingTable;
