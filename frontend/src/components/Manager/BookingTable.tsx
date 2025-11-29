import React from 'react';
import { Eye, Edit, ArrowUpDown, BedDouble, Building, Utensils, Mail, Phone, Calendar } from 'lucide-react';
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
  createdAt: string; // Required field
}

interface BookingTableProps {
  bookings: Booking[];
  loading: boolean;
  onView: (booking: Booking) => void;
  onEdit: (booking: Booking) => void;
  onSort: (field: string) => void;
  sortBy: string;
  sortOrder: string;
}

const BookingTable: React.FC<BookingTableProps> = ({
  bookings,
  loading,
  onView,
  onEdit,
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
        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
        <p className="text-gray-600">Try adjusting your filters or search criteria</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="bookingId" label="Booking ID" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guest Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="bookingType" label="Type" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="date" label="Date" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guests
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="status" label="Status" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="paymentStatus" label="Payment" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <SortButton field="totalAmount" label="Amount" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking._id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">#{booking.bookingId}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(booking.date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{booking.guestName}</div>
                  <div className="text-xs text-gray-500 flex items-center mt-1">
                    <Mail className="h-3 w-3 mr-1" />
                    {booking.email}
                  </div>
                  {booking.phone && (
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <Phone className="h-3 w-3 mr-1" />
                      {booking.phone}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getTypeIcon(booking.bookingType)}
                    <span className="ml-2 text-sm capitalize">{booking.bookingType.replace('-', ' ')}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(booking.date).toLocaleDateString()}
                  </div>
                  {booking.checkIn && booking.checkOut && (
                    <div className="text-xs text-gray-500">
                      {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.guests}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <BookingStatusBadge status={booking.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PaymentBadge status={booking.paymentStatus} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ₹{booking.totalAmount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2">
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
